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
    const { data: budgetData } = await useLazyAsyncData<{
        success: boolean,
        data: BudgetDataObject[]
    }>
    ('budgets', () => ($fetch)('/api/budgets', {  
            method: 'GET',
            headers: buildRequestHeaders(token.value)
    }), {
        default: () => {
            return {
                success: false,
                data: []
            }
        },
        watch: [reloadBudgetRef]
    })

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
        for(let i = 0; i < budgetData.value.data.length; i++) {
            const budget = budgetData.value.data[i]
            budgetPos[budget.id] = i + 1
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
    <div class="flex flex-col sm:flex-row justify-center sm:justify-start items-center sm:mx-[20%] gap-4">
        <Draggable 
            v-model="budgetData.data" 
            class="flex flex-col sm:flex-row justify-center sm:justify-start items-center gap-4"
            group="budgets" 
            item-key="id"
            @change="onOrderChange"
            @start="drag = true" 
            @end="drag = false">
            <template #item="{element}">
                <UCard class="shadow-xl cursor-grab transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
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
                            <h2 class="font-semibold text-2xl text-gray-900 dark:text-white leading-tight mb-1 text-wrap cursor-auto">{{ element.name }}</h2>
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
                        <span class="text-xl cursor-auto" :style="Number(element.budget_left) < 0 ? 'color: rgb(227, 0, 0)' : ''">{{ formatCurrencyValue(Number(element.budget_left)) }}</span>
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
        </Draggable>

        <a class="cursor-pointer transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300" @click="toggleModal">
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