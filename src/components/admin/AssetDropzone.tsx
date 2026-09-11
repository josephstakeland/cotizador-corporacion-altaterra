import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { LoaderCircle, Upload } from "lucide-react";

type AssetDropzoneProps = {
  label: string;
  hint: string;
  accept: string;
  busy?: boolean;
  preview?: ReactNode;
  fileName?: string;
  onFile: (file: File) => void;
};

export function AssetDropzone({
  label,
  hint,
  accept,
  busy,
  preview,
  fileName,
  onFile,
}: AssetDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function takeFile(file?: File) {
    if (!file || busy) return;
    onFile(file);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragOver(false);
    takeFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-5 text-left transition ${
          dragOver ? "border-brand-gold bg-white/5" : "border-[var(--line)] hover:border-white/30"
        } ${busy ? "opacity-70" : ""}`}
      >
        <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-black/20">
          {busy ? (
            <span className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <LoaderCircle className="animate-spin" size={18} />
              Procesando archivo...
            </span>
          ) : (
            preview || (
              <span className="flex flex-col items-center gap-2 text-[var(--muted)]">
                <Upload size={22} />
                <span className="text-xs">Arrastra o elige un archivo</span>
              </span>
            )
          )}
        </div>
        <div className="w-full">
          <p className="text-xs text-[var(--muted)]">{hint}</p>
          {fileName && <p className="mt-1 truncate text-xs text-brand-gold">{fileName}</p>}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          takeFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
