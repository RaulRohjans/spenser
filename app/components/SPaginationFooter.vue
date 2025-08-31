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
</script>

<template>
    <div class="flex flex-wrap justify-between items-center">
        <span class="text-sm leading-5">
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
                    page = 1
                }" />
            {{ t('of') }}
            <span class="font-medium">{{ props.total }}</span>
            {{ t('results') }}
        </span>

        <UPagination
            :items-per-page="itemsPerPage"
            :total="props.total"
            :page="page"
            @update:page="(p) => (page = p)" />
    </div>
</template>
