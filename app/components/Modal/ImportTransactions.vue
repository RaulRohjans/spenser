<script setup lang="ts">
    import { formatCurrencyValue } from '#imports'
    import type { NuxtError } from '#app'
    import type { LlmTransactionObject } from '~~/types/Data'
    import type { SelectOption } from '~~/types/Options'
    import type { FetchTableDataResult, TableRow } from '~~/types/Table'
    import type { Category } from '~~/server/db/schema'

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
    const { t: $t } = useI18n()
    const vTransactions: Ref<LlmTransactionObject[]> = ref(props.transactions)
    const tableColumns = [
        {
            key: 'name',
            label: $t('Name'),
            sortable: true
        },
        {
            key: 'value',
            label: $t('Value'),
            sortable: true
        },
        {
            key: 'category',
            label: $t('Category'),
            sortable: true
        },
        {
            key: 'date',
            label: $t('Date'),
            sortable: true
        },
        {
            key: 'actions',
            label: $t('Actions'),
            sortable: false,
            searchable: false
        }
    ]
    const selectedColumns = ref(tableColumns)
    const tableObj = {
        label: $t('Transactions To Import'),
        rowCount: vTransactions.value.length,
        disableFooter: true,
        filtering: false,
        rowsPerPage: false,
        actions: ['delete']
    }

    // Fetch categories
    const { data: categoryData, pending: categoryLoading } =
        await useLazyAsyncData<FetchTableDataResult<Category>>(
            'categoryData',
            () =>
                $fetch('/api/categories', {
                    method: 'GET',
                    headers: buildRequestHeaders(token.value)
                }),
            {
                default: () => {
                    return {
                        success: false,
                        data: {
                            totalRecordCount: 0,
                            rows: []
                        }
                    }
                }
            }
        )

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

    const columnsTable = computed(() =>
        tableColumns.filter((column) => selectedColumns.value.includes(column))
    )

    const findTransaction = function (transaction: LlmTransactionObject) {
        return vTransactions.value.findIndex((t) => t === transaction)
    }

    const getCategoryDisplayIcon = function (categoryId: number) {
        // Find the icon corresponding to the selected category
        const icon =
            categoryData.value.data.rows.find((c) => c.id == categoryId)
                ?.icon || ''

        return getHeroIconName(icon)
    }

    const getValueColColor = function (value: number) {
        if (value > 0) return 'color: rgb(51, 153, 102)'
        else if (value < 0) return 'color: rgb(227, 0, 0)'
        else return ''
    }

    const onImportData = function () {
        $fetch(`/api/transactions/import`, {
            method: 'POST',
            headers: buildRequestHeaders(token.value),
            body: { transactions: vTransactions.value }
        })
            .then((data) => {
                if (!data.success)
                    return Notifier.showAlert(
                        $t(
                            'An error occurred while importing the transactions.'
                        ),
                        'error'
                    )

                // Emit success
                emit('successful-submit')

                // Disaply success message
                Notifier.showAlert(
                    $t('Transactions imported successfully!'),
                    'success'
                )

                // Close modal
                model.value = false
            })
            .catch((e: NuxtError) =>
                Notifier.showAlert(e.statusMessage, 'error')
            )
    }

    const delTransaction = function (row: TableRow) {
        const tIdx = vTransactions.value.indexOf(row as LlmTransactionObject)

        if (tIdx > -1) {
            vTransactions.value.splice(tIdx, 1)
            Notifier.showAlert(
                $t('Transaction removed successfully'),
                'success'
            )
        } else
            Notifier.showAlert(
                $t('Could not find transaction record to be removed.'),
                'error'
            )
    }
</script>

<template>
    <UModal v-model="model" :ui="{ content: 'items-center mx-12' }" fullscreen>
        <div :class="props.class">
            <STable
                v-bind="tableObj"
                :rows="vTransactions"
                :row-count="vTransactions.length"
                :columns="columnsTable"
                :loading="categoryLoading"
                @delete-action="delTransaction">
                <template #date-data="{ row }">
                    <template v-for="date in [new Date(row.date)]" :key="date">
                        <ClientOnly>
                            {{
                                `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
                            }}
                        </ClientOnly>
                    </template>
                </template>

                <template #value-data="{ row }">
                    <span :style="getValueColColor(row.value)">{{
                        formatCurrencyValue(Number(row.value))
                    }}</span>
                </template>

                <template #category-data="{ row }">
                    <USelect
                        v-model="vTransactions[findTransaction(row)].category"
                        :items="getCategoryOptions"
                        :loading="categoryLoading"
                        class="hide-select-span">
                        <template #leading>
                            <UIcon
                                :name="
                                    getCategoryDisplayIcon(Number(row.category))
                                "
                                class="h-full"
                                dynamic />
                        </template>
                    </USelect>
                </template>

                <template #extra-section>
                    <div
                        class="w-full flex flex-row justify-between items-center">
                        <USelectMenu
                            v-model="selectedColumns"
                            :items="tableColumns"
                            multiple>
                            <UButton
                                icon="i-heroicons-view-columns"
                                color="neutral"
                                size="xs">
                                {{ $t('Columns') }}
                            </UButton>
                        </USelectMenu>

                        <UButton
                            icon="i-heroicons-plus"
                            color="primary"
                            size="xs"
                            @click="onImportData">
                            {{ $t('Import Transactions') }}
                        </UButton>
                    </div>
                </template>
            </STable>
        </div>
    </UModal>
</template>
