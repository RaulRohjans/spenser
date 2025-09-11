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


