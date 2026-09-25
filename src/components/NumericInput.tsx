import { useEffect, useRef, useState } from "react";

type NumericInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  decimal?: boolean;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
};

function sanitize(raw: string, decimal: boolean) {
  if (!decimal) return raw.replace(/\D/g, "");
  const normalized = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const [whole, ...fraction] = normalized.split(".");
  return fraction.length ? `${whole}.${fraction.join("")}` : whole;
}

export function NumericInput({
  value,
  onValueChange,
  decimal = false,
  className,
  placeholder,
  "aria-label": ariaLabel,
}: NumericInputProps) {
  const [text, setText] = useState(() => String(value));
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setText(Number.isFinite(value) ? String(value) : "");
  }, [value]);

  return (
    <input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      autoComplete="off"
      className={className}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={text}
      onFocus={(event) => {
        editing.current = true;
        const input = event.currentTarget;
        requestAnimationFrame(() => input.select());
      }}
      onMouseUp={(event) => event.currentTarget.select()}
      onBlur={() => {
        editing.current = false;
        if (text.trim() === "" || text === ".") {
          setText(String(value));
          return;
        }
        const parsed = Number(text);
        if (!Number.isFinite(parsed)) {
          setText(String(value));
          return;
        }
        onValueChange(parsed);
        setText(String(parsed));
      }}
      onChange={(event) => {
        const raw = sanitize(event.target.value, decimal);
        setText(raw);
        if (raw === "" || raw === ".") return;
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) onValueChange(parsed);
      }}
    />
  );
}
