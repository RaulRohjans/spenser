export type BudgetPeriod =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'half_yearly'
    | 'yearly'

export interface PeriodAnchors {
    weekStartsOn?: 'mon' | 'sun'
    anchorDayOfMonth?: number
}

export interface PeriodWindow {
    startUtc: Date
    endUtc: Date
    startLocal: Date
    endLocal: Date
}

/**
 * Build a period window for budgets given a period and reference date.
 * Local boundaries are computed using tzOffsetMinutes and then converted to UTC for DB filtering.
 */
export function getPeriodWindow(
    period: BudgetPeriod,
    referenceDate: Date,
    tzOffsetMinutes: number,
    anchors: PeriodAnchors = {}
): PeriodWindow {
    const weekStartsOn = anchors.weekStartsOn ?? 'mon'
    const anchorDayOfMonth = anchors.anchorDayOfMonth ?? 1

    // Build local start/end boundaries first
    let startLocal: Date
    let endLocal: Date

    switch (period) {
        case 'daily': {
            const d = toLocalMidnight(referenceDate, tzOffsetMinutes)
            startLocal = d
            endLocal = addDays(d, 1)
            break
        }
        case 'weekly': {
            const d = toLocalMidnight(referenceDate, tzOffsetMinutes)
            const start = startOfWeek(d, weekStartsOn)
            startLocal = start
            endLocal = addDays(start, 7)
            break
        }
        case 'monthly': {
            const d = toLocalMidnight(referenceDate, tzOffsetMinutes)
            const start = startOfMonthAnchored(d, anchorDayOfMonth)
            const end = startOfNextMonthAnchored(start, anchorDayOfMonth)
            startLocal = start
            endLocal = end
            break
        }
        case 'half_yearly': {
            const d = toLocalMidnight(referenceDate, tzOffsetMinutes)
            const start = startOfHalfYear(d, anchorDayOfMonth)
            const end = startOfNextHalfYear(start, anchorDayOfMonth)
            startLocal = start
            endLocal = end
            break
        }
        case 'yearly': {
            const d = toLocalMidnight(referenceDate, tzOffsetMinutes)
            const start = startOfYearAnchored(d, anchorDayOfMonth)
            const end = startOfNextYearAnchored(start, anchorDayOfMonth)
            startLocal = start
            endLocal = end
            break
        }
        default: {
            // Fallback to monthly if unknown
            const d = toLocalMidnight(referenceDate, tzOffsetMinutes)
            const start = startOfMonthAnchored(d, anchorDayOfMonth)
            const end = startOfNextMonthAnchored(start, anchorDayOfMonth)
            startLocal = start
            endLocal = end
        }
    }

    // Convert local boundaries to UTC instants for DB filtering
    const startUtc = toUtcFromLocal(startLocal, tzOffsetMinutes)
    const endUtc = toUtcFromLocal(endLocal, tzOffsetMinutes)

    return { startUtc, endUtc, startLocal, endLocal }
}

function toLocalMidnight(date: Date, tzOffsetMinutes: number): Date {
    // Convert the absolute instant to local time via offset, normalize to midnight, keep as local wall time
    const local = new Date(date.getTime() + tzOffsetMinutes * 60_000)
    const midnightLocal = new Date(
        local.getFullYear(),
        local.getMonth(),
        local.getDate(),
        0,
        0,
        0,
        0
    )
    return midnightLocal
}

