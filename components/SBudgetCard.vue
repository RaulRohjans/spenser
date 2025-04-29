<script setup lang="ts">
    import { upperFirst } from 'scule'
    import { formatCurrencyValue } from '#imports'
    import type { BudgetDataObject } from '~/types/Data'

    const { t: $t } = useI18n()

    defineProps<{
        budget: BudgetDataObject
    }>()

    const emit = defineEmits<{
        (e: 'edit', budget: BudgetDataObject): void
        (e: 'delete', budget: BudgetDataObject): void
    }>()
    
</script>

<template>
    <UCard
        class="drag-me shadow-xl cursor-grab transition-all ease-in-out duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-2xl hover:opacity-95"
        :ui="{
            header: 'px-10 py-3 sm:px-10 sm:py-3',
            body: 'px-10 py-4 sm:px-10 sm:py-4 divide-y divide-gray-200 dark:divide-gray-700',
            footer: 'p-2 sm:p-2'
        }" >
    <template #header>
      <div class="flex flex-col items-center justify-center min-h-[58px]">
        <h2
          class="font-semibold text-2xl text-gray-900 dark:text-white leading-tight mb-1 text-wrap text-center cursor-auto">
          {{ budget.name }}
        </h2>
        <UBadge
          v-if="budget.category"
          class="cursor-auto"
          color="primary"
          variant="subtle"
          :ui="{ base: 'rounded-full' }">
          <div
            v-if="!budget.category_deleted"
            class="flex flex-row gap-2 justify-center items-center px-0.5">
            <UIcon
              v-if="budget.category_icon"
              class="h-3 w-3"
              :name="`i-heroicons-${budget.category_icon}`"
              dynamic />
            {{ budget.category_name }}
          </div>
          <span v-else>-</span>
        </UBadge>
      </div>
    </template>

    <div class="flex flex-col justify-center items-center">
      <span
        class="text-xl cursor-auto"
        :style="
          Number(Number(budget.value) - Number(budget.expenses || 0)) < 0
            ? 'color: rgb(227, 0, 0)'
            : ''
        "
      >
        {{ formatCurrencyValue(Number(budget.value) - Number(budget.expenses || 0)) }}
      </span>
    </div>

    <template #footer>
      <div class="flex flex-row justify-between items-center w-full gap-8">
        <span class="text-xs cursor-auto">
          {{ `${$t('Period')}: ${upperFirst($t(budget.period))}` }}
        </span>

        <div class="flex flex-row justify-start items-center">
          <UButton
            icon="i-heroicons-pencil-square"
            size="xs"
            color="primary"
            square
            variant="ghost"
            @click="emit('edit', budget)" />

          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="primary"
            square
            variant="ghost"
            @click="emit('delete', budget)" />
        </div>
      </div>
    </template>
  </UCard>
</template>
