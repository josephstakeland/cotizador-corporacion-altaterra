import { pdf } from "@react-pdf/renderer";
import { useMemo, useState } from "react";
import { PlanMap } from "../components/map/PlanMap";
import { CotizacionPdf } from "../components/quote/CotizacionPdf";
import * as api from "../lib/api";
import { useAuth } from "../lib/auth";
import { lotCode, money, urlToDataUrl } from "../lib/money";
import { computeQuote } from "../lib/quote";
import { useStore } from "../lib/store";
import type { Lot, QuoteItem } from "../lib/types";

export function Cotizador() {
  const { user } = useAuth();
  const { company, currentProject, lots, refresh } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [clientName, setClientName] = useState("");
  const [downPayment, setDownPayment] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedLots = lots.filter((lot) => selectedIds.includes(lot.id));
  const items: QuoteItem[] = selectedLots.map((lot) => ({
    lotId: lot.id,
    manzana: lot.manzana,
    numero: lot.numero,
    areaM2: lot.areaM2,
    price: lot.price,
    discount: discounts[lot.id] || 0,
  }));
  const totals = useMemo(() => computeQuote(items, downPayment), [items, downPayment]);

  function toggleLot(lot: Lot, additive: boolean) {
    if (lot.status === "vendido") return;
    setSelectedIds((current) => {
      if (additive) {
        return current.includes(lot.id) ? current.filter((id) => id !== lot.id) : [...current, lot.id];
      }
      return current.includes(lot.id) && current.length === 1 ? [] : [lot.id];
    });
  }

  async function downloadPdf() {
    if (!company || !currentProject || !user) return;
    if (!clientName.trim() || items.length === 0) {
      setMessage("Selecciona lotes disponibles y escribe el nombre del cliente.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const [companyLogo, projectLogo] = await Promise.all([
        urlToDataUrl(company.logoUrl),
        urlToDataUrl(currentProject.logoUrl),
      ]);
      await api.saveQuote({
        projectId: currentProject.id,
        advisorId: user.id,
        clientName,
        downPayment,
        items,
      });
      const blob = await pdf(
        <CotizacionPdf
          company={company}
          project={currentProject}
          clientName={clientName}
          items={items}
          downPayment={downPayment}
          companyLogo={companyLogo}
          projectLogo={projectLogo}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotizacion_${currentProject.slug}_${clientName.replace(/\s+/g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      await refresh();
      setMessage("Cotización generada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo generar el PDF");
    } finally {
      setBusy(false);
    }
  }

  if (!currentProject) return <p>Cargando proyecto...</p>;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-brand-navy">Plano de {currentProject.name}</h1>
            <p className="text-sm text-slate-500">Verde: disponible · Rojo: vendido. Click para agregar a la cotización.</p>
          </div>
          {currentProject.logoUrl && <img src={currentProject.logoUrl} alt="" className="h-12 object-contain" />}
        </div>
        <PlanMap
          planUrl={currentProject.planUrl}
          lots={lots}
          tool="select"
          mode="view"
          selectedIds={selectedIds}
          draftPoints={[]}
          onDraftPoints={() => undefined}
          onSelect={toggleLot}
        />
      </section>

      <aside className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-brand-navy">Cotización</h2>
        <label className="mb-3 block text-sm">
          Cliente
          <input className="mt-1 w-full rounded-lg border px-3 py-2" value={clientName} onChange={(event) => setClientName(event.target.value)} />
        </label>
        <div className="space-y-3">
          {selectedLots.length === 0 && <p className="text-sm text-slate-500">Aún no hay lotes seleccionados.</p>}
          {selectedLots.map((lot) => (
            <div key={lot.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <strong>{lotCode(lot.manzana, lot.numero)}</strong>
                <button className="text-red-600" onClick={() => setSelectedIds((ids) => ids.filter((id) => id !== lot.id))}>
                  Quitar
                </button>
              </div>
              <p>{lot.areaM2.toFixed(2)} m² · {money(lot.price)}</p>
              <label className="mt-2 block">
                Descuento
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={discounts[lot.id] || 0}
                  onChange={(event) => setDiscounts((current) => ({ ...current, [lot.id]: Number(event.target.value) }))}
                />
              </label>
            </div>
          ))}
        </div>
        <label className="mt-4 block text-sm">
          Inicial del cliente
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={downPayment}
            onChange={(event) => setDownPayment(Number(event.target.value))}
          />
        </label>
        <div className="mt-4 space-y-1 text-sm">
          <p>Total lista: {money(totals.totalList)}</p>
          <p>Total descuento: {money(totals.totalDiscount)}</p>
          <p className="font-semibold">Total con descuento: {money(totals.totalFinal)}</p>
          <p>Saldo: {money(totals.balance)}</p>
          <p>Cuota 24 meses: {money(totals.installment24)}</p>
          <p>Cuota 36 meses: {money(totals.installment36)}</p>
        </div>
        {company?.ruc && <p className="mt-2 text-xs text-slate-500">RUC {company.ruc}</p>}
        {message && <p className="mt-3 text-sm text-brand-green">{message}</p>}
        <button disabled={busy} className="mt-4 w-full rounded-lg bg-brand-navy py-2 text-white" onClick={() => void downloadPdf()}>
          {busy ? "Generando..." : "Descargar cotización PDF"}
        </button>
      </aside>
    </div>
  );
}
