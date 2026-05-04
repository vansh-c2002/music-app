import modal
import subprocess
import tempfile
import os
import json
from pathlib import Path
from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = modal.App("ohsheet-omr")

try:
    from pdf2image import convert_from_bytes
except ImportError:
    pass

try:
    import firebase_admin
    from firebase_admin import credentials as fb_credentials, auth as fb_auth
except ImportError:
    pass

image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04",
        add_python="3.11",
    )
    .apt_install(
        "git",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "libsm6",
        "libxrender1",
        "libxext6",
        "poppler-utils",
    )
    .pip_install("fastapi", "python-multipart", "poetry", "pdf2image", "firebase-admin")
    .run_commands(
        "git clone https://github.com/liebharc/homr /homr",
        "cd /homr && poetry config virtualenvs.create false"
        " && poetry install --only main,gpu",
        # Pre-download model weights into the image so runtime has no network dependency
        "python -c 'from homr.main import download_weights; download_weights(True)'",
    )
)

web_app = FastAPI()
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

_bearer_scheme = HTTPBearer()
_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    if not sa_json:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON secret not set")
    cred = fb_credentials.Certificate(json.loads(sa_json))
    _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


async def verify_token(
    creds: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    try:
        fa = _get_firebase_app()
        decoded = fb_auth.verify_id_token(creds.credentials, app=fa)
        return decoded["uid"]
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {exc}")


@web_app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), uid: str = Depends(verify_token)):
    contents = await file.read()

    with tempfile.TemporaryDirectory() as tmpdir:
        # if PDF, convert first page to PNG before passing to HOMR
        if file.content_type == "application/pdf":
            images = convert_from_bytes(contents, dpi=300, first_page=1, last_page=1)
            image_path = Path(tmpdir) / "input.png"
            images[0].save(str(image_path), "PNG")
        else:
            suffix = Path(file.filename or "upload.png").suffix or ".png"
            image_path = Path(tmpdir) / f"input{suffix}"
            image_path.write_bytes(contents)

        result = subprocess.run(
            ["homr", str(image_path)],
            cwd=tmpdir,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"homr failed: {result.stderr}",
            )
        xml_files = list(Path(tmpdir).glob("*.musicxml"))
        if not xml_files:
            raise HTTPException(
                status_code=500,
                detail="homr produced no output file",
            )
        xml_content = xml_files[0].read_text(encoding="utf-8")

    return Response(
        content=xml_content,
        media_type="text/xml",
        headers={"Content-Disposition": "attachment; filename=score.musicxml"},
    )

@web_app.post("/transcribe-multi")
async def transcribe_multi(files: list[UploadFile] = File(...), uid: str = Depends(verify_token)):
    import io
    all_images: list[bytes] = []

    for file in files:
        contents = await file.read()

        if file.content_type == "application/pdf":
            pages = convert_from_bytes(contents, dpi=300)
            for page in pages:
                buf = io.BytesIO()
                page.save(buf, format="PNG")
                all_images.append(buf.getvalue())
        else:
            all_images.append(contents)

    all_xml: list[str] = []

    with tempfile.TemporaryDirectory() as tmpdir:
        for i, image_bytes in enumerate(all_images):
            image_path = Path(tmpdir) / f"input_{i}.png"
            image_path.write_bytes(image_bytes)

            result = subprocess.run(
                ["homr", str(image_path)],
                cwd=tmpdir,
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                raise HTTPException(
                    status_code=500,
                    detail=f"homr failed on page {i+1}: {result.stderr}",
                )

            xml_files = list(Path(tmpdir).glob(f"input_{i}*.musicxml"))
            if not xml_files:
                raise HTTPException(
                    status_code=500,
                    detail=f"homr produced no output for page {i+1}",
                )
            all_xml.append(xml_files[0].read_text(encoding="utf-8"))

    return Response(
        content=all_xml[0],
        media_type="text/xml",
        headers={"Content-Disposition": "attachment; filename=score.musicxml"},
    )


@app.function(
    gpu="T4",
    image=image,
    timeout=600,
    secrets=[modal.Secret.from_name("firebase-service-account")],
)
@modal.asgi_app()
def fastapi_app():
    return web_app
