<script setup lang="ts">
    import type { AsyncTaskSummary } from '~~/types/AsyncTasks'
    import { useTasksStore } from '~/stores/tasks'

    const { t: $t } = useI18n()
    const router = useRouter()
    const store = useTasksStore()

    const open = () => store.open()
    const close = () => store.close()

    const onOpenChange = (val: boolean) => {
        if (val) open()
        else close()
    }

    const formattedElapsed = (ms: number): string => {
        const s = Math.floor(ms / 1000)
        if (s < 60) return `${s} sec`
        const m = Math.floor(s / 60)
        if (m < 60) return `${m} min`
        const h = Math.floor(m / 60)
        return `${h} h ${m % 60} min`
    }

    const goToResult = async (task: AsyncTaskSummary) => {
        if (task.type === 'ai-import-parse' && task.status === 'completed') {
            await router.push(`/transactions/import-ai/review?task=${task.id}`)
            store.close()
        }
    }
</script>

<template>
    <UPopover
        :open="store.isOpen"
        @update:open="onOpenChange"
        :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
        <UButton color="neutral" variant="ghost" icon="i-heroicons-bell-alert" />

        <template #content>
            <div class="w-[490px] sm:w-[600px] max-w-[490px] p-4">
                <div class="text-sm mb-3 opacity-80 flex items-center justify-between px-1">
                    <span>
                        <span v-if="store.items.some(i => i.status === 'running')">
                            {{ $t('1 task running...') }}
                        </span>
                        <span v-else>{{ $t('0 tasks running...') }}</span>
                    </span>
                </div>

                <!-- List with max height ~ 3 items, scroll when overflow -->
                <div class="flex flex-col gap-2 overflow-y-auto max-h-[60vh] sm:max-h-[360px] pr-1">
                    <div v-for="task in store.items" :key="task.id" class="p-3">
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex-1">
                                <div class="font-medium text-gray-900 dark:text-white">{{ task.title }}</div>
                                <div class="text-xs opacity-70" v-if="task.message">{{ task.message }}</div>
                            </div>
                            <div class="text-xs opacity-70 whitespace-nowrap">
                                {{ $t('Elapsed time:') }} {{ formattedElapsed(task.elapsedMs) }}
                            </div>
                        </div>

                        <div class="mt-3 flex items-center justify-between">
                            <div class="flex-1 mr-3">
                                <UProgress v-if="task.status === 'running'" animation="carousel" />
                                <div v-else class="flex items-center gap-2 text-sm">
                                    <UIcon :name="task.status === 'completed' ? 'i-heroicons-check-circle' : task.status === 'failed' ? 'i-heroicons-exclamation-circle' : 'i-heroicons-x-circle'" class="w-5 h-5" dynamic />
                                    <span>
                                        {{ task.status === 'completed' ? $t('Ready') : task.status === 'failed' ? $t('Failed') : $t('Cancelled') }}
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-center gap-2">
                                <UButton v-if="task.status === 'running' && task.canCancel" icon="i-heroicons-x-mark" variant="ghost" color="neutral" @click="store.cancelTask(task)" />
                                <UButton v-else-if="task.type === 'ai-import-parse' && task.status === 'completed'" icon="i-heroicons-arrow-top-right-on-square" color="primary" variant="ghost" @click="goToResult(task)" />
                            </div>
                        </div>
                    </div>

                    <div v-if="store.items.length === 0" class="text-center text-sm opacity-60 py-4">
                        {{ $t('No tasks') }}
                    </div>
                </div>
            </div>
        </template>
    </UPopover>
</template>


