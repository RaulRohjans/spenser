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
        class="grid grid-cols-[repeat(auto-fit,minmax(360px,400px))] max-[831px]:grid-cols-1 gap-3 sm:gap-4 lg:gap-4 xl:gap-5 justify-center justify-items-stretch px-1 lg:px-0"
        group="budgets"
        item-key="id"
        :component-data="{ name: 'flip-list', type: 'transition-group' }"
        draggable=".drag-me:not(.dont-drag-me)"
        :animation="300"
        ghost-class="ghost"
        chosen-class="chosen"
        @change="onOrderChange()"
        @start="drag = true"
        @end="drag = false">
        <template #item="{ element }">
            <BudgetCard
                :budget="element"
                @edit="(b) => emit('edit', b)"
                @delete="(b) => emit('delete', b)" />
        </template>
    </Draggable>
</template>

<style scoped>
.ghost { opacity: 0.6; }
.chosen { transform: scale(1.03); box-shadow: 0 10px 25px rgba(0,0,0,.15); }
.flip-list-move { transition: transform 250ms ease; }
</style>


