import { useMemo, useState } from "react";
import { NumericInput } from "../components/NumericInput";
import * as api from "../lib/api";
import { lotCode, money } from "../lib/money";
import { useStore } from "../lib/store";
import type { Lot, LotStatus } from "../lib/types";

export function AdminPrecios() {
  const { currentProject, lots, refresh } = useStore();
  const [manzana, setManzana] = useState("TODAS");
  const [drafts, setDrafts] = useState<Record<string, Partial<Lot>>>({});
  const [newLot, setNewLot] = useState({ manzana: "A", numero: 1, areaM2: 90, price: 0 });
  const [message, setMessage] = useState("");

  const manzanas = useMemo(() => ["TODAS", ...[...new Set(lots.map((lot) => lot.manzana))].sort()], [lots]);
  const filtered = lots
    .filter((lot) => manzana === "TODAS" || lot.manzana === manzana)
    .sort((a, b) => a.manzana.localeCompare(b.manzana) || a.numero - b.numero);

  function patch(id: string, field: keyof Lot, value: string | number) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  async function save(lot: Lot) {
    const draft = drafts[lot.id] || {};
    await api.updateLot(lot.id, {
      areaM2: Number(draft.areaM2 ?? lot.areaM2),
      price: Number(draft.price ?? lot.price),
      status: (draft.status as LotStatus) || lot.status,
    });
    setMessage(`Lote ${lotCode(lot.manzana, lot.numero)} actualizado`);
    await refresh();
  }

  async function create() {
    if (!currentProject) return;
    await api.createLot({ ...newLot, projectId: currentProject.id });
    setMessage("Lote creado");
    await refresh();
  }

  if (!currentProject) return <p>Cargando...</p>;

  return (
    <section className="app-card">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Precios y disponibilidad</h1>
          <p className="text-sm text-[var(--muted)]">{filtered.length} lotes en {currentProject.name}</p>
        </div>
        <label className="text-sm">
          Manzana
          <select className="ml-2 rounded border px-3 py-1.5" value={manzana} onChange={(event) => setManzana(event.target.value)}>
            {manzanas.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5 grid gap-2 rounded-xl border p-3 md:grid-cols-5">
        <input className="rounded border px-2 py-1" value={newLot.manzana} onChange={(event) => setNewLot({ ...newLot, manzana: event.target.value.toUpperCase() })} placeholder="Mz" />
        <NumericInput className="rounded border px-2 py-1" value={newLot.numero} onValueChange={(numero) => setNewLot({ ...newLot, numero })} placeholder="Nº" />
        <NumericInput decimal className="rounded border px-2 py-1" value={newLot.areaM2} onValueChange={(areaM2) => setNewLot({ ...newLot, areaM2 })} placeholder="Área" />
        <NumericInput decimal className="rounded border px-2 py-1" value={newLot.price} onValueChange={(price) => setNewLot({ ...newLot, price })} placeholder="Precio" />
        <button className="rounded bg-brand-navy text-white" onClick={() => void create()}>
          Agregar lote
        </button>
      </div>

      {message && <p className="mb-3 text-sm text-brand-green">{message}</p>}

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="p-2">Lote</th>
              <th className="p-2">Área m²</th>
              <th className="p-2">Precio</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Figura</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lot) => {
              const draft = drafts[lot.id] || {};
              return (
                <tr key={lot.id} className="border-b">
                  <td className="p-2 font-medium">{lotCode(lot.manzana, lot.numero)}</td>
                  <td className="p-2">
                    <NumericInput
                      decimal
                      className="w-24 rounded border px-2 py-1"
                      value={Number(draft.areaM2 ?? lot.areaM2)}
                      onValueChange={(areaM2) => patch(lot.id, "areaM2", areaM2)}
                    />
                  </td>
                  <td className="p-2">
                    <NumericInput
                      decimal
                      className="w-32 rounded border px-2 py-1"
                      value={Number(draft.price ?? lot.price)}
                      onValueChange={(price) => patch(lot.id, "price", price)}
                    />
                    <div className="text-xs text-slate-500">{money(Number(draft.price ?? lot.price))}</div>
                  </td>
                  <td className="p-2">
                    <select
                      className="rounded border px-2 py-1"
                      value={(draft.status as LotStatus) || lot.status}
                      onChange={(event) => patch(lot.id, "status", event.target.value)}
                    >
                      <option value="disponible">Disponible</option>
                      <option value="vendido">Vendido</option>
                    </select>
                  </td>
                  <td className="p-2">{lot.polygon ? "Sí" : "Pendiente"}</td>
                  <td className="p-2">
                    <button className="rounded bg-brand-green px-3 py-1 text-white" onClick={() => void save(lot)}>
                      Guardar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
