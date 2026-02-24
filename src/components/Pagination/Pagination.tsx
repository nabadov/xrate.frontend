'use client'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  'aria-label'?: string
}

function range(start: number, end: number): number[] {
  const len = Math.max(0, end - start + 1)
  return Array.from({ length: len }, (_, i) => start + i)
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  'aria-label': ariaLabel = 'Pagination',
}: PaginationProps) {
  if (totalPages <= 0) return null

  const showPrev = page > 1
  const showNext = page < totalPages

  const pageNumbers: number[] =
    totalPages <= 7
      ? range(1, totalPages)
      : page <= 4
      ? [...range(1, 5), -1, totalPages]
      : page >= totalPages - 3
      ? [1, -1, ...range(totalPages - 4, totalPages)]
      : [1, -1, ...range(page - 1, page + 1), -1, totalPages]

  const buttonBase =
    'min-w-[2.25rem] cursor-pointer rounded-lg border px-2 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none'
  const buttonInactive =
    'border-slate-600 bg-slate-800/50 text-white hover:border-slate-500 hover:bg-slate-700/50'
  const buttonActive = 'border-blue-500 bg-blue-600 text-white'

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={`${buttonBase} ${buttonInactive}`}
        disabled={!showPrev}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ←
      </button>
      <div className="flex items-center gap-1">
        {pageNumbers.map((p, i) =>
          p === -1 ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-slate-500"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${buttonBase} ${
                p === page ? buttonActive : buttonInactive
              }`}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>
      <button
        type="button"
        className={`${buttonBase} ${buttonInactive}`}
        disabled={!showNext}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  )
}
