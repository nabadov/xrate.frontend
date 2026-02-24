'use client'

import { useTranslation } from '@/i18n/useTranslation'
import { Converter } from '@/components/Converter'
import { LatestRates } from '@/components/LatestRates'
import { RatesHistory } from '@/components/RatesHistory'

export default function Home() {
  const { t } = useTranslation()
  return (
    <div className="relative mx-auto max-w-4xl pt-8">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t('home.title')}
        </h1>
        <p className="mt-1 text-slate-400">{t('home.subtitle')}</p>
      </header>

      <div className="flex flex-col gap-8">
        <Converter />
        <LatestRates />
        <RatesHistory />
      </div>
    </div>
  )
}
