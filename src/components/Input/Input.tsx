"use client";

import { forwardRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";

const inputClassName =
  "block w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50";

const EyeIcon = () => (
  <svg
    className="h-5 w-5 text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    className="h-5 w-5 text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

export interface InputProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "className"> {
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ type = "text", className = "", ...props }, ref) {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    if (isPassword) {
      return (
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`${inputClassName} pr-12 ${className}`.trim()}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-slate-400 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-inset"
            aria-label={showPassword ? t("input.hidePassword") : t("input.showPassword")}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={type}
        className={`${inputClassName} ${className}`.trim()}
        {...props}
      />
    );
  }
);
