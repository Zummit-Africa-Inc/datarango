/** A price as the catalogue stores it: minor units (kobo, cents), never a float. */
export interface MoneyPrice {
  currency: string;
  amountMinor: number;
}

/** What a card or detail page shows (§6.4). */
export type Pricing =
  | { kind: "free" }
  | { kind: "included"; plan: "pro" | "org" }
  | {
      kind: "paid";
      amountMinor: number;
      currency: string;
      compareAtMinor?: number;
      tokenPrice?: number;
    };

/**
 * Parses the catalogue's `pricesJson` (a serialised `Price[]`). Returns `null`
 * when it doesn't parse: the server then treats the course as premium (it
 * fails closed), so callers should show no price rather than "Free".
 */
export const parsePrices = (pricesJson: string | null | undefined): MoneyPrice[] | null => {
  if (!pricesJson) return [];
  try {
    const parsed: unknown = JSON.parse(pricesJson);
    if (!Array.isArray(parsed)) return null;
    return parsed.flatMap((p) => {
      if (!p || typeof p !== "object") return [];
      const { currency, amountMinor } = p as Record<string, unknown>;
      if (typeof currency !== "string" || !currency.trim()) return [];
      const amount = typeof amountMinor === "number" ? amountMinor : Number(amountMinor);
      return Number.isFinite(amount) && amount > 0
        ? [{ currency: currency.trim().toUpperCase(), amountMinor: amount }]
        : [];
    });
  } catch {
    return null;
  }
};

/**
 * Turns catalogue prices into display pricing: no non-free price → free,
 * otherwise the price in `preferredCurrency` (or the first one). Compare-at and
 * token prices aren't in the contract yet (docs/redesign/contract-gaps.md).
 */
export const pricingFromPrices = (prices: MoneyPrice[], preferredCurrency?: string): Pricing => {
  const main = prices.find((p) => p.currency === preferredCurrency?.toUpperCase()) ?? prices[0];
  return main
    ? { kind: "paid", amountMinor: main.amountMinor, currency: main.currency }
    : { kind: "free" };
};

const fractionDigits = (currency: string) => {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
};

/**
 * Formats minor units as currency with `Intl.NumberFormat` (§6.4). Whole
 * amounts drop the decimals ("₦12,500", not "₦12,500.00").
 * @example formatMoney(1_250_000, "NGN") // "₦12,500"
 */
export const formatMoney = (amountMinor: number, currency: string, locale = "en-GB") => {
  const digits = fractionDigits(currency);
  const amount = amountMinor / 10 ** digits;
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: whole ? 0 : digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale)}`;
  }
};
