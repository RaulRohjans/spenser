<script setup lang="ts">
import Draggable from 'vuedraggable'
import { useVModel } from '@vueuse/core'
import type { BudgetDataObject } from '~~/types/Data'

const props = defineProps<{ modelValue: BudgetDataObject[] }>()
const emit = defineEmits<{
    (e: 'update:modelValue', v: BudgetDataObject[]): void
    (e: 'reorder', budgets: BudgetDataObject[]): void
    (e: 'edit', budget: BudgetDataObject): void
    (e: 'delete', budget: BudgetDataObject): void
    (e: 'create'): void
}>()

const drag = ref(false)

const list = useVModel(props, 'modelValue', emit)

function onOrderChange() {
    emit('reorder', list.value)
}
</script>

<template>
    <Draggable
        v-model="list"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        group="budgets"
        item-key="id"
        draggable=".drag-me:not(.dont-drag-me)"
        :animation="300"
        ghost-class="ghost"
        chosen-class="chosen"
        @change="onOrderChange()"
        @start="drag = true"
        @end="drag = false">
        <template #item="{ element }">
            <template v-if="element.id !== -1">
                <BudgetCard
                    :budget="element"
                    @edit="(b) => emit('edit', b)"
                    @delete="(b) => emit('delete', b)" />
            </template>
            <template v-else>
                <UCard
                    class="dont-drag-me w-[320px] max-w-full flex items-center justify-center cursor-pointer hover:shadow-lg transition"
                    @click="emit('create')">
                    <UButton
                        icon="i-heroicons-squares-plus"
                        size="xl"
                        color="primary"
                        square
                        variant="link" />
                </UCard>
            </template>
        </template>
    </Draggable>
</template>

<style scoped>
.ghost { opacity: 0.6; }
.chosen { transform: scale(1.03); box-shadow: 0 10px 25px rgba(0,0,0,.15); }
</style>


