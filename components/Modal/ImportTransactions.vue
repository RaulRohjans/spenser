<script setup lang="ts">
    import type { NuxtError } from '#app'
import type { LlmTransactionObject } from '~/types/Data'
    import type { SelectOption } from '~/types/Options'
    import type { FetchTableDataResult, TableRow } from '~/types/Table'

    export type ModalBudgetProps = {
        /**
         * Transactions to load into editable table
         */
        transactions: LlmTransactionObject[]

        /**
         * Custom css classes
         */
        class?: string
    }

    const props = defineProps<ModalBudgetProps>()

    const emit = defineEmits<{
        (event: 'successful-submit'): void
    }>()

    
    const model = defineModel<boolean>()
    const { token } = useAuth()
    const vTransactions: Ref<LlmTransactionObject[]> = ref(props.transactions)
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
        },
        {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            searchable: false
        }
    ]
    const selectedColumns = ref(tableColumns)
    const tableObj = {
        label: 'Transactions To Import',
        rowCount: vTransactions.value.length,
        disableFooter: true,
        filtering: false,
        rowsPerPage: false,
        actions: ['delete'],
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

    const findTransaction = function(transaction: LlmTransactionObject) {
        return vTransactions.value.findIndex(t => t === transaction)
    }

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
        $fetch(`/api/transactions/import`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { transactions: vTransactions.value }
        }).then((data) => {
            if(!data.success) return displayMessage('An error ocurred when importing the transactions.', 'error')

            // Emit success
            emit('successful-submit')

            // Disaply success message
            displayMessage(`Transactions imported successfully!`, 'success')

            // Close modal
            model.value = false
        }).catch((e: NuxtError) => displayMessage(e.statusMessage))
    }

    const delTransaction = function(row: TableRow) {
        const tIdx = vTransactions.value.indexOf(row as LlmTransactionObject)

        if (tIdx > -1) {
            vTransactions.value.splice(tIdx, 1)
            displayMessage('Transaction removed successfully', 'success')
        } 
        else displayMessage('Could not find transaction record to be removed.', 'error')        
    }
</script>

<template>
    <UModal v-model="model" :ui="{ 'container': 'items-center mx-12' }" fullscreen>
        <div :class="props.class">
            <STable 
                v-bind="tableObj"
                :rows="vTransactions"
                :row-count="vTransactions.length"
                :columns="columnsTable"
                :loading="categoryLoading"
                @delete-action="delTransaction">

                <template #date-data="{ row }" >
                    <template v-for="date in [new Date(row.date)]" :key="date">
                        <ClientOnly>
                            {{ `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` }}
                        </ClientOnly>
                    </template>
                </template>

                <template #value-data="{ row }">
                    <span :style="getValueColColor(row.value)">{{ formatCurrencyValue(Number(row.value)) }}</span>
                </template>

                <template #category-data="{ row }">
                    <USelect v-model="vTransactions[findTransaction(row)].category" :options="getCategoryOptions" :loading="categoryLoading" class="hide-select-span" >
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