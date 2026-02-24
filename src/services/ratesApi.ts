import type { LatestRatesResponse, HistoryRatesResponse } from '@/types/currency'
import type { HttpRequestInit } from '@/composables/useHttp'

export type RequestFn = <T>(path: string, init?: HttpRequestInit) => Promise<T>

const LATEST_PATH = '/api/v1/rates/latest'
const HISTORY_PATH = '/api/v1/rates/history'

export function getLatestRates(
  request: RequestFn,
  params: { baseCurrency: string }
): Promise<LatestRatesResponse> {
  const search = new URLSearchParams({ baseCurrency: params.baseCurrency })
  return request<LatestRatesResponse>(`${LATEST_PATH}?${search.toString()}`)
}

export interface RatesHistoryParams {
  base: string
  from: string
  to: string
  page: number
  pageSize: number
}

export function getRatesHistory(
  request: RequestFn,
  params: RatesHistoryParams
): Promise<HistoryRatesResponse> {
  const search = new URLSearchParams({
    base: params.base,
    from: params.from,
    to: params.to,
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
  return request<HistoryRatesResponse>(`${HISTORY_PATH}?${search.toString()}`)
}
