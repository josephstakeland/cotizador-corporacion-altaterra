import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

const MAX_SIDE = 5200;
const JPEG_QUALITY = 0.94;

export type PreparedPlan = {
  blob: Blob;
  ext: "jpg" | "png";
  contentType: string;
  fromPdf: boolean;
};

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar la imagen del plano"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

async function pdfFirstPageToJpeg(file: File): Promise<Blob> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  try {
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(MAX_SIDE / base.width, MAX_SIDE / base.height);
    const viewport = page.getViewport({ scale: Math.max(scale, 1) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo dibujar el PDF");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    return canvasToJpeg(canvas);
  } finally {
    await pdf.destroy();
  }
}

export async function preparePlanFile(file: File): Promise<PreparedPlan> {
  if (isPdf(file)) {
    return {
      blob: await pdfFirstPageToJpeg(file),
      ext: "jpg",
      contentType: "image/jpeg",
      fromPdf: true,
    };
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("El plano debe ser una imagen o un PDF");
  }
  const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
  return {
    blob: file,
    ext: isPng ? "png" : "jpg",
    contentType: file.type || (isPng ? "image/png" : "image/jpeg"),
    fromPdf: false,
  };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
