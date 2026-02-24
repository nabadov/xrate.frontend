"use client";

import { forwardRef } from "react";

const selectClassName =
  "block w-full min-w-0 cursor-pointer rounded-xl border border-slate-600 bg-slate-800/50 pl-4 pr-10 py-3 text-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat bg-[length:1.25rem] bg-[right_0.75rem_center]";

const chevronSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<
    React.ComponentPropsWithoutRef<"select">,
    "className" | "children"
  > {
  /** Options for the select. Either use this or pass <option> as children. */
  options?: SelectOption[];
  className?: string;
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ options, className = "", children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`${selectClassName} ${className}`.trim()}
          style={{
            backgroundImage: `url("${chevronSvg}")`,
          }}
          {...props}
        >
          {options !== undefined
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      </div>
    );
  }
);
