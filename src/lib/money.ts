export function money(value: number): string {
  const formatted = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `S/ ${formatted}`;
}

export function lotCode(manzana: string, numero: number): string {
  return `${manzana}-${numero}`;
}

export function formatLongDate(date = new Date()): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function newId(): string {
  return crypto.randomUUID();
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function blobToPngDataUrl(blob: Blob): Promise<string> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return blobToDataUrl(blob);
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.toDataURL("image/png");
  } catch {
    return blobToDataUrl(blob);
  }
}

export async function urlToDataUrl(url: string): Promise<string> {
  if (!url.trim()) return "";
  if (url.startsWith("data:image/")) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const blob = await response.blob();
    const type = blob.type || "";
    if (type && !type.startsWith("image/") && type !== "application/octet-stream") return "";
    return blobToPngDataUrl(blob);
  } catch {
    return "";
  }
}
