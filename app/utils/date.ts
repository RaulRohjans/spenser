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
