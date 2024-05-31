<script setup lang="ts">
    import Draggable from 'vuedraggable'
    import type { NuxtError } from '#app'
    import type { ModalBudgetProps } from '~/components/Modal/Budget.vue'
    import type { BudgetDataObject } from '~/types/Data'
    import type { DragableChangeEvent } from '~/types/Draggable'

    const { token } = useAuth()
    const isModalOpen: Ref<boolean> = ref(false)
    const isChooserOpen: Ref<boolean> = ref(false)
    const selectedBudgetId: Ref<number | null> = ref(null)
    const reloadModal: Ref<number> = ref(0)
    const budgetLoaderObj: Ref<ModalBudgetProps | null> = ref(null)
    const reloadBudgetRef: Ref<number> = ref(0)
    const drag: Ref<boolean> = ref(false)

    // Fetch categories
    const budgetData = await $fetch<{
        success: boolean,
        data: BudgetDataObject[]
    }>('/api/budgets', {
        method: 'GET',
        headers: buildRequestHeaders(token.value)
    })

    // This is a small hack to have an add item at the end
    // draggable could have a slot for this, but it doesn't and I see
    // no other way of adding it without breaking css
    const budgetDraggableList: Ref<BudgetDataObject[]> = ref([...budgetData.data, {
        id: -1,
        user: 0,
        category: null,
        name: null,
        value: 0,            
        period: 'daily',
        order: 0,
        category_name: null,
        category_icon: null,
        expenses: 0
    }])

    const toggleChooser = function(state: boolean) {
        isChooserOpen.value = state
    }

    const toggleModal = function() {
        isModalOpen.value = !isModalOpen.value
    }

    const reloadBudgetData = function() {
        reloadBudgetRef.value++
    }

    const removeItemCardAction = function(budget: BudgetDataObject) {
        selectedBudgetId.value = budget.id
        toggleChooser(true)
    }

    const editItemCardAction = function(budget: BudgetDataObject) {
        budgetLoaderObj.value = budget
        toggleModal()
    }

    const removeItem = function(state: boolean) {
        if(state) { //User accepted
            $fetch(`/api/budgets/delete`, {
                method: 'POST',
                headers: buildRequestHeaders(token.value),
                body: { id: selectedBudgetId.value }
            }).then((data) => {
                if(!data.success) {
                    displayMessage('An error ocurred when removing your budget.', 'error')
                    return
                }

                reloadBudgetData()
                displayMessage('Budget deleted successfully!', 'success')
            }).catch((e: NuxtError) => {
                displayMessage(e.statusMessage, 'error')
            })
        }

        selectedBudgetId.value = null
        toggleChooser(false)      
    }

    const onOrderChange = function(_event: DragableChangeEvent) {
        // Calculate new position order based on the updated list
        const budgetPos: {[key: number]: number} = {}
        for(let i = 0; i < budgetDraggableList.value.length - 1 /* Ignore last value */; i++) {
            const budgetId = budgetDraggableList.value[i].id
            budgetPos[budgetId] = i + 1
        }

        $fetch(`/api/budgets/order`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { positions: budgetPos }
        }).then((data) => {
            if(!data.success)
                displayMessage('An error ocurred when updating order persistency.', 'error')
        }).catch((e: NuxtError) => displayMessage(e.statusMessage, 'error'))
    }

    // Reset vbind model when modal is closed
    watch(isModalOpen, (newVal) => {        
        if(!newVal) budgetLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++ 
    })
</script>

<template>
    <div class="flex flex-col justify-center items-center">
        <Draggable 
            v-model="budgetDraggableList" 
            class="flex flex-col sm:flex-row justify-center sm:justify-start sm:flex-wrap items-center sm:max-w-[80%] gap-4"
            group="budgets" 
            item-key="id"
            draggable=".drag-me:not(.dont-drag-me)"
            @change="onOrderChange"
            @start="drag = true" 
            @end="drag = false">
            <template #item="{element}">                
                <template v-if="element.id !== -1">
                    <UCard
                    class="drag-me shadow-xl cursor-grab transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
                    :ui="{
                        base: '',
                        ring: '',
                        divide: '',
                        header: { padding: 'px-10 py-3 sm:px-10 sm:py-3' },
                        body: { padding: 'px-10 py-4 sm:px-10 sm:py-4', base: 'divide-y divide-gray-200 dark:divide-gray-700' },
                        footer: { padding: 'p-2 sm:p-2' }
                    }">
                        <template #header>
                            <div class="flex flex-col items-center justify-center min-h-[58px]">
                                <h2 class="font-semibold text-2xl text-gray-900 dark:text-white leading-tight mb-1 text-wrap text-center cursor-auto">{{ element.name }}</h2>
                                <UBadge
                                    v-if="element.category"
                                    class="cursor-auto"
                                    color="primary" 
                                    variant="subtle" 
                                    :ui="{ rounded: 'rounded-full' }">
                                    <div class="flex flex-row gap-2 justify-center items-center px-0.5">
                                        <UIcon class="h-3 w-3" :name="`i-heroicons-${element.category_icon}`" dynamic/>
                                        {{ element.category_name }}
                                    </div>
                                </UBadge>
                            </div>
                        </template>
            
                        <div class="flex flex-col justify-center items-center">
                            <span class="text-xl cursor-auto" :style="Number(Number(element.value) - Number(element.expenses || 0)) < 0 ? 'color: rgb(227, 0, 0)' : ''">{{ formatCurrencyValue(Number(element.value) - Number(element.expenses || 0)) }}</span>
                        </div>
                        
                        <template #footer>
                            <div class="flex flex-row justify-between items-center w-full gap-8">
                                <span class="text-xs cursor-auto">Period: {{ element.period }}</span>
            
                                <div class="flex flex-row justify-start items-center">
                                    <UButton
                                        icon="i-heroicons-pencil-square"
                                        size="xs"
                                        color="primary"
                                        square
                                        variant="ghost" 
                                        @click="editItemCardAction(element)"/>
            
                                    <UButton
                                        icon="i-heroicons-trash"
                                        size="xs"
                                        color="primary"
                                        square
                                        variant="ghost"
                                        @click="removeItemCardAction(element)"/>
                                </div>
                            </div>
                        </template>
                    </UCard>
                </template>

                <template v-else>
                    <a class="dont-drag-me cursor-pointer transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300" @click="toggleModal">
                        <UCard
                            class="shadow-xl p-12">            
                            <UButton
                                icon="i-heroicons-squares-plus"
                                size="xl"
                                color="primary"
                                square
                                variant="link" />            
                        </UCard>
                    </a>
                </template>
            </template>
        </Draggable>
    </div>

    <ModalChooser 
        v-model="isChooserOpen" 
        title="Delete Budget" 
        message="Are you sure you want to delete this budget?"
        @click="removeItem" />

    <ModalBudget 
        :key="reloadModal"
        v-model="isModalOpen" 
        v-bind="budgetLoaderObj"
        @successful-submit="reloadBudgetData"/>
</template>