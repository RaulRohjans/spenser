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
    // Highlight animation: pop out, glow, wiggle, return
    const bellRef = ref<HTMLElement | null>(null)
    const resolveEl = (maybe: unknown): HTMLElement | null => {
        if (!maybe) return null
        if (maybe instanceof HTMLElement) return maybe
        // Vue component instance with $el
        try {
            const el = (maybe as { $el?: unknown }).$el as unknown
            if (el instanceof HTMLElement) return el
        } catch {
            /* empty */
        }
        return null
    }

    const animateHighlight = () => {
        // Find the actual bell DOM element
        const refEl = resolveEl(bellRef.value)
        const qsEl = document.querySelector('[data-tasks-bell]') as HTMLElement | null
        const btn = refEl || qsEl
        if (!btn) return
        requestAnimationFrame(() => {
            btn.classList.add('tasks-bell-highlighted')
            btn.animate(
                [
                    { transform: 'scale(1) translateY(0) rotate(0deg)', boxShadow: 'none' },
                    { transform: 'scale(1.7) translateY(18px) rotate(0deg)', boxShadow: '0 0 28px 12px rgba(239, 177, 0, 0.28)' },
                    { transform: 'scale(1.7) translateY(18px) rotate(-45deg)', boxShadow: '0 0 28px 12px rgba(239, 177, 0, 0.28)' },
                    { transform: 'scale(1.7) translateY(18px) rotate(45deg)', boxShadow: '0 0 28px 12px rgba(239, 177, 0, 0.28)' },
                    { transform: 'scale(1.7) translateY(18px) rotate(-45deg)', boxShadow: '0 0 28px 12px rgba(239, 177, 0, 0.28)' },
                    { transform: 'scale(1.7) translateY(18px) rotate(45deg)', boxShadow: '0 0 28px 12px rgba(239, 177, 0, 0.28)' },
                    { transform: 'scale(1.7) translateY(18px) rotate(0deg)', boxShadow: '0 0 28px 12px rgba(239, 177, 0, 0.28)' },
                    { transform: 'scale(1) translateY(0) rotate(0deg)', boxShadow: 'none' }
                ],
                { duration: 1800, easing: 'ease-in-out' }
            ).onfinish = () => {
                btn.classList.remove('tasks-bell-highlighted')
                // Open tasks popover after animation so user sees the new task
                try { store.open() } catch { /* empty */ }
            }
        })
    }

    const onHighlightEvent = () => {
        // If tasks popover is already open or there are already running tasks at mount, skip animation
        if (store.isOpen || (store.items && store.items.some(i => i.status === 'running'))) {
            return
        }
        // Respect prefers-reduced-motion by skipping heavy transforms
        try {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                // Skip animation but still open the popover to show the task
                store.open()
                return
            }
        } catch {
            /* empty */
        }
        animateHighlight()
    }

    const itemsRunningCount = computed(() => {
        return store?.items?.filter(i => i.status === 'running')?.length || 0
    })

    // Mobile: cap list height to ~1.5 items (approx)
    const mobileMaxHeight = '180px'

    // Viewport (client-only usage in template to avoid SSR mismatches)
    const isMdUp = ref(false)
    onMounted(() => {
        try {
            isMdUp.value = window.matchMedia('(min-width: 768px)').matches
            window.addEventListener('resize', () => {
                isMdUp.value = window.matchMedia('(min-width: 768px)').matches
            })
        } catch { /* empty */ }
    })

    onMounted(() => {
        window.addEventListener('tasks:highlight-bell', onHighlightEvent as EventListener)
    })
    onBeforeUnmount(() => {
        window.removeEventListener('tasks:highlight-bell', onHighlightEvent as EventListener)
    })
</script>

<template>
    <!-- Desktop (>= md): popover (only when md and up) -->
    <ClientOnly>
        <template v-if="isMdUp">
            <div class="hidden md:block">
                <UPopover
                    :open="store.isOpen"
                    @update:open="onOpenChange"
                    :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
                    <UButton data-tasks-bell ref="bellRef" color="neutral" variant="ghost" icon="i-heroicons-bell-alert" />

                    <template #content>
                        <div class="w-[490px] sm:w-[600px] max-w-[490px] p-4">
                            <div class="text-sm mb-3 opacity-80 flex items-center justify-between px-1">
                                <span>
                                    <span v-if="itemsRunningCount !== 1">
                                        {{ `${itemsRunningCount} ${$t('tasks running...')}` }}
                                    </span>
                                    <span v-else>{{ $t('1 task running...') }}</span>
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
            </div>
        </template>
    </ClientOnly>

    <!-- Mobile (< md): full-width overlay panel under navbar -->
    <ClientOnly>
        <template v-if="!isMdUp">
            <div class="md:hidden">
                <UButton data-tasks-bell ref="bellRef" color="neutral" variant="ghost" icon="i-heroicons-bell-alert" @click="store.isOpen ? close() : open()" />
                <ClientOnly>
                    <Teleport to="body">
                        <Transition name="slide-fade">
                            <div v-show="store.isOpen">
                                <!-- Click-outside overlay (header remains clickable) -->
                                <div class="fixed left-0 right-0 top-[var(--header-height)] bottom-0 z-40" @click="close()"></div>
                                <div class="fixed left-0 right-0 top-[var(--header-height)] z-50">
                                    <div class="w-full bg-(--ui-bg) border-t border-(--ui-border) shadow-xl px-3 py-3">
                                        <div class="text-sm mb-3 opacity-80 flex items-center justify-between px-1">
                                            <span>
                                                <span v-if="itemsRunningCount !== 1">
                                                    {{ `${itemsRunningCount} ${$t('tasks running...')}` }}
                                                </span>
                                                <span v-else>{{ $t('1 task running...') }}</span>
                                            </span>
                                            <UButton icon="i-heroicons-x-mark" size="xs" variant="ghost" color="neutral" @click="close()" />
                                        </div>

                                        <div class="flex flex-col gap-2 overflow-y-auto pr-1" :style="{ maxHeight: mobileMaxHeight }">
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
                                </div>
                            </div>
                        </Transition>
                    </Teleport>
                </ClientOnly>
            </div>
        </template>
    </ClientOnly>
</template>
<style scoped>
    .tasks-bell-highlighted {
        border-radius: 9999px;
        outline: none;
        /* For some unknown reason the component needs 2 box shadows to have the correct background color*/
        box-shadow: 0 0 25px 10px #f59e0b33;
        box-shadow: 0 0 28px 12px rgba(239, 177, 0, 0.28);
        background-color: rgba(239, 177, 0, 1);
        color: white;
    }
</style>

