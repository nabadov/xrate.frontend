'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { useHttp } from '@/composables/useHttp'
import { getCurrencies } from '@/services/currenciesApi'
import { getRatesHistory } from '@/services/ratesApi'
import { ApiError } from '@/lib/apiError'
import type { Currency, HistoryRateItem } from '@/types/currency'
import { SearchableSelect } from '@/components/SearchableSelect'
import { DataTable } from '@/components/DataTable'
import { toast } from 'sonner'

const DEFAULT_BASE = 'USD'
const PAGE_SIZE = 10

function formatDateForInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getDefaultDates(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 30)
  return { from: formatDateForInput(from), to: formatDateForInput(to) }
}

export function RatesHistory() {
  const { t } = useTranslation()
  const { request } = useHttp()
  const defaults = useMemo(getDefaultDates, [])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currenciesLoading, setCurrenciesLoading] = useState(true)
  const [base, setBase] = useState(DEFAULT_BASE)
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Awaited<ReturnType<typeof getRatesHistory>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

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
    if (currenciesLoading || !from || !to) return
    setLoading(true)
    let cancelled = false
    getRatesHistory(request, { base, from, to, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(true)
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
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [currenciesLoading, page, base, from, to, request, t])

  const currencyOptions = useMemo(
    () => currencies.map((c) => ({ value: c.code, label: `${c.code} – ${c.name}` })),
    [currencies]
  )

  const columns = useMemo(() => {
    const baseCols: { id: string; header: string; render?: (row: HistoryRateItem) => React.ReactNode; accessor?: keyof HistoryRateItem }[] = [
      { id: 'date', header: t('ratesHistory.date'), accessor: 'date' },
    ]
    if (!data?.data.items.length) return baseCols
    const codes = Object.keys(data.data.items[0].rates).sort()
    codes.forEach((code) => {
      baseCols.push({
        id: code,
        header: code,
        render: (row) =>
          row.rates[code] != null
            ? row.rates[code].toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })
            : '—',
      })
    })
    return baseCols
  }, [data?.data.items, t])

  const items = data?.data.items ?? []
  const totalCount = data?.data.totalCount ?? 0

  return (
    <section className="w-full" aria-label={t('ratesHistory.title')}>
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="border-b border-slate-700/50 px-6 pt-6 pb-4">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-widest text-blue-400">
            {t('ratesHistory.title')}
          </h2>
          <p className="text-sm text-slate-400">{t('ratesHistory.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <label
              htmlFor="history-base"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
            >
              {t('ratesHistory.baseCurrency')}
            </label>
            <SearchableSelect
              id="history-base"
              value={base}
              onSelect={(v) => {
                setBase(v)
                setPage(1)
              }}
              options={currencyOptions}
              disabled={currenciesLoading}
              placeholder={t('ratesHistory.baseCurrency')}
              searchPlaceholder={t('converter.searchCurrencies')}
              aria-label={t('ratesHistory.baseCurrency')}
              className="w-full sm:w-[200px]"
            />
          </div>
          <div>
            <label
              htmlFor="history-from"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
            >
              {t('ratesHistory.dateFrom')}
            </label>
            <input
              id="history-from"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
              disabled={currenciesLoading}
              className="block w-full min-w-0 rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 sm:w-[160px]"
            />
          </div>
          <div>
            <label
              htmlFor="history-to"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
            >
              {t('ratesHistory.dateTo')}
            </label>
            <input
              id="history-to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
              disabled={currenciesLoading}
              className="block w-full min-w-0 rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 sm:w-[160px]"
            />
          </div>
        </div>

        {error && !loading && (
          <div className="px-6 pb-4">
            <p className="text-sm text-red-400" role="alert">
              {t('ratesHistory.error')}
            </p>
          </div>
        )}

        {!error && (
          <div className="border-t border-slate-700/50 px-6 pb-6 pt-4">
            <DataTable<HistoryRateItem>
              columns={columns}
              data={items}
              keyExtractor={(row) => row.date}
              pagination={
                totalCount > 0
                  ? {
                      page,
                      pageSize: PAGE_SIZE,
                      totalCount,
                      onPageChange: setPage,
                    }
                  : undefined
              }
              loading={loading}
              emptyMessage={t('ratesHistory.empty')}
              maxHeight="320px"
              aria-label={t('ratesHistory.title')}
            />
          </div>
        )}
      </div>
    </section>
  )
}
