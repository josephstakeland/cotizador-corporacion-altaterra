import { pdf } from "@react-pdf/renderer";
import { Calendar, Download, Printer, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlanMap } from "../components/map/PlanMap";
import { CotizacionPdf } from "../components/quote/CotizacionPdf";
import { QuotePreview } from "../components/quote/QuotePreview";
import * as api from "../lib/api";
import { useAuth } from "../lib/auth";
import { lotCode, money, urlToDataUrl } from "../lib/money";
import { exportMarkedPlanPdf } from "../lib/plan-export";
import { computeQuote } from "../lib/quote";
import { useStore } from "../lib/store";
import type { Lot, QuoteItem } from "../lib/types";

function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function parseInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function Cotizador() {
  const { user } = useAuth();
  const { company, projects, currentProject, setCurrentProjectId, lots, refresh } = useStore();
  const [params, setParams] = useSearchParams();
  const showMap = params.get("plano") === "1";
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [clientName, setClientName] = useState("");
  const [quoteDate, setQuoteDate] = useState(todayInputValue);
  const dateRef = useRef<HTMLInputElement>(null);
  const [downPayment, setDownPayment] = useState(0);
  const [terms, setTerms] = useState<number[]>([24, 36]);
  const [manzana, setManzana] = useState("A");
  const [busy, setBusy] = useState(false);
  const [downloadingPlan, setDownloadingPlan] = useState(false);
  const [message, setMessage] = useState("");

  const manzanas = useMemo(() => [...new Set(lots.map((lot) => lot.manzana))].sort(), [lots]);
  useEffect(() => {
    if (manzanas.length && !manzanas.includes(manzana)) setManzana(manzanas[0]);
  }, [manzanas, manzana]);
  const selectedLots = lots.filter((lot) => selectedIds.includes(lot.id));
  const items: QuoteItem[] = selectedLots.map((lot) => ({
    lotId: lot.id,
    manzana: lot.manzana,
    numero: lot.numero,
    areaM2: lot.areaM2,
    price: prices[lot.id] ?? lot.price,
    discount: discounts[lot.id] || 0,
  }));
  const totals = useMemo(() => computeQuote(items, downPayment, terms), [items, downPayment, terms]);
  const visibleLots = lots.filter((lot) => lot.manzana === manzana).sort((a, b) => a.numero - b.numero);

  function toggleLot(lot: Lot) {
    if (lot.status === "vendido") return;
    setSelectedIds((current) => (current.includes(lot.id) ? current.filter((id) => id !== lot.id) : [...current, lot.id]));
  }

  async function downloadPdf() {
    if (!company || !currentProject) return;
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
      if (user) {
        await api.saveQuote({
          projectId: currentProject.id,
          advisorId: user.id,
          clientName,
          downPayment,
          items,
        });
      }
      const blob = await pdf(
        <CotizacionPdf
          company={company}
          project={currentProject}
          clientName={clientName}
          items={items}
          downPayment={downPayment}
          terms={terms}
          quoteDate={parseInputDate(quoteDate)}
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

  async function downloadPlan() {
    if (!currentProject?.planUrl) {
      setMessage("Este proyecto no tiene plano para descargar.");
      return;
    }
    setDownloadingPlan(true);
    setMessage("");
    try {
      const blob = await exportMarkedPlanPdf({
        planUrl: currentProject.planUrl,
        lots,
        selectedIds,
        projectName: currentProject.name,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Plano_${currentProject.slug}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Plano PDF descargado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo generar el PDF del plano");
    } finally {
      setDownloadingPlan(false);
    }
  }

  if (!currentProject || !company) return <p>Cargando proyecto...</p>;

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,380px)_1fr]">
        <div className="space-y-4">
          <section className="app-card">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">1</span>
              <h2 className="font-semibold">Proyecto y cliente</h2>
            </div>
            <label className="block text-xs text-[var(--muted)]">
              Proyecto
              <select className="app-input" value={currentProject.id} onChange={(event) => setCurrentProjectId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--muted)]">
                Nombre del cliente
                <input className="app-input" value={clientName} onChange={(event) => setClientName(event.target.value)} />
              </label>
              <label className="text-xs text-[var(--muted)]">
                Fecha
                <div className="relative">
                  <input
                    ref={dateRef}
                    type="date"
                    className="app-input pr-12"
                    value={quoteDate}
                    onChange={(event) => setQuoteDate(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-1.5 top-[calc(50%+2px)] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-white/10 text-[var(--text)] hover:bg-white/20"
                    onClick={() => {
                      const input = dateRef.current;
                      if (!input) return;
                      if (typeof input.showPicker === "function") input.showPicker();
                      else input.focus();
                    }}
                    title="Abrir calendario"
                    aria-label="Abrir calendario"
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </label>
            </div>
          </section>

          <section className="app-card">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">2</span>
              <h2 className="font-semibold">Selecciona lotes</h2>
            </div>
            <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {manzanas.map((item) => (
                <button
                  key={item}
                  className={`chip ${manzana === item ? "bg-white text-brand-navy" : "bg-white/5 text-[var(--muted)]"}`}
                  onClick={() => setManzana(item)}
                >
                  Mz {item}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {visibleLots.map((lot) => {
                const selected = selectedIds.includes(lot.id);
                const sold = lot.status === "vendido";
                const quotePrice = prices[lot.id] ?? lot.price;
                return (
                  <button
                    key={lot.id}
                    disabled={sold}
                    onClick={() => toggleLot(lot)}
                    className={`rounded-xl border p-2 text-left ${
                      sold
                        ? "border-red-500/40 bg-red-950/40 text-red-200"
                        : selected
                          ? "border-amber-300/70 bg-amber-300/10"
                          : "border-white/10 bg-white/5"
                    }`}
                  >
                    <p className={`text-sm font-bold ${sold ? "text-red-300" : "text-amber-300"}`}>{lotCode(lot.manzana, lot.numero)}</p>
                    <p className="text-[11px] text-[var(--muted)]">{lot.areaM2.toFixed(2)} m²</p>
                    <p className="text-[11px]">{money(quotePrice)}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="app-card">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">3</span>
              <h2 className="font-semibold">Lotes seleccionados</h2>
            </div>
            <p className="mb-3 text-xs text-[var(--muted)]">
              Edita el precio de cotización y el descuento para armar la oferta. El precio de lista del lote se mantiene como referencia.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[var(--muted)]">
                  <tr>
                    <th className="p-1 text-left">Lote</th>
                    <th className="p-1">Área</th>
                    <th className="p-1">Precio</th>
                    <th className="p-1">Desc.</th>
                    <th className="p-1" />
                  </tr>
                </thead>
                <tbody>
                  {selectedLots.map((lot) => {
                    const quotePrice = prices[lot.id] ?? lot.price;
                    return (
                    <tr key={lot.id}>
                      <td className="p-1 font-semibold text-amber-300">{lotCode(lot.manzana, lot.numero)}</td>
                      <td className="p-1 text-center">{lot.areaM2.toFixed(2)}</td>
                      <td className="p-1">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="app-input mt-0 w-28 py-1"
                          value={quotePrice}
                          onChange={(event) => setPrices((current) => ({ ...current, [lot.id]: Number(event.target.value) }))}
                          aria-label={`Precio de cotización ${lotCode(lot.manzana, lot.numero)}`}
                        />
                        {quotePrice !== lot.price ? (
                          <p className="mt-0.5 text-[10px] text-[var(--muted)]">Lista {money(lot.price)}</p>
                        ) : null}
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          min={0}
                          className="app-input mt-0 w-20 py-1"
                          value={discounts[lot.id] || 0}
                          onChange={(event) => setDiscounts((current) => ({ ...current, [lot.id]: Number(event.target.value) }))}
                        />
                      </td>
                      <td className="p-1">
                        <button
                          type="button"
                          className="app-btn min-h-9 border border-white/15 px-3 text-xs"
                          onClick={() => {
                            setSelectedIds((ids) => ids.filter((id) => id !== lot.id));
                            setPrices((current) => {
                              const next = { ...current };
                              delete next[lot.id];
                              return next;
                            });
                          }}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <label className="mt-3 block text-xs text-[var(--muted)]">
              Inicial del cliente (S/)
              <input type="number" min={0} className="app-input" value={downPayment} onChange={(event) => setDownPayment(Number(event.target.value))} />
            </label>
            <div className="mt-3 space-y-1 text-sm">
              <p>Total lista <span className="float-right">{money(totals.totalList)}</span></p>
              <p>Total descuento <span className="float-right">{money(totals.totalDiscount)}</span></p>
              <p>Inicial del cliente <span className="float-right">{money(downPayment)}</span></p>
              <p className="font-semibold text-brand-gold">Saldo a financiar <span className="float-right">{money(totals.balance)}</span></p>
            </div>
          </section>

          <section className="app-card">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">4</span>
              <h2 className="font-semibold">Plazos de financiamiento</h2>
            </div>
            <div className="space-y-2">
              {terms.map((term, index) => (
                <div key={`${term}-${index}`} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      className="app-input mt-0 min-w-0 flex-1"
                      value={term}
                      onChange={(event) => setTerms((current) => current.map((value, i) => (i === index ? Number(event.target.value) : value)))}
                    />
                    <button
                      type="button"
                      className="app-btn min-h-11 shrink-0 rounded-xl border border-white/20 bg-white/10 px-4 text-sm"
                      onClick={() => setTerms((current) => current.filter((_, i) => i !== index))}
                    >
                      Quitar
                    </button>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {term} meses ({(term / 12).toFixed(term % 12 === 0 ? 0 : 1)} años)
                  </p>
                </div>
              ))}
            </div>
            <button className="mt-3 text-sm text-sky-300" onClick={() => setTerms((current) => [...current, 48])}>+ Agregar plazo</button>
          </section>
        </div>

        <section className="app-card overflow-x-auto">
          <div className="no-print mb-3 flex flex-wrap justify-end gap-2">
            <button className="app-btn app-btn-primary" onClick={() => { setSelectedIds([]); setPrices({}); setDiscounts({}); setDownPayment(0); setClientName(""); setQuoteDate(todayInputValue()); }}>
              <RotateCcw size={14} /> Limpiar todo
            </button>
            <button className="app-btn app-btn-primary" onClick={() => window.print()}>
              <Printer size={14} /> Imprimir
            </button>
            <button disabled={busy} className="app-btn bg-white text-brand-navy" onClick={() => void downloadPdf()}>
              {busy ? "Generando..." : "Descargar PDF"}
            </button>
          </div>
          {message && <p className="no-print mb-3 text-sm text-emerald-300">{message}</p>}
          <QuotePreview
            company={company}
            project={currentProject}
            clientName={clientName}
            items={items}
            downPayment={downPayment}
            terms={terms}
            quoteDate={parseInputDate(quoteDate)}
          />
        </section>
      </div>

      {showMap && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1220]/95 p-3" style={{ paddingTop: "max(0.75rem, var(--safe-top))", paddingBottom: "max(0.75rem, var(--safe-bottom))" }}>
          <div className="no-print mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Plano de lotización · {currentProject.name}</p>
              <p className="text-xs text-[var(--muted)]">Pasa el puntero sobre un lote para ver precio y disponibilidad. Espacio + arrastrar para mover.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="app-btn app-btn-primary"
                disabled={downloadingPlan}
                onClick={() => void downloadPlan()}
              >
                <Download size={14} /> {downloadingPlan ? "Generando PDF..." : "Descargar PDF"}
              </button>
              <button className="app-btn bg-white text-brand-navy" onClick={() => setParams({})}>Cerrar</button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <PlanMap
              planUrl={currentProject.planUrl}
              lots={lots}
              tool="select"
              mode="view"
              selectedIds={selectedIds}
              draftPoints={[]}
              onDraftPoints={() => undefined}
              onSelect={(lot) => toggleLot(lot)}
              onDownload={() => void downloadPlan()}
              downloadBusy={downloadingPlan}
              containerClassName="h-[calc(100dvh-6.5rem)] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-200"
            />
          </div>
        </div>
      )}
    </>
  );
}
