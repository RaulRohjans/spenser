import { defineStore } from 'pinia'
import type { AsyncTaskSummary } from '~~/types/AsyncTasks'

export interface TasksState {
    items: AsyncTaskSummary[]
    isOpen: boolean
    polling: boolean
}

export const useTasksStore = defineStore('tasks', () => {
    const items = ref<AsyncTaskSummary[]>([])
    const isOpen = ref(false)
    const polling = ref(false)
    let timer: number | null = null

    let prevHasRunning = false

    const startPolling = () => {
        if (polling.value) return
        polling.value = true
        const run = async () => {
            try {
                const res = await $fetch<{ success: boolean; items: AsyncTaskSummary[] }>(
                    '/api/tasks',
                    { method: 'GET' }
                )
                if (res.success) {
                    items.value = res.items
                    const hasRunning = items.value.some(i => i.status === 'running')
                    if (hasRunning && !prevHasRunning) {
                        try {
                            window.dispatchEvent(new Event('tasks:highlight-bell'))
                        } catch {
                            /* empty */
                        }
                    }
                    prevHasRunning = hasRunning
                }
            } catch {
                /* empty */
            }
        }
        run()
        timer = window.setInterval(run, 2000)
    }

    const stopPolling = () => {
        polling.value = false
        if (timer) {
            window.clearInterval(timer)
            timer = null
        }
    }

    const open = () => {
        isOpen.value = true
        startPolling()
    }
    const close = () => {
        isOpen.value = false
        stopPolling()
    }

    const cancelTask = async (task: AsyncTaskSummary) => {
        if (!task.canCancel) return
        try {
            await $fetch(`/api/tasks/${task.id}/cancel`, { method: 'POST' })
            // Refresh immediately
            const res = await $fetch<{ success: boolean; items: AsyncTaskSummary[] }>(
                '/api/tasks',
                { method: 'GET' }
            )
            if (res.success) items.value = res.items
        } catch {
            /* empty */
        }
    }

    return { items, isOpen, polling, open, close, startPolling, stopPolling, cancelTask }
})


