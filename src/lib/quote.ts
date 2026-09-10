import type { QuoteItem } from "./types";

export type TermQuote = {
  months: number;
  amount: number;
};

export type QuoteTotals = {
  totalList: number;
  totalDiscount: number;
  totalFinal: number;
  balance: number;
  areaTotal: number;
  installments: TermQuote[];
};

export function computeQuote(items: QuoteItem[], downPayment: number, terms: number[] = [24, 36]): QuoteTotals {
  const totalList = items.reduce((sum, item) => sum + item.price, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const totalFinal = totalList - totalDiscount;
  const balance = totalFinal - downPayment;
  return {
    totalList,
    totalDiscount,
    totalFinal,
    balance,
    areaTotal: items.reduce((sum, item) => sum + item.areaM2, 0),
    installments: terms.filter((months) => months > 0).map((months) => ({
      months,
      amount: balance / months,
    })),
  };
}

export function yearsLabel(months: number): string {
  const years = months / 12;
  return Number.isInteger(years) ? `${years} año${years === 1 ? "" : "s"}` : `${months} meses`;
}
