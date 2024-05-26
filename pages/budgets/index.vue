<script setup lang="ts">
    import type { ModalBudgetProps } from '~/components/Modal/Budget.vue'

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
        data: {}
    }>
    ('budgets', () => ($fetch)('/api/budgets', {  
            method: 'GET',
            headers: buildRequestHeaders(token.value)
    }), {
        default: () => {
            return {
                success: false,
                data: {
                }
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
    <div class="flex flex-row justify-start items-center flex-wrap sm:mx-[20%]">
        <a class="cursor-pointer" @click="toggleModal">
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