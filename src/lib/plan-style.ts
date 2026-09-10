import type { Lot, LotStatus } from "./types";

export function lotFill(status: LotStatus, hovered = false): string {
  if (status === "vendido") return hovered ? "rgba(220,38,38,0.62)" : "rgba(220,38,38,0.45)";
  return hovered ? "rgba(34,197,94,0.62)" : "rgba(34,197,94,0.42)";
}

export function lotStroke(lot: Pick<Lot, "status">, selected: boolean, hovered = false): string {
  if (selected) return "#ca8a04";
  if (hovered) return "#f5d48a";
  return lot.status === "vendido" ? "#991b1b" : "#15803d";
}
