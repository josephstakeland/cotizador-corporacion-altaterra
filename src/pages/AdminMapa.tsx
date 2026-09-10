import { useMemo, useState } from "react";
import { PlanMap, type MapTool } from "../components/map/PlanMap";
import * as api from "../lib/api";
import { lotCode } from "../lib/money";
import { useStore } from "../lib/store";
import type { Lot, LotStatus, Point } from "../lib/types";

export function AdminMapa() {
  const { currentProject, lots, refresh } = useStore();
  const [tool, setTool] = useState<MapTool>("select");
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [pendingPolygon, setPendingPolygon] = useState<Point[] | null>(null);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [lotId, setLotId] = useState("");
  const [status, setStatus] = useState<LotStatus>("disponible");

  const unmapped = useMemo(
    () => lots.filter((lot) => !lot.polygon || lot.id === editingLot?.id).sort((a, b) => a.manzana.localeCompare(b.manzana) || a.numero - b.numero),
    [lots, editingLot],
  );

  function openAssign(points: Point[], lot?: Lot) {
    setPendingPolygon(points);
    setEditingLot(lot || null);
    setLotId(lot?.id || unmapped[0]?.id || "");
    setStatus(lot?.status || "disponible");
  }

  async function saveAssignment() {
    const targetId = lotId || editingLot?.id;
    if (!targetId || !pendingPolygon) return;
    if (editingLot && editingLot.id !== targetId) {
      await api.updateLot(editingLot.id, { polygon: null });
    }
    await api.updateLot(targetId, { polygon: pendingPolygon, status });
    setPendingPolygon(null);
    setEditingLot(null);
    setDraftPoints([]);
    await refresh();
  }

  async function removePolygon() {
    if (!editingLot) return;
    await api.updateLot(editingLot.id, { polygon: null });
    setPendingPolygon(null);
    setEditingLot(null);
    await refresh();
  }

  if (!currentProject) return <p>Cargando plano...</p>;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h1 className="text-xl font-semibold text-brand-navy">Editor de unidades por dibujo</h1>
      <p className="mb-4 text-sm text-slate-500">
        Dibuja en el plano y luego asigna la figura a un lote. Verde = disponible, rojo = vendido. Click derecho sobre una figura para editarla.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["select", "Solo selección"],
            ["polyline", "Puntos"],
            ["rect", "Rectángulo"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className={`rounded-full px-3 py-1.5 text-sm ${tool === value ? "bg-brand-navy text-white" : "border"}`}
            onClick={() => setTool(value)}
          >
            {label}
          </button>
        ))}
        <button className="rounded-full border px-3 py-1.5 text-sm" onClick={() => setDraftPoints((points) => points.slice(0, -1))}>
          Deshacer punto
        </button>
        <button className="rounded-full border px-3 py-1.5 text-sm" onClick={() => setDraftPoints([])}>
          Limpiar puntos
        </button>
        <button
          className="rounded-full border px-3 py-1.5 text-sm"
          onClick={() => {
            if (draftPoints.length >= 3) openAssign(draftPoints);
          }}
        >
          Crear figura
        </button>
      </div>

      <PlanMap
        planUrl={currentProject.planUrl}
        lots={lots}
        tool={tool}
        mode="edit"
        selectedIds={editingLot ? [editingLot.id] : []}
        draftPoints={draftPoints}
        onDraftPoints={setDraftPoints}
        onSelect={(lot) => openAssign(lot.polygon || [], lot)}
        onCreatePolygon={(points) => openAssign(points)}
        onRequestEdit={(lot) => openAssign(lot.polygon || [], lot)}
      />

      {pendingPolygon && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold">Asignar lote</h2>
            <label className="mb-3 block text-sm">
              Lote
              <select className="mt-1 w-full rounded border px-3 py-2" value={lotId} onChange={(event) => setLotId(event.target.value)}>
                {unmapped.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lotCode(lot.manzana, lot.numero)} · {lot.areaM2} m²
                  </option>
                ))}
              </select>
            </label>
            <label className="mb-4 block text-sm">
              Estado
              <select className="mt-1 w-full rounded border px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as LotStatus)}>
                <option value="disponible">Disponible (verde)</option>
                <option value="vendido">Vendido (rojo)</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button className="rounded-lg bg-brand-navy px-4 py-2 text-white" onClick={() => void saveAssignment()}>
                Guardar
              </button>
              {editingLot && (
                <button className="rounded-lg border px-4 py-2 text-red-600" onClick={() => void removePolygon()}>
                  Quitar figura
                </button>
              )}
              <button className="ml-auto rounded-lg border px-4 py-2" onClick={() => setPendingPolygon(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
