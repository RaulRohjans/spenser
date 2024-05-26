<script setup lang="ts">
    import type { ModalBudgetProps } from '~/components/Modal/Budget.vue'
    import type { BudgetDataObject } from '~/types/Data'

    const { token } = useAuth()
    const isModalOpen: Ref<boolean> = ref(false)
    const reloadModal: Ref<number> = ref(0)
    const budgetLoaderObj: Ref<ModalBudgetProps | null> = ref(null)

    const toggleModal = function() {
        isModalOpen.value = !isModalOpen.value
    }

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
        }
    })

    // Reset vbind model when modal is closed
    watch(isModalOpen, (newVal) => {        
        if(!newVal) budgetLoaderObj.value = null

        // Reset modal and reload
        // This will make sure new props are loaded correctly
        reloadModal.value++ 
    })
</script>

<template>
    <div class="flex flex-row justify-start items-center flex-wrap sm:mx-[20%] gap-4">
        <template v-for="budget in budgetData.data">
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
                        <h2 class="font-semibold text-2xl text-gray-900 dark:text-white leading-tight mb-1 text-wrap cursor-auto">{{ budget.name }}</h2>
                        <UBadge
                            v-if="budget.category"
                            class="cursor-auto"
                            color="primary" 
                            variant="subtle" 
                            :ui="{ rounded: 'rounded-full' }">
                            <div class="flex flex-row gap-2 justify-center items-center px-0.5">
                                <UIcon class="h-3 w-3" :name="`i-heroicons-${budget.category_icon}`" dynamic/>
                                {{ budget.category_name }}
                            </div>
                        </UBadge>
                    </div>
                </template>

                <div class="flex flex-col justify-center items-center">
                    <span class="text-xl cursor-auto" :style="Number(budget.budget_left) < 0 ? 'color: rgb(227, 0, 0)' : ''">{{ formatCurrencyValue(Number(budget.budget_left)) }}</span>
                </div>
                
                <template #footer>
                    <div class="flex flex-row justify-between items-center w-full gap-8">
                        <span class="text-xs cursor-auto">Period: {{ budget.period }}</span>

                        <div class="flex flex-row justify-start items-center">
                            <UButton
                                icon="i-heroicons-pencil-square"
                                size="xs"
                                color="primary"
                                square
                                variant="ghost" />

                            <UButton
                                icon="i-heroicons-trash"
                                size="xs"
                                color="primary"
                                square
                                variant="ghost" />
                        </div>
                    </div>
                </template>
            </UCard>
        </template>

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

    <ModalBudget 
        :key="reloadModal"
        v-model="isModalOpen" 
        v-bind="budgetLoaderObj"/>
</template>