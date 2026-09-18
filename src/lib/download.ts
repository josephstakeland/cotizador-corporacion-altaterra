function isEmbedded() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** Abre una pestaña en el clic, antes de generar el PDF, para no perder el gesto del usuario. */
export function preparePopupDownload(): Window | null {
  if (!isEmbedded()) return null;
  const popup = window.open("about:blank", "_blank");
  if (popup) {
    try {
      popup.document.write(
        "<!doctype html><title>Generando PDF…</title><body style='font-family:sans-serif;padding:24px;color:#122033'>Generando PDF…</body>",
      );
      popup.document.close();
    } catch {
      // La pestaña sigue sirviendo para colocar el archivo después.
    }
  }
  return popup;
}

export function saveBlobFile(blob: Blob, filename: string, popup?: Window | null) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.target = "_blank";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  if (popup && !popup.closed) {
    try {
      popup.location.replace(url);
    } catch {
      popup.close();
    }
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
