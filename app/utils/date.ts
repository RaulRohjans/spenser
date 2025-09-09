import type { DateTimeWithOffset } from '~~/types/Data'

export function buildDateTimeWithOffset(
    dateInput: Date | string | number,
    tzOffsetMinutes?: number
): DateTimeWithOffset {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    const offset =
        typeof tzOffsetMinutes === 'number'
            ? tzOffsetMinutes
            : -date.getTimezoneOffset()
    return { date, tzOffsetMinutes: offset }
}

/**
 * Format a YYYY-MM string as a localized short month label (e.g., 'Jan').
 * Falls back to the input if parsing fails.
 */
export function formatMonthShort(ym: string): string {
    if (typeof ym !== 'string') return String(ym)
    const parts = ym.split('-')
    if (parts.length < 2) return ym
    const year = Number(parts[0])
    const month = Number(parts[1])
    if (Number.isNaN(year) || Number.isNaN(month)) return ym
    try {
        const d = new Date(year, month - 1, 1)
        return d.toLocaleString(undefined, { month: 'short' })
    } catch {
        return ym
    }
}
