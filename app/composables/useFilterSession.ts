import { debounce } from 'lodash-es'

type StorageMode = 'session' | 'local'

type UseFilterSessionOptions = {
    storage?: StorageMode
    debounceMs?: number
}

function getStorage(mode: StorageMode): Storage {
    return mode === 'local' ? localStorage : sessionStorage
}

function makeKey(raw: string): string {
    return `spenser:filters:${raw}`
}

function replacer(_key: string, value: unknown): unknown {
    if (value instanceof Date) {
        return { __type: 'date', value: value.getTime() }
    }
    return value
}

function reviver(_key: string, value: unknown): unknown {
    if (value && typeof value === 'object' && (value as any).__type === 'date') {
        const v = (value as any).value
        return new Date(typeof v === 'string' ? Number(v) : v)
    }
    return value
}

export function useFilterSession<T extends Record<string, unknown>>(
    key: string,
    target: T,
    options?: UseFilterSessionOptions
) {
    const opts = Object.assign({ storage: 'session' as StorageMode, debounceMs: 200 }, options)
    const storage = getStorage(opts.storage!)
    const storageKey = makeKey(key)

    const saveNow = () => {
        try {
            const json = JSON.stringify(target, replacer)
            storage.setItem(storageKey, json)
        } catch {
            /* empty */
        }
    }

    const save = opts.debounceMs ? debounce(saveNow, opts.debounceMs) : saveNow

    const load = (): boolean => {
        try {
            const json = storage.getItem(storageKey)
            if (!json) return false
            const parsed = JSON.parse(json, reviver)
            if (parsed && typeof parsed === 'object') {
                Object.assign(target, parsed)
                return true
            }
        } catch {
            /* empty */
        }
        return false
    }

    const clear = () => {
        try {
            storage.removeItem(storageKey)
        } catch {
            /* empty */
        }
    }

    watch(
        () => JSON.stringify(target, replacer),
        () => save(),
        { deep: true }
    )

    return { load, save: saveNow, clear }
}


