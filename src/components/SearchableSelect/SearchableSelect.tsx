'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

export interface SearchableSelectOption {
  value: string
  label: string
}

export interface SearchableSelectProps {
  id?: string
  value: string
  onSelect: (value: string) => void
  options: SearchableSelectOption[]
  disabled?: boolean
  placeholder?: string
  className?: string
  searchPlaceholder?: string
  'aria-label'?: string
  /** When true, trigger has no border/radius for use inside a combined control (e.g. amount + currency). */
  inline?: boolean
}

const triggerBase =
  'flex min-h-[46px] w-full min-w-0 cursor-pointer items-center justify-between gap-2 py-3 text-left text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const triggerStandalone =
  'rounded-xl border border-slate-600 bg-slate-800/50 pl-4 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'

const triggerInline =
  'min-w-0 border-0 bg-transparent pl-3 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-inset'

const ChevronDown = () => (
  <svg
    className="h-5 w-5 shrink-0 text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

export function SearchableSelect({
  id,
  value,
  onSelect,
  options,
  disabled = false,
  placeholder = 'Select…',
  className = '',
  searchPlaceholder = 'Search…',
  'aria-label': ariaLabel,
  inline = false,
}: SearchableSelectProps) {
  const triggerClassName = `${triggerBase} ${inline ? triggerInline : triggerStandalone}`.trim()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; minWidth: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder

  const filtered =
    search.trim() === ''
      ? options
      : options.filter(
          (o) =>
            o.value.toLowerCase().includes(search.toLowerCase()) ||
            o.label.toLowerCase().includes(search.toLowerCase())
        )

  useEffect(() => {
    if (!open) return
    setSearch('')
    const t = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(t)
  }, [open])

  useLayoutEffect(() => {
    if (!open) {
      setDropdownStyle(null)
      return
    }
    if (!triggerRef.current) return
    const updatePosition = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
      })
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      const listbox = document.getElementById(id ? `${id}-listbox` : '')
      if (listbox?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, id])

  const handleSelect = (v: string) => {
    onSelect(v)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'Enter' && filtered.length === 1) {
      e.preventDefault()
      handleSelect(filtered[0].value)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        className={triggerClassName}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className="min-w-0 truncate text-left">{displayLabel}</span>
        <ChevronDown />
      </button>

      {open &&
        dropdownStyle &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id={id ? `${id}-listbox` : undefined}
            role="listbox"
            className="z-100 max-h-[280px] overflow-hidden rounded-xl border border-slate-600 bg-slate-800 shadow-xl"
            style={{
              position: 'fixed',
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              minWidth: dropdownStyle.minWidth,
            }}
          >
            <div className="border-b border-slate-600 p-2">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                aria-label={searchPlaceholder}
              />
            </div>
            <ul className="max-h-[220px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-500">No matches</li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={opt.value === value}
                      className={`w-full cursor-pointer px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-slate-700/80 focus:bg-slate-700/80 focus:outline-none ${
                        opt.value === value ? 'bg-blue-600/30 text-blue-200' : ''
                      }`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  )
}
