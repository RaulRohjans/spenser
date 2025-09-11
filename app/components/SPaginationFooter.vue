<script setup lang="ts">
    const page = defineModel<number>('page', { default: 1 })
    const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 })

    const props = defineProps<{
        total: number
    }>()

    const { t } = useI18n()

    const pageFrom = computed(() =>
        props.total === 0 ? 0 : (page.value - 1) * itemsPerPage.value + 1
    )

    const pageSizeOptions: number[] = [5, 10, 20, 50, 100, 150, 200]

    const numPages = computed(() => {
        const per = Math.max(1, Number(itemsPerPage.value) || 1)
        return Math.max(1, Math.ceil(props.total / per))
    })

    function clampPage(p: number) {
        page.value = Math.min(Math.max(1, p), numPages.value)
    }
</script>

<template>
    <div class="flex flex-wrap justify-between items-center gap-2">
        <!-- Mobile: rows-per-page only -->
        <div class="block sm:hidden">
            <USelect
                :model-value="itemsPerPage"
                :items="pageSizeOptions"
                size="xs"
                aria-label="Rows per page"
                class="inline-block align-middle w-16"
                @update:model-value="(v:number) => {
                    itemsPerPage = Number(v)
                    clampPage(1)
                }" />
        </div>

        <!-- Desktop: full summary with rows-per-page inline -->
        <span class="hidden sm:block text-sm leading-5">
            {{ t('Showing') }}
            <span class="font-medium">{{ pageFrom }}</span>
            {{ t('to') }}
            <USelect
                :model-value="itemsPerPage"
                :items="pageSizeOptions"
                size="xs"
                aria-label="Rows per page"
                class="inline-block align-middle w-16 mx-1"
                @update:model-value="(v:number) => {
                    itemsPerPage = Number(v)
                    clampPage(1)
                }" />
            {{ t('of') }}
            <span class="font-medium">{{ props.total }}</span>
            {{ t('results') }}
        </span>

        <!-- Mobile: compact pager with only first/prev/next/last -->
        <div class="block sm:hidden ml-auto">
            <div class="flex items-center gap-1">
                <UButton
                    icon="i-heroicons-chevron-double-left"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :disabled="page <= 1"
                    @click="clampPage(1)" />
                <UButton
                    icon="i-heroicons-chevron-left"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :disabled="page <= 1"
                    @click="clampPage(page - 1)" />
                <UButton
                    icon="i-heroicons-chevron-right"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :disabled="page >= numPages"
                    @click="clampPage(page + 1)" />
                <UButton
                    icon="i-heroicons-chevron-double-right"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :disabled="page >= numPages"
                    @click="clampPage(numPages)" />
            </div>
        </div>

        <!-- Desktop: full pagination -->
        <div class="hidden sm:block ml-auto">
            <UPagination
                :items-per-page="itemsPerPage"
                :total="props.total"
                :page="page"
                @update:page="(p) => (page = p)" />
        </div>
    </div>
</template>
