import type { Currency, ConvertResponse } from "@/types/currency";
import type { HttpRequestInit } from "@/composables/useHttp";

export type RequestFn = <T>(path: string, init?: HttpRequestInit) => Promise<T>;

const CURRENCIES_PATH = "/api/v1/currencies";

export function getCurrencies(request: RequestFn): Promise<Currency[]> {
  return request<Currency[]>(CURRENCIES_PATH);
}

export interface ConvertParams {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export function convert(
  request: RequestFn,
  params: ConvertParams
): Promise<ConvertResponse> {
  const search = new URLSearchParams({
    amount: String(params.amount),
    fromCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
  });
  return request<ConvertResponse>(`/api/v1/convert?${search.toString()}`);
}
