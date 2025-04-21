<script setup lang="ts">
    const page = defineModel<number>('page', { default: 1 })
    const pageCount = defineModel<number>('pageCount', { default: 10 })

    const props = defineProps<{
        total: number
    }>()

    const { t } = useI18n()

    const pageFrom = computed(() => (page.value - 1) * pageCount.value + 1)
    const pageTo = computed(() => props.total == 0 ? 1 : Math.min(page.value * pageCount.value, props.total))
</script>

<template>
    <div class="flex flex-wrap justify-between items-center">
        <span class="text-sm leading-5">
            {{ t('Showing') }}
            <span class="font-medium">{{ pageFrom }}</span>
            {{ t('to') }}
            <span class="font-medium">{{ pageTo }}</span>
            {{ t('of') }}
            <span class="font-medium">{{ props.total }}</span>
            {{ t('results') }}
        </span>

        <UPagination
            v-model="page"
            :page-count="pageCount"
            :total="props.total" />
    </div>
</template>
