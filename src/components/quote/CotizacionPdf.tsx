import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatLongDate, lotCode, money } from "../../lib/money";
import { computeQuote, yearsLabel } from "../../lib/quote";
import type { Company, Project, QuoteItem } from "../../lib/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#122033", fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  logo: { width: 72, height: 72 },
  title: { fontSize: 20, color: "#0f2744", textAlign: "center", fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 12, color: "#1f6b3a", textAlign: "center", marginTop: 4, fontFamily: "Helvetica-Bold" },
  ruc: { fontSize: 9, color: "#122033", textAlign: "center", marginTop: 3 },
  meta: { marginTop: 14, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#d6d3d1", paddingBottom: 8 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  metaItem: { width: "48%" },
  lotsTitle: { color: "#1f6b3a", textAlign: "center", marginBottom: 10, fontFamily: "Helvetica-Bold" },
  section: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f2744", marginTop: 12, marginBottom: 6 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0f2744", color: "white", padding: 5 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", padding: 5 },
  cell: { flex: 1, textAlign: "center" },
  totals: { marginTop: 4, alignItems: "flex-end" },
  totalLine: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 2 },
  finance: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: 10, justifyContent: "space-between", marginTop: 8 },
  footer: { marginTop: 18, textAlign: "center", color: "#57534e", fontSize: 8 },
  note: { marginTop: 8, fontSize: 8, color: "#44403c" },
});

type Props = {
  company: Company;
  project: Project;
  clientName: string;
  clientPhone: string;
  clientDni: string;
  advisorName: string;
  items: QuoteItem[];
  downPayment: number;
  terms: number[];
  quoteDate: Date;
  companyLogo: string;
  projectLogo: string;
};

function dash(value?: string) {
  return value?.trim() || "________________";
}

export function CotizacionPdf({
  company,
  project,
  clientName,
  clientPhone,
  clientDni,
  advisorName,
  items,
  downPayment,
  terms,
  quoteDate,
  companyLogo,
  projectLogo,
}: Props) {
  const totals = computeQuote(items, downPayment, terms);
  const lotLabel = items.map((item) => lotCode(item.manzana, item.numero)).join(", ");
  const manzanas = [...new Set(items.map((item) => item.manzana))].join(", ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={companyLogo} style={styles.logo} />
          <View>
            <Text style={styles.title}>COTIZACIÓN</Text>
            <Text style={styles.subtitle}>{project.name.toUpperCase()}</Text>
            {company.ruc ? <Text style={styles.ruc}>RUC {company.ruc}</Text> : null}
            {company.phone ? <Text style={styles.ruc}>Tel. {company.phone}</Text> : null}
          </View>
          <Image src={projectLogo} style={styles.logo} />
        </View>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>Cliente: {dash(clientName)}</Text>
            <Text style={styles.metaItem}>DNI: {dash(clientDni)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>Teléfono del cliente: {dash(clientPhone)}</Text>
            <Text style={styles.metaItem}>Asesor: {dash(advisorName)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>Fecha: {formatLongDate(quoteDate)}</Text>
            <Text style={styles.metaItem}>Teléfono de la empresa: {dash(company.phone)}</Text>
          </View>
        </View>
        <Text style={styles.lotsTitle}>MZ {manzanas} · LOTES {lotLabel}</Text>

        <Text style={styles.section}>Detalle de los lotes</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.cell}>LOTE</Text>
          <Text style={styles.cell}>ÁREA</Text>
          <Text style={styles.cell}>PRECIO LISTA</Text>
          <Text style={styles.cell}>DESCUENTO</Text>
          <Text style={styles.cell}>PRECIO FINAL</Text>
        </View>
        {items.map((item) => (
          <View key={item.lotId} style={styles.row}>
            <Text style={styles.cell}>{lotCode(item.manzana, item.numero)}</Text>
            <Text style={styles.cell}>{item.areaM2.toFixed(2)} m²</Text>
            <Text style={styles.cell}>{money(item.price)}</Text>
            <Text style={styles.cell}>{money(item.discount)}</Text>
            <Text style={styles.cell}>{money(item.price - item.discount)}</Text>
          </View>
        ))}
        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text>TOTAL DESCUENTO</Text>
            <Text>{money(totals.totalDiscount)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text>TOTAL LISTA</Text>
            <Text>{money(totals.totalList)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text>TOTAL CON DESCUENTO</Text>
            <Text>{money(totals.totalFinal)}</Text>
          </View>
        </View>

        <Text style={styles.section}>Resumen financiero</Text>
        <View style={styles.finance}>
          <View>
            <Text>TOTAL CON DESCUENTO</Text>
            <Text>{money(totals.totalFinal)}</Text>
          </View>
          <View>
            <Text>INICIAL DEL CLIENTE</Text>
            <Text>- {money(downPayment)}</Text>
          </View>
          <View>
            <Text>SALDO A FINANCIAR</Text>
            <Text>{money(totals.balance)}</Text>
          </View>
        </View>

        <Text style={styles.section}>Opciones de financiamiento</Text>
        <View style={[styles.tableHeader, { backgroundColor: "#1f6b3a" }]}>
          <Text style={styles.cell}>PLAZO</Text>
          <Text style={styles.cell}>N.º DE CUOTAS</Text>
          <Text style={styles.cell}>SALDO A FINANCIAR</Text>
          <Text style={styles.cell}>CUOTA MENSUAL*</Text>
        </View>
        {totals.installments.map((term) => (
          <View key={term.months} style={styles.row}>
            <Text style={styles.cell}>{yearsLabel(term.months)}</Text>
            <Text style={styles.cell}>{term.months} meses</Text>
            <Text style={styles.cell}>{money(totals.balance)}</Text>
            <Text style={styles.cell}>{money(term.amount)}</Text>
          </View>
        ))}
        <Text style={styles.note}>
          * Las cuotas corresponden a una división simple del saldo entre el número de meses. No incluyen intereses, gastos administrativos, trámites u otros cargos que pudieran aplicar.
        </Text>

        <Text style={styles.section}>Resumen de la propuesta</Text>
        <Text>• Proyecto: {project.name}.</Text>
        <Text>• Lotes: Mz {manzanas}, {lotLabel}.</Text>
        <Text>• Área total: {totals.areaTotal.toFixed(2)} m².</Text>
        <Text>• Descuento comercial: {money(totals.totalDiscount)}.</Text>
        <Text>• Inicial del cliente: {money(downPayment)}.</Text>
        <Text>• Saldo a financiar: {money(totals.balance)}.</Text>
        <Text style={styles.note}>
          NOTA: Esta cotización es referencial y está sujeta a disponibilidad de los lotes, validación comercial y condiciones vigentes de {company.name} al momento de la separación.
        </Text>
        <Text style={styles.footer}>
          {company.name.toUpperCase()}
          {company.ruc ? `  ·  RUC ${company.ruc}` : ""}
          {company.phone ? `  ·  Tel. ${company.phone}` : ""}  ·  {project.name.toUpperCase()}
        </Text>
      </Page>
    </Document>
  );
}
