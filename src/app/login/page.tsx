'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/useTranslation'
import { login } from '@/services/authApi'
import { ApiError } from '@/lib/apiError'
import { Input } from '@/components/Input'
import { getSafeRedirectUrl, REDIRECT_URL_PARAM } from '@/components/AuthGuard'

const loginSchema = z.object({
  userName: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.userNameMin')
    .transform((s) => s.trim()),
  password: z
    .string()
    .min(1, 'validation.required')
    .min(6, 'validation.passwordMin'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userName: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      await login({ userName: data.userName, password: data.password })
      toast.success(t('login.submit'))
      const redirect = getSafeRedirectUrl(searchParams.get(REDIRECT_URL_PARAM))
      router.push(redirect ?? '/')
      router.refresh()
    } catch (err) {
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-full items-center justify-center w-full">
      <div className="relative w-full max-w-[400px]">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <div className="border-b border-slate-700/50 px-8 pt-8 pb-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-400">
              {t('common.appName')}
            </h2>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                {t('login.title')}
              </h1>
            </div>
            <p className="text-sm text-slate-400">{t('login.subtitle')}</p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-8 py-6"
          >
            <div className="space-y-2">
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-slate-300"
              >
                {t('login.userName')}
              </label>
              <Input
                id="userName"
                type="text"
                autoComplete="username"
                placeholder={t('login.userNamePlaceholder')}
                disabled={loading}
                {...register('userName')}
              />
              {errors.userName?.message && (
                <p className="text-sm text-red-400" role="alert">
                  {t(errors.userName.message)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                {t('login.password')}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')}
                disabled={loading}
                {...register('password')}
              />
              {errors.password?.message && (
                <p className="text-sm text-red-400" role="alert">
                  {t(errors.password.message)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full cursor-pointer rounded-xl bg-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          {t('common.footer')}
        </p>
      </div>
    </div>
  )
}
