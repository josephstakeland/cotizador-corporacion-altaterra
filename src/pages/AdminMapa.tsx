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
  const [reshaping, setReshaping] = useState(false);
  const [lotId, setLotId] = useState("");
  const [status, setStatus] = useState<LotStatus>("disponible");
  const [filterMz, setFilterMz] = useState("TODAS");

  const manzanas = useMemo(
    () => [...new Set(lots.map((lot) => lot.manzana))].sort(),
    [lots],
  );

  const unmapped = useMemo(
    () =>
      lots
        .filter((lot) => !lot.polygon || lot.id === editingLot?.id)
        .filter((lot) => filterMz === "TODAS" || lot.manzana === filterMz)
        .sort((a, b) => a.manzana.localeCompare(b.manzana) || a.numero - b.numero),
    [lots, editingLot, filterMz],
  );

  function openAssign(points: Point[], lot?: Lot) {
    setReshaping(false);
    setPendingPolygon(points);
    setEditingLot(lot || null);
    setFilterMz(lot?.manzana || "TODAS");
    setLotId(lot?.id || "");
    setStatus(lot?.status || "disponible");
  }

  function startReshape(points: Point[], lot?: Lot) {
    if (points.length < 3) return;
    setPendingPolygon(null);
    setEditingLot(lot || null);
    setDraftPoints(points.map((point) => ({ ...point })));
    setReshaping(true);
    setTool("reshape");
  }

  function cancelReshape() {
    setReshaping(false);
    setDraftPoints([]);
    setEditingLot(null);
  }

  async function saveReshape() {
    if (draftPoints.length < 3) return;
    if (editingLot) {
      await api.updateLot(editingLot.id, { polygon: draftPoints });
      setReshaping(false);
      setDraftPoints([]);
      setEditingLot(null);
      await refresh();
      return;
    }
    setReshaping(false);
    openAssign(draftPoints);
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
    setReshaping(false);
    await refresh();
  }

  async function removePolygon() {
    if (!editingLot) return;
    await api.updateLot(editingLot.id, { polygon: null });
    setPendingPolygon(null);
    setEditingLot(null);
    setReshaping(false);
    setDraftPoints([]);
    await refresh();
  }

  if (!currentProject) return <p>Cargando plano...</p>;

  return (
    <section className="app-card">
      <h1 className="text-xl font-semibold">Editor de unidades por dibujo</h1>
      <p className="mb-4 text-sm text-[var(--muted)]">
        {reshaping
          ? "Arrastra los puntos dorados para ajustar el lote. Clic en un lado para agregar un punto. Doble clic en un punto para quitarlo."
          : "Plano horizontal. Verde = disponible, rojo = vendido. Usa Editar figura para mover los puntos de un lote irregular."}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["select", "Solo selección"],
            ["polyline", "Puntos"],
            ["rect", "Rectángulo"],
            ["reshape", "Editar figura"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className={`rounded-full px-3 py-1.5 text-sm ${tool === value ? "bg-white text-brand-navy" : "border border-white/15"}`}
            onClick={() => {
              setTool(value);
              if (value !== "reshape" && reshaping) cancelReshape();
            }}
          >
            {label}
          </button>
        ))}
        <button className="rounded-full border border-white/15 px-3 py-1.5 text-sm" onClick={() => setDraftPoints((points) => points.slice(0, -1))}>
          Deshacer punto
        </button>
        <button className="rounded-full border border-white/15 px-3 py-1.5 text-sm" onClick={() => setDraftPoints([])}>
          Limpiar puntos
        </button>
        {reshaping ? (
          <>
            <button
              className="rounded-full bg-white px-3 py-1.5 text-sm text-brand-navy"
              onClick={() => void saveReshape()}
              disabled={draftPoints.length < 3}
            >
              Guardar figura
            </button>
            <button className="rounded-full border border-white/15 px-3 py-1.5 text-sm" onClick={cancelReshape}>
              Cancelar edición
            </button>
          </>
        ) : (
          <button
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm"
            onClick={() => {
              if (draftPoints.length >= 3) openAssign(draftPoints);
            }}
          >
            Crear figura
          </button>
        )}
      </div>

      <PlanMap
        planUrl={currentProject.planUrl}
        lots={lots}
        tool={reshaping ? "reshape" : tool}
        mode="edit"
        selectedIds={editingLot ? [editingLot.id] : []}
        draftPoints={draftPoints}
        onDraftPoints={setDraftPoints}
        onSelect={(lot) => {
          if (tool === "reshape" || reshaping) {
            if (lot.polygon) startReshape(lot.polygon, lot);
            return;
          }
          openAssign(lot.polygon || [], lot);
        }}
        onCreatePolygon={(points) => openAssign(points)}
        onRequestEdit={(lot) => {
          if (lot.polygon) startReshape(lot.polygon, lot);
        }}
        reshapeLotId={reshaping ? editingLot?.id || null : null}
        containerClassName="aspect-[1.41/1] max-h-[72vh] min-h-[240px] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-200"
      />

      {pendingPolygon && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#f7f4ee] p-5 text-[#122033] shadow-2xl">
            <h2 className="text-lg font-semibold text-[#0f2744]">Asignar lote</h2>
            <p className="mb-4 text-sm text-slate-600">Selecciona manzana, lote y si está disponible o vendido.</p>
            <label className="mb-3 block text-sm font-medium text-[#0f2744]">
              Manzana
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[#122033]"
                value={filterMz}
                onChange={(event) => {
                  setFilterMz(event.target.value);
                  setLotId("");
                }}
              >
                <option value="TODAS">Todas</option>
                {manzanas.map((item) => (
                  <option key={item} value={item}>Mz {item}</option>
                ))}
              </select>
            </label>
            <label className="mb-3 block text-sm font-medium text-[#0f2744]">
              Lote
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[#122033]"
                value={lotId}
                onChange={(event) => setLotId(event.target.value)}
              >
                <option value="">Selecciona un lote</option>
                {unmapped.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lotCode(lot.manzana, lot.numero)} · {lot.areaM2} m² · {lot.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="mb-4 block text-sm font-medium text-[#0f2744]">
              Estado
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[#122033]"
                value={status}
                onChange={(event) => setStatus(event.target.value as LotStatus)}
              >
                <option value="disponible">Disponible (verde)</option>
                <option value="vendido">Vendido (rojo)</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl bg-[#0f2744] px-4 py-2.5 text-white" onClick={() => void saveAssignment()} disabled={!lotId}>
                Guardar
              </button>
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[#0f2744]"
                onClick={() => startReshape(pendingPolygon, editingLot || undefined)}
              >
                Editar figura
              </button>
              {editingLot && (
                <button className="rounded-xl border border-red-200 px-4 py-2.5 text-red-700" onClick={() => void removePolygon()}>
                  Quitar figura
                </button>
              )}
              <button className="ml-auto rounded-xl border border-slate-300 px-4 py-2.5" onClick={() => setPendingPolygon(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
