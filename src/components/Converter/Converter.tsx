'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/useTranslation'
import { useHttp } from '@/composables/useHttp'
import { getCurrencies, convert } from '@/services/currenciesApi'
import { ApiError } from '@/lib/apiError'
import type { Currency, ConvertResponse } from '@/types/currency'
import { Input } from '@/components/Input'
import { SearchableSelect } from '@/components/SearchableSelect'

const DEBOUNCE_MS = 400

const DEFAULT_FROM = 'USD'
const DEFAULT_TO = 'EUR'

const PARAM_AMOUNT = 'amount'
const PARAM_FROM = 'from'
const PARAM_TO = 'to'

const converterSchema = z
  .object({
    amount: z
      .string()
      .min(1, 'validation.required')
      .refine((v) => /^\d*\.?\d*$/.test(v), 'validation.amountNumber')
      .refine((v) => parseFloat(v) > 0, 'validation.amountPositive'),
    fromCurrency: z.string().min(1, 'validation.required'),
    toCurrency: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.fromCurrency !== data.toCurrency, {
    message: 'validation.sameCurrency',
    path: ['toCurrency'],
  })

type ConverterFormData = z.infer<typeof converterSchema>

export function Converter() {
  const { t } = useTranslation()
  const { request } = useHttp()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialFromUrl = useMemo(
    () => ({
      amount: searchParams.get(PARAM_AMOUNT) ?? '',
      fromCurrency: searchParams.get(PARAM_FROM) ?? DEFAULT_FROM,
      toCurrency: searchParams.get(PARAM_TO) ?? DEFAULT_TO,
    }),
    [searchParams]
  )

  const hadToInUrl = useRef(!!searchParams.get(PARAM_TO))

  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currenciesLoading, setCurrenciesLoading] = useState(true)
  const [convertLoading, setConvertLoading] = useState(false)
  const [result, setResult] = useState<ConvertResponse | null>(null)

  const { register, watch, setValue } = useForm<ConverterFormData>({
    resolver: zodResolver(converterSchema),
    defaultValues: initialFromUrl,
  })

  const watchedAmount = watch('amount')
  const watchedFrom = watch('fromCurrency')
  const watchedTo = watch('toCurrency')

  const hasAppliedDefaults = useRef(false)
  useEffect(() => {
    if (currencies.length > 0 && !hasAppliedDefaults.current) {
      hasAppliedDefaults.current = true
      if (!hadToInUrl.current) setValue('toCurrency', DEFAULT_TO)
    }
  }, [currencies.length, setValue])

  useEffect(() => {
    if (currenciesLoading || currencies.length === 0) return

    const timer = setTimeout(() => {
      const amount = (watchedAmount ?? '').trim()
      const fromCurrency = watchedFrom ?? ''
      const toCurrency = watchedTo ?? ''
      const num = parseFloat(amount)
      if (
        !amount ||
        Number.isNaN(num) ||
        num <= 0 ||
        fromCurrency === toCurrency ||
        !fromCurrency ||
        !toCurrency
      ) {
        setResult(null)
        return
      }

      setConvertLoading(true)
      setResult(null)
      convert(request, { amount: num, fromCurrency, toCurrency })
        .then((res) => {
          setResult(res)
          const params = new URLSearchParams({
            [PARAM_AMOUNT]: amount,
            [PARAM_FROM]: fromCurrency,
            [PARAM_TO]: toCurrency,
          })
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
        .catch((err) => {
          setResult(null)
          if (err instanceof ApiError && err.code) {
            const message =
              t(`errors.${err.code}`) !== `errors.${err.code}`
                ? t(`errors.${err.code}`)
                : err.message
            toast.error(message)
          } else if (
            err instanceof TypeError &&
            err.message === 'Failed to fetch'
          ) {
            toast.error(t('errors.NETWORK_ERROR'))
          } else {
            toast.error(t('errors.UNKNOWN_ERROR'))
          }
        })
        .finally(() => setConvertLoading(false))
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [
    currenciesLoading,
    currencies.length,
    watchedAmount,
    watchedFrom,
    watchedTo,
    pathname,
    request,
    router,
    t,
  ])

  useEffect(() => {
    let cancelled = false
    getCurrencies(request)
      .then((list) => {
        if (!cancelled) {
          const sorted = [...list].sort((a, b) => {
            if (a.code === DEFAULT_FROM) return -1
            if (b.code === DEFAULT_FROM) return 1
            return a.code.localeCompare(b.code)
          })
          setCurrencies(sorted)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.code) {
            const msg =
              t(`errors.${err.code}`) !== `errors.${err.code}`
                ? t(`errors.${err.code}`)
                : err.message
            toast.error(msg)
          } else if (
            err instanceof TypeError &&
            err.message === 'Failed to fetch'
          ) {
            toast.error(t('errors.NETWORK_ERROR'))
          } else {
            toast.error(t('errors.UNKNOWN_ERROR'))
          }
        }
      })
      .finally(() => {
        if (!cancelled) setCurrenciesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [request, t])

  const currencyOptions = useMemo(
    () =>
      currencies.map((c) => ({
        value: c.code,
        label: `${c.code} – ${c.name}`,
      })),
    [currencies]
  )

  const handleSwap = () => {
    setValue('fromCurrency', watchedTo)
    setValue('toCurrency', watchedFrom)
    if (result) {
      setValue('amount', String(result.convertedAmount))
      setResult(null)
    }
  }

  const rateLine = result
    ? t('converter.rateLine')
        .replace('{{from}}', result.fromCurrency)
        .replace('{{rate}}', String(result.rate))
        .replace('{{to}}', result.toCurrency)
    : ''
  const rateDate = result
    ? t('converter.rateOn').replace('{{date}}', result.date)
    : ''

  const currencyByCode = useMemo(
    () => new Map(currencies.map((c) => [c.code, c])),
    [currencies]
  )
  const fromName = (watchedFrom && currencyByCode.get(watchedFrom)?.name) || watchedFrom || ''
  const toName = (watchedTo && currencyByCode.get(watchedTo)?.name) || watchedTo || ''
  const amountStr = (watchedAmount ?? '').trim()
  const hasAmount = amountStr && !Number.isNaN(parseFloat(amountStr)) && parseFloat(amountStr) > 0
  const convertHeading =
    watchedFrom && watchedTo && watchedFrom !== watchedTo
      ? hasAmount
        ? t('converter.convertHeadingWithAmount')
            .replace('{{amount}}', amountStr)
            .replace('{{from}}', watchedFrom)
            .replace('{{to}}', watchedTo)
            .replace('{{fromName}}', fromName)
            .replace('{{toName}}', toName)
        : t('converter.convertHeadingNoAmount')
            .replace('{{from}}', watchedFrom)
            .replace('{{to}}', watchedTo)
            .replace('{{fromName}}', fromName)
            .replace('{{toName}}', toName)
      : ''

  return (
    <section className="w-full" aria-label={t('converter.title')}>
      {convertHeading && (
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {convertHeading}
        </h1>
      )}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="border-b border-slate-700/50 px-6 pt-6 pb-4">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-widest text-blue-400">
            {t('converter.title')}
          </h2>
          <p className="text-sm text-slate-400">{t('converter.subtitle')}</p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-end sm:gap-4"
        >
          {/* From block: amount + currency as one control */}
          <div className="min-w-0 flex-1">
            <label
              htmlFor="converter-amount"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
            >
              {t('converter.fromCurrency')}
            </label>
            <div className="flex rounded-xl border border-slate-600 bg-slate-800/50 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
              <Input
                id="converter-amount"
                type="text"
                inputMode="decimal"
                placeholder={t('converter.amountPlaceholder')}
                disabled={convertLoading || currenciesLoading}
                className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-4 text-lg font-semibold tabular-nums placeholder-slate-500 focus:ring-0 focus:ring-offset-0"
                {...register('amount')}
              />
              <div className="border-l border-slate-600" aria-hidden />
              <SearchableSelect
                id="converter-from"
                value={watchedFrom}
                onSelect={(v) => setValue('fromCurrency', v)}
                options={currencyOptions}
                disabled={convertLoading || currenciesLoading}
                placeholder={t('converter.fromCurrency')}
                searchPlaceholder={t('converter.searchCurrencies')}
                aria-label={t('converter.fromCurrency')}
                inline
                className="min-w-0 shrink-0 sm:w-[200px]"
              />
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center sm:shrink-0 sm:pb-1">
            <button
              type="button"
              onClick={handleSwap}
              disabled={
                currenciesLoading ||
                !watchedFrom ||
                !watchedTo ||
                watchedFrom === watchedTo
              }
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-slate-600 bg-slate-800/80 text-slate-400 transition hover:border-slate-500 hover:bg-slate-700/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none"
              aria-label={t('converter.swap')}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          {/* To block: converted amount (read-only) + currency as one control */}
          <div className="min-w-0 flex-1">
            <label
              htmlFor="converter-to-display"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
            >
              {t('converter.toCurrency')}
            </label>
            <div className="flex rounded-xl border border-slate-600 bg-slate-800/50">
              <div
                id="converter-to-display"
                className="flex min-h-[46px] min-w-0 flex-1 items-center px-4 py-3 text-lg font-semibold tabular-nums text-white"
                aria-live="polite"
              >
                {convertLoading ? (
                  <span className="text-slate-500">…</span>
                ) : result ? (
                  result.convertedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>
              <div className="border-l border-slate-600" aria-hidden />
              <SearchableSelect
                id="converter-to"
                value={watchedTo}
                onSelect={(v) => setValue('toCurrency', v)}
                options={currencyOptions}
                disabled={convertLoading || currenciesLoading}
                placeholder={t('converter.toCurrency')}
                searchPlaceholder={t('converter.searchCurrencies')}
                aria-label={t('converter.toCurrency')}
                inline
                className="min-w-0 shrink-0 sm:w-[200px]"
              />
            </div>
          </div>
        </form>

        {/* Rate line */}
        {(rateLine || convertLoading) && (
          <div
            className="border-t border-slate-700/50 px-6 py-4"
            role="status"
            aria-live="polite"
          >
            <p className="text-base font-semibold text-blue-300">
              {convertLoading ? '…' : rateLine}
            </p>
            {rateDate && (
              <p className="mt-0.5 text-xs text-slate-500">{rateDate}</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
