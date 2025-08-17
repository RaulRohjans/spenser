export function parseDateOrThrow(input: unknown, fieldName = 'date'): Date {
    if (input instanceof Date) {
        if (Number.isNaN(input.getTime()))
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid ${fieldName} format.`
            })
        return input
    }

    if (typeof input === 'string' || typeof input === 'number') {
        const d = new Date(input)
        if (Number.isNaN(d.getTime()))
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid ${fieldName} format.`
            })
        return d
    }

    throw createError({
        statusCode: 400,
        statusMessage: `Invalid ${fieldName} format.`
    })
}


