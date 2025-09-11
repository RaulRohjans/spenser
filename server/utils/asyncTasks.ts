import { randomUUID } from 'node:crypto'

export type AsyncTaskType = 'ai-import-parse'

export type AsyncTaskStatus =
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled'

export interface AsyncTaskSummary {
    id: string
    userId: number
    type: AsyncTaskType
    title: string
    message?: string
    status: AsyncTaskStatus
    createdAt: number
    updatedAt: number
    startedAt?: number
    finishedAt?: number
    elapsedMs: number
    canCancel: boolean
}

type InternalTask<Result> = AsyncTaskSummary & {
    controller: AbortController
    result?: Result
    error?: string
    touchedAt: number
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

type TaskMap = Map<string, InternalTask<unknown>>

// Persist across hot reloads in dev
const globalTasks: { map?: TaskMap; cleanupStarted?: boolean } =
    (globalThis as unknown as { __spenserTasks?: { map?: TaskMap; cleanupStarted?: boolean } })
        .__spenserTasks || {}
;(globalThis as unknown as { __spenserTasks: { map: TaskMap; cleanupStarted?: boolean } }).__spenserTasks =
    globalTasks as { map: TaskMap; cleanupStarted?: boolean }

const taskMap: TaskMap = globalTasks.map || new Map()
globalTasks.map = taskMap

function startCleanupLoop() {
    if (globalTasks.cleanupStarted) return
    globalTasks.cleanupStarted = true
    setInterval(() => {
        const now = Date.now()
        for (const [id, task] of taskMap) {
            const ageMs = now - task.touchedAt
            const finishedAge = task.finishedAt ? now - task.finishedAt : 0
            if (ageMs > FOUR_HOURS_MS || finishedAge > FOUR_HOURS_MS) {
                taskMap.delete(id)
            }
        }
    }, 60 * 1000).unref()
}
startCleanupLoop()

export function createAsyncTask(options: {
    userId: number
    type: AsyncTaskType
    title: string
    message?: string
}): AsyncTaskSummary {
    const controller = new AbortController()
    const id = randomUUID()
    const now = Date.now()
    const task: InternalTask<unknown> = {
        id,
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        status: 'running',
        createdAt: now,
        updatedAt: now,
        startedAt: now,
        finishedAt: undefined,
        elapsedMs: 0,
        canCancel: true,
        controller,
        touchedAt: now
    }
    taskMap.set(id, task)
    return toSummary(task)
}

export async function runAsyncTask<Result>(
    id: string,
    runner: (signal: AbortSignal) => Promise<Result>
): Promise<void> {
    const task = taskMap.get(id)
    if (!task) return
    try {
        const result = await runner(task.controller.signal)
        task.result = result
        task.status = 'completed'
        task.canCancel = false
        task.finishedAt = Date.now()
        task.updatedAt = task.finishedAt
        task.elapsedMs = (task.finishedAt || 0) - (task.startedAt || task.createdAt)
    } catch (err) {
        console.error('[asyncTask] Task failed', {
            id: task.id,
            type: task.type,
            userId: task.userId,
            createdAt: task.createdAt,
            startedAt: task.startedAt,
            errorName: (err as { name?: string } | null)?.name,
            errorMessage: (err as { message?: string } | null)?.message,
            errorStack: (err as { stack?: string } | null)?.stack
        })
        // If aborted, mark as cancelled; else failed
        if ((err as { name?: string } | null)?.name === 'AbortError') {
            task.status = 'cancelled'
        } else {
            task.status = 'failed'
            task.error = (err as { message?: string } | null)?.message || 'Task failed'
        }
        task.canCancel = false
        task.finishedAt = Date.now()
        task.updatedAt = task.finishedAt
        task.elapsedMs = (task.finishedAt || 0) - (task.startedAt || task.createdAt)
    }
}

export function cancelAsyncTask(id: string, userId: number): boolean {
    const task = taskMap.get(id)
    if (!task) return false
    if (task.userId !== userId) return false
    if (!task.canCancel || task.status !== 'running') return false

    task.canCancel = false
    task.controller.abort()

    // status will be set by runAsyncTask catch block
    task.updatedAt = Date.now()
    task.touchedAt = Date.now()
    return true
}

export function getUserTasks(userId: number): AsyncTaskSummary[] {
    const now = Date.now()
    const items: AsyncTaskSummary[] = []
    for (const task of taskMap.values()) {
        if (task.userId !== userId) continue

        // touch on read to keep alive while user watches
        task.touchedAt = now
        items.push(toSummary(task))
    }
    // sort newest first, running first
    return items.sort((a, b) => {
        if (a.status === 'running' && b.status !== 'running') return -1
        if (b.status === 'running' && a.status !== 'running') return 1
        return b.createdAt - a.createdAt
    })
}

export function getTaskResult<Result = unknown>(
    id: string,
    userId: number
): Result | undefined {
    const task = taskMap.get(id)
    
    if (!task) return undefined
    if (task.userId !== userId) return undefined
    if (task.status !== 'completed') return undefined

    task.touchedAt = Date.now()
    return task.result as Result | undefined
}

function toSummary(task: InternalTask<unknown>): AsyncTaskSummary {
    const now = Date.now()
    const elapsed =
        (task.finishedAt || now) - (task.startedAt || task.createdAt)
    return {
        id: task.id,
        userId: task.userId,
        type: task.type,
        title: task.title,
        message: task.message,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        startedAt: task.startedAt,
        finishedAt: task.finishedAt,
        elapsedMs: elapsed,
        canCancel: task.canCancel
    }
}


