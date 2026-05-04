export async function generateThumbnail(
  container: HTMLDivElement | null,
  targetWidth = 600,
  targetHeight = 400
): Promise<string | null> {
  if (!container) return null;

  const svgEl = container.querySelector("svg");
  if (!svgEl) return null;

  const origWidth = svgEl.clientWidth || targetWidth;
  const origHeight = svgEl.scrollHeight || targetHeight;

  const clone = svgEl.cloneNode(true) as SVGElement;
  clone.setAttribute("width", String(origWidth));
  clone.setAttribute("height", String(origHeight));

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(targetWidth / origWidth, targetHeight / origHeight);
      const canvasW = Math.round(origWidth * scale);
      const canvasH = Math.round(origHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        resolve(null);
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, 0, 0, canvasW, canvasH);

      URL.revokeObjectURL(svgUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      resolve(null);
    };

    img.src = svgUrl;
  });
}