function toUtcFromLocal(localDate: Date, tzOffsetMinutes: number): Date {
    // Interpret localDate as wall time in the given offset; convert back to UTC
    return new Date(localDate.getTime() - tzOffsetMinutes * 60_000)
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

function clampDayOfMonth(year: number, monthIndex: number, day: number): number {
    // monthIndex is 0-based
    const lastDay = new Date(year, monthIndex + 1, 0).getDate()
    if (day < 1) return 1
    if (day > lastDay) return lastDay
    return day
}

function startOfMonthAnchored(referenceLocal: Date, anchorDay: number): Date {
    const year = referenceLocal.getFullYear()
    const month = referenceLocal.getMonth()
    const currentDay = referenceLocal.getDate()

    const anchorThisMonth = clampDayOfMonth(year, month, anchorDay)
    if (currentDay >= anchorThisMonth) {
        // Current window starts this month on anchor
        return new Date(year, month, anchorThisMonth, 0, 0, 0, 0)
    }
    // Otherwise previous month anchored
    const prevMonth = month - 1
    const prevYear = prevMonth < 0 ? year - 1 : year
    const prevMonthIndex = (prevMonth + 12) % 12
    const anchorPrev = clampDayOfMonth(prevYear, prevMonthIndex, anchorDay)
    return new Date(prevYear, prevMonthIndex, anchorPrev, 0, 0, 0, 0)
}

function startOfNextMonthAnchored(startLocal: Date, anchorDay: number): Date {
    // Move to next month and set anchor
    const year = startLocal.getFullYear()
    const month = startLocal.getMonth()
    const nextMonth = month + 1
    const nextYear = nextMonth >= 12 ? year + 1 : year
    const nextMonthIndex = nextMonth % 12
    const anchor = clampDayOfMonth(nextYear, nextMonthIndex, anchorDay)
    return new Date(nextYear, nextMonthIndex, anchor, 0, 0, 0, 0)
}

function startOfWeek(referenceLocal: Date, weekStartsOn: 'mon' | 'sun'): Date {
    const dow = referenceLocal.getDay() // 0 Sun - 6 Sat
    const offset = weekStartsOn === 'mon' ? (dow === 0 ? -6 : 1 - dow) : -dow
    const d = new Date(referenceLocal)
    d.setDate(d.getDate() + offset)
    d.setHours(0, 0, 0, 0)
    return d
}

function startOfHalfYear(referenceLocal: Date, anchorDay: number): Date {
    const year = referenceLocal.getFullYear()
    const month = referenceLocal.getMonth() // 0-based
    const isSecondHalf = month >= 6
    const halfStartMonth = isSecondHalf ? 6 : 0 // Jul or Jan
    const anchor = clampDayOfMonth(year, halfStartMonth, anchorDay)
    const halfStart = new Date(year, halfStartMonth, anchor, 0, 0, 0, 0)
    // If reference date is before the anchored day within the first month of this half, use previous half
    if (
        month === halfStartMonth &&
        referenceLocal.getDate() < anchor
    ) {
        const prevHalfMonth = halfStartMonth === 0 ? 6 : 0
        const prevYear = halfStartMonth === 0 ? year - 1 : year
        const prevAnchor = clampDayOfMonth(prevYear, prevHalfMonth, anchorDay)
        return new Date(prevYear, prevHalfMonth, prevAnchor, 0, 0, 0, 0)
    }
    return halfStart
}

function startOfNextHalfYear(startLocal: Date, anchorDay: number): Date {
    const year = startLocal.getFullYear()
    const month = startLocal.getMonth()
    const nextStartMonth = month >= 6 ? 0 : 6
    const nextYear = month >= 6 ? year + 1 : year
    const anchor = clampDayOfMonth(nextYear, nextStartMonth, anchorDay)
    return new Date(nextYear, nextStartMonth, anchor, 0, 0, 0, 0)
}

function startOfYearAnchored(referenceLocal: Date, anchorDay: number): Date {
    const year = referenceLocal.getFullYear()
    const month = referenceLocal.getMonth()
    const anchor = clampDayOfMonth(year, 0, anchorDay)
    const start = new Date(year, 0, anchor, 0, 0, 0, 0)
    if (month === 0 && referenceLocal.getDate() < anchor) {
        const prevYear = year - 1
        const prevAnchor = clampDayOfMonth(prevYear, 0, anchorDay)
        return new Date(prevYear, 0, prevAnchor, 0, 0, 0, 0)
    }
    return start
}

function startOfNextYearAnchored(startLocal: Date, anchorDay: number): Date {
    const year = startLocal.getFullYear()
    const nextYear = year + 1
    const anchor = clampDayOfMonth(nextYear, 0, anchorDay)
    return new Date(nextYear, 0, anchor, 0, 0, 0, 0)
}


