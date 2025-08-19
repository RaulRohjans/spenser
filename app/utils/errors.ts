export const toUserMessage = (error: unknown, fallbackMessage?: string) => {
	// Extract a friendly message and avoid leaking low-level fetch/config errors
	try {
		const e = error as any
		const statusCode: number | undefined =
			e?.statusCode ?? e?.response?.status ?? e?.cause?.statusCode
		const statusMessage: string | undefined = e?.statusMessage
		const dataMessage: string | undefined = e?.data?.message
		const rawMessage: string | undefined = e?.message
		const stringError: string | undefined =
			typeof e === 'string' ? (e as string) : undefined

		// Known noisy messages we should not surface to end users
		const isNoisy = (msg: string | undefined) => {
			if (!msg) return false
			const lower = msg.toLowerCase()
			return (
				lower.includes('fetchconfigurationerror') ||
				lower.includes('runtime error') ||
				lower.includes('failed to fetch') ||
				lower.includes('networkerror')
			)
		}

		// Prefer explicit 4xx status message from server when present
		if (statusCode && statusCode >= 400 && statusCode < 500 && statusMessage)
			return statusMessage

		const candidates = [statusMessage, dataMessage]
			.concat(isNoisy(rawMessage) ? [] : [rawMessage])
			.concat(stringError)

		const message = candidates.find((m) => typeof m === 'string' && m.trim())
		return message || fallbackMessage || 'An unexpected error occurred.'
	} catch {
		return fallbackMessage || 'An unexpected error occurred.'
	}
}

export const logUnknownError = (error: unknown) => {
	// Lightweight client-side logging for debugging server should log separately
	// Avoid throwing here just log to the console
	// eslint-disable-next-line no-console
	console.error(error)
}


