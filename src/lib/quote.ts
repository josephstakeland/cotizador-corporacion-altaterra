import type { QuoteItem } from "./types";

export type QuoteTotals = {
  totalList: number;
  totalDiscount: number;
  totalFinal: number;
  balance: number;
  installment24: number;
  installment36: number;
  areaTotal: number;
};

export function computeQuote(items: QuoteItem[], downPayment: number): QuoteTotals {
  const totalList = items.reduce((sum, item) => sum + item.price, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const totalFinal = totalList - totalDiscount;
  const balance = totalFinal - downPayment;
  return {
    totalList,
    totalDiscount,
    totalFinal,
    balance,
    installment24: balance / 24,
    installment36: balance / 36,
    areaTotal: items.reduce((sum, item) => sum + item.areaM2, 0),
  };
}
