import { pdf } from "@react-pdf/renderer";
import { PlanPdf } from "../components/quote/PlanPdf";
import { lotCode } from "./money";
import { lotFill, lotStroke } from "./plan-style";
import type { Lot, Point } from "./types";

const MAX_SIDE = 3600;

function centroid(points: Point[]): Point {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar el plano"));
    image.src = url;
  });
}

export async function renderMarkedPlanImage(
  planUrl: string,
  lots: Lot[],
  selectedIds: string[],
): Promise<{ dataUrl: string; width: number; height: number }> {
  const image = await loadImage(planUrl);
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo dibujar el plano");

  ctx.fillStyle = "#e8edf3";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  const strokeW = Math.max(2, Math.round(Math.min(width, height) / 520));
  const fontSize = Math.max(11, Math.round(Math.min(width, height) / 85));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const lot of lots) {
    if (!lot.polygon || lot.polygon.length < 3) continue;
    const selected = selectedIds.includes(lot.id);
    ctx.beginPath();
    lot.polygon.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = lotFill(lot.status);
    ctx.fill();
    ctx.strokeStyle = lotStroke(lot, selected);
    ctx.lineWidth = selected ? strokeW * 2.2 : strokeW;
    ctx.stroke();

    const center = centroid(lot.polygon);
    const label = lotCode(lot.manzana, lot.numero);
    ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
    ctx.lineWidth = Math.max(3, Math.round(fontSize / 4));
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.strokeText(label, center.x * width, center.y * height);
    ctx.fillStyle = "#111827";
    ctx.fillText(label, center.x * width, center.y * height);
  }

  return { dataUrl: canvas.toDataURL("image/jpeg", 0.88), width, height };
}

export async function exportMarkedPlanPdf(input: {
  planUrl: string;
  lots: Lot[];
  selectedIds: string[];
  projectName: string;
}): Promise<Blob> {
  const marked = await renderMarkedPlanImage(input.planUrl, input.lots, input.selectedIds);
  return pdf(
    <PlanPdf
      projectName={input.projectName}
      imageSrc={marked.dataUrl}
      imageWidth={marked.width}
      imageHeight={marked.height}
    />,
  ).toBlob();
}
