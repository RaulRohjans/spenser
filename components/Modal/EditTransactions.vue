<script setup lang="ts">
    import type { LlmTransactionObject } from '~/types/Data'
    import type { SelectOption } from '~/types/Options'
    import type { FetchTableDataResult } from '~/types/Table'

    export type ModalBudgetProps = {
        /**
         * Transactions to load into editable table
         */
        transactions: LlmTransactionObject[]

        class?: string
    }

    const props = defineProps<ModalBudgetProps>()

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    
    const model = defineModel<boolean>()
    const { token } = useAuth()
    const tableColumns = [
        {
            key: 'name',
            label: 'Name',
            sortable: true
        }, {
            key: 'value',
            label: 'Value',
            sortable: true
        },
        {
            key: 'category',
            label: 'Category',
            sortable: true
        }, 
        {
            key: 'date',
            label: 'Date',
            sortable: true
        }
    ]
    const selectedColumns = ref(tableColumns)
    const tableObj = {
        label: 'Transactions To Import',
        rowCount: props.transactions.length,
        disableFooter: true,
        filtering: false,
        rowsPerPage: false,
        actions: [],
    }
        
    // Fetch categories
    const { data: categoryData, pending: categoryLoading } = await useLazyAsyncData<FetchTableDataResult>
    ('categoryData', () => ($fetch)('/api/categories', {  
            method: 'GET',
            headers: buildRequestHeaders(token.value)
    }), {
        default: () => {
            return {
                success: false,
                data: {
                    totalRecordCount: 0,
                    rows: []
                }
            }
        }
    })

    const getCategoryOptions = computed(() => {
        const options: SelectOption[] = []

        categoryData.value.data.rows.forEach((category) => {
            options.push({
                label: category.name,
                value: category.id
            })
        })

        return options
    })

    const columnsTable = computed(() => tableColumns.filter((column) => selectedColumns.value.includes(column)))

    const getCategoryDisplayIcon = function(categoryId: number) {
        // Find the icon corresponding to the selected category
        const icon = categoryData.value.data.rows.find(c => c.id == categoryId)?.icon || ''

        return `i-heroicons-${icon}`
    }

    const getValueColColor = function(value: number){
        if(value > 0) return 'color: rgb(51, 153, 102)'
        else if(value < 0) return 'color: rgb(227, 0, 0)'
        else return ''
    }

    const onImportData = function() {

    }
</script>

<template>
    <UModal v-model="model" :ui="{ 'container': 'items-center mx-12' }" fullscreen>
        <div :class="props.class">
            <STable 
                v-bind="tableObj"
                :rows="props.transactions"
                :row-count="props.transactions.length"
                :columns="columnsTable"
                :loading="categoryLoading">

                <template #date-data="{ row }" >
                    <template v-for="date in [new Date(row.date)]">
                        <ClientOnly>
                            {{ `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` }}
                        </ClientOnly>
                    </template>
                </template>

                <template #value-data="{ row }">
                    <span :style="getValueColColor(row.value)">{{ formatCurrencyValue(Number(row.value)) }}</span>
                </template>

                <template #category-data="{ row }">
                    <USelect v-model="row.category" :options="getCategoryOptions" :loading="categoryLoading" class="hide-select-span" >
                        <template #leading>
                            <UIcon :name="getCategoryDisplayIcon(Number(row.category))" class="h-full" dynamic />
                        </template>
                    </USelect>
                </template>

                <template #extra-section>
                    <div class="w-full flex flex-row justify-between items-center">
                        <USelectMenu v-model="selectedColumns" :options="tableColumns" multiple>
                            <UButton
                                icon="i-heroicons-view-columns"
                                color="gray"
                                size="xs">
                                Columns
                            </UButton>
                        </USelectMenu>

                        <UButton 
                            icon="i-heroicons-plus"
                            color="primary"
                            size="xs"
                            @click="onImportData">
                            Import Transactions
                        </UButton>
                    </div>
                </template>
            </STable>
        </div>
    </UModal>
</template>