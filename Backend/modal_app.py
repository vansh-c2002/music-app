import modal
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = modal.App("ohsheet-omr")

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
    )
    .pip_install("fastapi", "python-multipart", "poetry")
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
)


@web_app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    contents = await file.read()

    with tempfile.TemporaryDirectory() as tmpdir:
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


@app.function(gpu="T4", image=image, timeout=600)
@modal.asgi_app()
def fastapi_app():
    return web_app
