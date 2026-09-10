import { formatLongDate, lotCode, money } from "../../lib/money";
import { computeQuote, yearsLabel } from "../../lib/quote";
import type { Company, Project, QuoteItem } from "../../lib/types";

type Props = {
  company: Company;
  project: Project;
  clientName: string;
  items: QuoteItem[];
  downPayment: number;
  terms: number[];
  quoteDate: Date;
};

export function QuotePreview({ company, project, clientName, items, downPayment, terms, quoteDate }: Props) {
  const totals = computeQuote(items, downPayment, terms);
  const lotLabel = items.map((item) => lotCode(item.manzana, item.numero)).join(", ");
  const manzanas = [...new Set(items.map((item) => item.manzana))].join(", ");

  return (
    <article
      id="quote-paper"
      className="mx-auto w-full max-w-[760px] p-5 text-[#122033] shadow-xl sm:p-8"
      style={{ backgroundColor: "#ffffff" }}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <img src={company.logoUrl} alt="" className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
        <div className="text-center">
          <h2 className="text-xl font-extrabold tracking-wide text-[#0f2744] sm:text-2xl">COTIZACIÓN</h2>
          <p className="text-sm font-bold text-[#1f6b3a]">{project.name.toUpperCase()}</p>
          {company.ruc ? <p className="mt-0.5 text-xs text-[#122033]">RUC {company.ruc}</p> : null}
        </div>
        <img src={project.logoUrl} alt="" className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
      </header>

      <div className="mb-3 flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-2 text-sm">
        <p>Cliente: <span className="font-medium">{clientName || "________________"}</span></p>
        <p>Fecha: {formatLongDate(quoteDate)}</p>
      </div>
      <p className="mb-4 text-center text-sm font-bold text-[#1f6b3a]">
        {items.length ? `MZ ${manzanas} · LOTES ${lotLabel}` : "Selecciona lotes para cotizar"}
      </p>

      <h3 className="mb-2 text-sm font-bold text-[#0f2744]">Detalle de los lotes</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-[11px] sm:text-xs">
          <thead>
            <tr className="bg-[#0f2744] text-white">
              <th className="p-2">LOTE</th>
              <th className="p-2">ÁREA</th>
              <th className="p-2">PRECIO LISTA</th>
              <th className="p-2">DESCUENTO</th>
              <th className="p-2">PRECIO FINAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.lotId} className="border-b border-slate-200">
                <td className="p-2">{lotCode(item.manzana, item.numero)}</td>
                <td className="p-2">{item.areaM2.toFixed(2)} m²</td>
                <td className="p-2">{money(item.price)}</td>
                <td className="p-2">{money(item.discount)}</td>
                <td className="p-2">{money(item.price - item.discount)}</td>
              </tr>
            ))}
            {items.length > 0 && (
              <tr className="font-semibold">
                <td className="p-2">Total ({totals.areaTotal.toFixed(2)} m²)</td>
                <td className="p-2" />
                <td className="p-2">{money(totals.totalList)}</td>
                <td className="p-2">{money(totals.totalDiscount)}</td>
                <td className="p-2">{money(totals.totalFinal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-bold text-[#0f2744]">Resumen financiero</h3>
      <div className="grid grid-cols-1 gap-2 bg-[#f3f4f6] p-3 text-center text-sm sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase text-slate-500">Total con descuento</p>
          <p className="font-semibold">{money(totals.totalFinal)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-500">Inicial del cliente</p>
          <p className="font-semibold">-{money(downPayment)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-500">Saldo a financiar</p>
          <p className="font-semibold">{money(totals.balance)}</p>
        </div>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-bold text-[#0f2744]">Opciones de financiamiento</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-[11px] sm:text-xs">
          <thead>
            <tr className="bg-[#1f6b3a] text-white">
              <th className="p-2">PLAZO</th>
              <th className="p-2">N.º DE CUOTAS</th>
              <th className="p-2">SALDO A FINANCIAR</th>
              <th className="p-2">CUOTA MENSUAL*</th>
            </tr>
          </thead>
          <tbody>
            {totals.installments.map((term) => (
              <tr key={term.months} className="border-b border-slate-200">
                <td className="p-2">{yearsLabel(term.months)}</td>
                <td className="p-2">{term.months} meses</td>
                <td className="p-2">{money(totals.balance)}</td>
                <td className="p-2 font-semibold text-[#1f6b3a]">{money(term.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        * Las cuotas corresponden a una división simple del saldo entre el número de meses. No incluyen intereses, gastos administrativos, trámites u otros cargos que pudieran aplicar.
      </p>

      <h3 className="mb-2 mt-5 text-sm font-bold text-[#0f2744]">Resumen de la propuesta</h3>
      <ul className="space-y-1 text-sm">
        <li>• Proyecto: {project.name}.</li>
        <li>• Lotes: {items.length ? `Mz ${manzanas}, ${lotLabel}` : "—"}.</li>
        <li>• Área total: {totals.areaTotal.toFixed(2)} m².</li>
        <li>• Descuento comercial: {money(totals.totalDiscount)}{items.length ? ` total` : ""}.</li>
        <li>• Inicial del cliente: {money(downPayment)}.</li>
        <li>• Saldo a financiar: {money(totals.balance)}.</li>
      </ul>
      <p className="mt-3 text-[10px] text-slate-500">
        NOTA: Esta cotización es referencial y está sujeta a disponibilidad de los lotes, validación comercial y condiciones vigentes de {company.name} al momento de la separación.
      </p>
      <p className="mt-6 text-center text-[10px] tracking-wide text-slate-500">
        {company.name.toUpperCase()}
        {company.ruc ? ` · RUC ${company.ruc}` : ""} · {project.name.toUpperCase()}
      </p>
    </article>
  );
}
