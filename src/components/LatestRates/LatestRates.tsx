'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { useHttp } from '@/composables/useHttp'
import { getCurrencies } from '@/services/currenciesApi'
import { getLatestRates } from '@/services/ratesApi'
import { ApiError } from '@/lib/apiError'
import type { Currency, LatestRatesResponse } from '@/types/currency'
import { SearchableSelect } from '@/components/SearchableSelect'
import { toast } from 'sonner'

const DEFAULT_BASE = 'USD'

export function LatestRates() {
  const { t } = useTranslation()
  const { request } = useHttp()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currenciesLoading, setCurrenciesLoading] = useState(true)
  const [baseCurrency, setBaseCurrency] = useState(DEFAULT_BASE)
  const [data, setData] = useState<LatestRatesResponse | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCurrencies(request)
      .then((list) => {
        if (!cancelled) {
          const sorted = [...list].sort((a, b) => {
            if (a.code === DEFAULT_BASE) return -1
            if (b.code === DEFAULT_BASE) return 1
            return a.code.localeCompare(b.code)
          })
          setCurrencies(sorted)
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(t('errors.UNKNOWN_ERROR'))
      })
      .finally(() => {
        if (!cancelled) setCurrenciesLoading(false)
      })
    return () => { cancelled = true }
  }, [request, t])

  useEffect(() => {
    if (currenciesLoading || !baseCurrency) return
    setRatesError(false)
    setRatesLoading(true)
    let cancelled = false
    getLatestRates(request, { baseCurrency })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) {
          setRatesError(true)
          if (err instanceof ApiError && err.code) {
            const msg = t(`errors.${err.code}`) !== `errors.${err.code}` ? t(`errors.${err.code}`) : err.message
            toast.error(msg)
          } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
            toast.error(t('errors.NETWORK_ERROR'))
          } else {
            toast.error(t('errors.UNKNOWN_ERROR'))
          }
        }
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false)
      })
    return () => { cancelled = true }
  }, [baseCurrency, currenciesLoading, request, t])

  const currencyOptions = useMemo(
    () => currencies.map((c) => ({ value: c.code, label: `${c.code} – ${c.name}` })),
    [currencies]
  )

  const rateEntries = useMemo(() => {
    if (!data?.rates) return []
    return Object.entries(data.rates).sort(([a], [b]) => a.localeCompare(b))
  }, [data?.rates])

  return (
    <section className="w-full" aria-label={t('latestRates.title')}>
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="border-b border-slate-700/50 px-6 pt-6 pb-4">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-widest text-blue-400">
            {t('latestRates.title')}
          </h2>
          <p className="text-sm text-slate-400">{t('latestRates.subtitle')}</p>
        </div>

        <div className="px-6 py-4">
          <label
            htmlFor="latest-rates-base"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
          >
            {t('latestRates.baseCurrency')}
          </label>
          <SearchableSelect
            id="latest-rates-base"
            value={baseCurrency}
            onSelect={setBaseCurrency}
            options={currencyOptions}
            disabled={currenciesLoading}
            placeholder={t('latestRates.baseCurrency')}
            searchPlaceholder={t('converter.searchCurrencies')}
            aria-label={t('latestRates.baseCurrency')}
            className="max-w-[280px]"
          />
        </div>

        {ratesLoading && (
          <div className="px-6 pb-6" role="status" aria-live="polite">
            <p className="text-sm text-slate-500">{t('latestRates.loading')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg bg-slate-800/60 animate-pulse"
                  aria-hidden
                />
              ))}
            </div>
          </div>
        )}

        {ratesError && !ratesLoading && (
          <div className="px-6 pb-6">
            <p className="text-sm text-red-400" role="alert">
              {t('latestRates.error')}
            </p>
          </div>
        )}

        {!ratesLoading && !ratesError && data && rateEntries.length > 0 && (
          <div className="px-6 pb-6">
            <p className="mb-3 text-xs text-slate-500">
              {t('latestRates.rateAsOf').replace('{{date}}', data.date)}
            </p>
            <div className="max-h-[320px] overflow-hidden rounded-xl border border-slate-600">
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full min-w-0 border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
                    <tr className="border-b border-slate-600">
                    <th
                      scope="col"
                      className="px-4 py-3 font-medium text-slate-300"
                    >
                      {t('latestRates.currency')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-medium text-slate-300"
                    >
                      {t('latestRates.rate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rateEntries.map(([code, rate]) => (
                    <tr
                      key={code}
                      className="border-b border-slate-700/50 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 font-medium text-white">
                        {code}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-300">
                        {rate.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
