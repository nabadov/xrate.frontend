'use client'

import { Pagination } from '@/components/Pagination'

export interface DataTableColumn<T> {
  id: string
  header: string
  /** Render cell content. If not provided, uses row[accessor] or row[id]. */
  render?: (row: T) => React.ReactNode
  /** Key path for default render (e.g. 'date' or 'rates.EUR'). */
  accessor?: keyof T | string
}

export interface DataTablePagination {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  /** Return unique key for each row (e.g. row => row.id or row => row.date). */
  keyExtractor: (row: T) => string
  pagination?: DataTablePagination
  loading?: boolean
  emptyMessage?: string
  /** Max height of the table body scroll area (e.g. '320px'). */
  maxHeight?: string
  /** Optional aria label for the table. */
  'aria-label'?: string
}

function getCellValue<T>(row: T, accessor: keyof T | string): unknown {
  if (typeof accessor === 'string' && accessor.includes('.')) {
    return accessor.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], row)
  }
  return (row as Record<string, unknown>)[accessor as string]
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pagination,
  loading = false,
  emptyMessage = 'No data',
  maxHeight,
  'aria-label': ariaLabel,
}: DataTableProps<T>) {
  const totalPages =
    pagination && pagination.pageSize > 0
      ? Math.ceil(pagination.totalCount / pagination.pageSize)
      : 0

  const tableBody = (
    <>
      {data.length === 0 ? (
        <tr>
          <td
            colSpan={columns.length}
            className="px-4 py-6 text-center text-slate-500"
          >
            {emptyMessage}
          </td>
        </tr>
      ) : (
        data.map((row) => (
          <tr
            key={keyExtractor(row)}
            className="border-b border-slate-700/50 last:border-b-0"
          >
            {columns.map((col, i) => (
              <td
                key={col.id}
                className={`px-4 py-2.5 text-white ${i === 0 ? 'min-w-[8rem]' : ''}`}
              >
                {col.render
                  ? col.render(row)
                  : col.accessor != null
                    ? String(getCellValue(row, col.accessor) ?? '')
                    : ''}
              </td>
            ))}
          </tr>
        ))
      )}
    </>
  )

  const tableContent = maxHeight ? (
    <div style={{ maxHeight }} className="relative overflow-y-auto overflow-x-auto">
      <table
        className="w-full min-w-0 border-collapse text-left text-sm"
        aria-label={ariaLabel}
      >
        <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
          <tr className="border-b border-slate-600">
            {columns.map((col, i) => (
              <th
                key={col.id}
                scope="col"
                className={`px-4 py-3 font-medium text-slate-300 ${i === 0 ? 'min-w-[8rem]' : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{tableBody}</tbody>
      </table>
      {loading && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="text-sm text-slate-400">Loading…</span>
        </div>
      )}
    </div>
  ) : (
    <div className="relative">
      <table
        className="w-full min-w-0 border-collapse text-left text-sm"
        aria-label={ariaLabel}
      >
        <thead>
          <tr className="border-b border-slate-600 bg-slate-800/50">
            {columns.map((col, i) => (
              <th
                key={col.id}
                scope="col"
                className={`px-4 py-3 font-medium text-slate-300 ${i === 0 ? 'min-w-[8rem]' : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{tableBody}</tbody>
      </table>
      {loading && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-b-xl bg-slate-900/60"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="text-sm text-slate-400">Loading…</span>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto overflow-hidden rounded-xl border border-slate-600">
        {tableContent}
      </div>

      {pagination && totalPages > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={totalPages}
          onPageChange={pagination.onPageChange}
          aria-label={ariaLabel ? `${ariaLabel} pagination` : undefined}
        />
      )}
    </div>
  )
}
