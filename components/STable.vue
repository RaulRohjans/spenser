<script setup lang="ts">
    import type {
        TableColumn,
        TableRow,
        TableAction,
        TableSort
    } from '@/types/Table'
    import type { SelectOption } from '@/types/Options'

    export interface STableProps {
        /*
         * Table name/label to be displayed on top
         */
        label?: string

        /*
         * Columns of the table
         */
        columns?: TableColumn[] | null

        /*
         * Rows of the table
         */
        rows?: TableRow[] | null

        /*
         * Total row count
         */
        rowCount?: number

        /*
         * Actions of each table row
         */
        actions?: string[] | null

        /*
         * If the table data is loading
         */
        loading?: boolean

        /*
         * If the table has a search box
         */
        enableSearch?: boolean

        /*
         * If the search box includes a column filter
         */
        hasSeachColumn?: boolean

        /*
         * Toggle table column sorting
         */
        sorting?: boolean

        /*
         * Toggle table filtering
         */
        filtering?: boolean

        /*
         * Toggle the filter reset mechanism and let the dev handle the behavior
         */
        manualFilterReset?: boolean

        /*
         * Toggle showing rows per page dropdown
         */
        rowsPerPage?: boolean

        /*
         * Component CSS classes
         */
        class?: string

        /*
         * Disable table footer
         */
        disableFooter?: boolean
    }

    const props = withDefaults(defineProps<STableProps>(), {
        columns: null,
        rows: null,
        rowCount: 0,
        actions: null,
        enableSearch: true,
        hasSeachColumn: true,
        sorting: true,
        filtering: true,
        manualFilterReset: false,
        rowsPerPage: true,
        disableFooter: false,
        class: '',
        label: ''
    })

    const emit = defineEmits<{
        (event: 'reset-filters'): void
        (event: 'edit-action', row: TableRow): void
        (event: 'duplicate-action', row: TableRow): void
        (event: 'delete-action', row: TableRow): void
    }>()

    const { t: $t } = useI18n()
    const selectedColumns = ref(props.columns)
    const selectLoadKey: Ref<number> = ref(0)
    const page = defineModel<number>('page', { default: 1 })
    const pageCount = defineModel<number>('pageCount', { default: 10 })
    const search = defineModel<string>('search', { default: '' })
    const searchColumn = defineModel<string>('searchColumn', { default: '' })
    const sort = defineModel<TableSort>('sort', { default: {} })

    const columnsTable = computed(() =>
        props.columns
            ?.filter((column) => selectedColumns.value?.includes(column))
            .map((col) => {
                delete col.searchable

                return col
            })
    )

    const actionItems = computed(() => {
        if (!props.actions || props.actions.length == 0) return null

        return (row: TableRow) => {
            const actions: TableAction[][] = []

            if (props.actions?.includes('edit'))
                actions.push([
                    {
                        label: $t('Edit'),
                        icon: 'i-heroicons-pencil-square-20-solid',
                        click: () => emit('edit-action', row)
                    }
                ])

            if (props.actions?.includes('duplicate')) {
                if (actions.length == 0) actions.push([])

                actions[0].push({
                    label: $t('Duplicate'),
                    icon: 'i-heroicons-document-duplicate-20-solid',
                    click: () => emit('duplicate-action', row)
                })
            }

            if (props.actions?.includes('delete'))
                actions.push([
                    {
                        label: $t('Delete'),
                        icon: 'i-heroicons-trash-20-solid',
                        click: () => emit('delete-action', row)
                    }
                ])

            return actions
        }
    })

    const pageFrom = computed(() => (page.value - 1) * pageCount.value + 1)

    const pageTo = computed(() =>
        Math.min(page.value * pageCount.value, props.rowCount)
    )

    const getSearchColumns = computed(() => {
        const options: SelectOption[] = []

        props.columns?.forEach((col) => {
            if (col.searchable === false) return

            options.push({
                name: col.label || '',
                value: col.key
            })
        })

        return options
    })

    const getClasses = computed(() => {
        if (props.class) return props.class
        else return 'w-full shadow-xl'
    })

    const resetFilters = function () {
        if (!props.manualFilterReset) {
            search.value = ''
            selectedColumns.value = props.columns
        }
        emit('reset-filters')
    }

    onMounted(() => {
        /* Nuxt UI doesnt fail to surprise me by how weird it wants to be...
         * When the USelect loads on a page refresh, it selectes the last value that was selected
         * event when a diffent value is passed in the modalValue!
         *
         * But whats worse than this is that when it decides to load the last selected option
         * instead of what I want, it doesn't update the modal value :(
         *
         * (example)
         * I end up with model value 10, which is the default, and 5 selected in the USelect
         * because it was the last thing that was selected
         *
         * This key increment fixes the issue
         */
        selectLoadKey.value++
    })
</script>

<template>
    <UCard
        :class="getClasses"
        :ui="{
            base: '',
            ring: '',
            divide: 'divide-y divide-gray-200 dark:divide-gray-700',
            header: { padding: 'px-4 py-5' },
            body: {
                padding: '',
                base: 'divide-y divide-gray-200 dark:divide-gray-700'
            },
            footer: { padding: 'p-4' }
        }">
        <template v-if="label" #header>
            <h2
                class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                {{ label }}
            </h2>
        </template>

        <!-- Filters -->
        <div
            v-if="props.filtering"
            class="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 px-4 py-3">
            <div v-if="props.enableSearch" class="flex flex-row gap-1">
                <USelect
                    v-if="hasSeachColumn"
                    :key="selectLoadKey"
                    v-model="searchColumn"
                    :options="getSearchColumns"
                    option-attribute="name" />
                <UInput
                    v-model="search"
                    icon="i-heroicons-magnifying-glass-20-solid"
                    placeholder="Search..."
                    :trailing="hasSeachColumn" />
            </div>

            <slot name="filters" />
        </div>

        <!-- Header and Action buttons -->
        <div
            v-if="props.filtering || props.rowsPerPage"
            class="flex justify-between items-center w-full px-4 py-3">
            <div class="flex items-center gap-1.5">
                <span v-if="props.rowsPerPage" class="text-sm leading-5">
                    {{ $t('Rows per page') }}:
                </span>

                <USelect
                    v-if="props.rowsPerPage"
                    :key="selectLoadKey"
                    v-model="pageCount"
                    :options="[5, 10, 20, 30, 40, 50]"
                    class="me-2 w-20"
                    size="xs" />
            </div>

            <div v-if="props.filtering" class="flex gap-1.5 items-center">
                <USelectMenu
                    v-model="selectedColumns"
                    :options="columns"
                    multiple>
                    <UButton
                        icon="i-heroicons-view-columns"
                        color="gray"
                        size="xs">
                        {{ $t('Columns') }}
                    </UButton>
                </USelectMenu>

                <UButton
                    icon="i-heroicons-funnel"
                    color="gray"
                    size="xs"
                    @click="resetFilters">
                    {{ $t('Reset') }}
                </UButton>
            </div>
        </div>

        <div
            v-if="$slots['extra-section']"
            class="flex items-center justify-between gap-3 px-4 py-3">
            <slot name="extra-section" />
        </div>

        <!-- Table -->
        <UTable
            v-model:sort="sort"
            :rows="props.rows"
            :columns="columnsTable"
            :loading="props.loading"
            :loading-state="{
                icon: 'i-heroicons-arrow-path-20-solid',
                label: $t('Loading...')
            }"
            :progress="{ color: 'primary', animation: 'carousel' }"
            sort-asc-icon="i-heroicons-arrow-up"
            sort-desc-icon="i-heroicons-arrow-down"
            sort-mode="manual"
            class="w-full"
            :ui="{
                td: { base: 'max-w-[0] truncate' },
                default: { checkbox: { color: 'gray' } }
            }">
            <!-- 
                Pass all other slots directly to the UTable component
                This allows manipulating row data and row header
            -->
            <template v-for="(_, name) in $slots" #[name]="slotData">
                <slot :name="name" v-bind="slotData" />
            </template>

            <template v-if="actionItems" #actions-data="{ row }">
                <UDropdown :items="actionItems(row)">
                    <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-ellipsis-horizontal-20-solid" />
                </UDropdown>
            </template>
        </UTable>

        <!-- Number of rows & Pagination -->
        <template v-if="!disableFooter" #footer>
            <div class="flex flex-wrap justify-between items-center">
                <div>
                    <span class="text-sm leading-5">
                        {{ $t('Showing') }}
                        <span class="font-medium">{{ pageFrom }}</span>
                        {{ $t('to') }}
                        <span class="font-medium">{{ pageTo }}</span>
                        {{ $t('of') }}
                        <span class="font-medium">{{ props.rowCount }}</span>
                        {{ $t('results') }}
                    </span>
                </div>

                <UPagination
                    v-model="page"
                    :page-count="pageCount"
                    :total="props.rowCount" />
            </div>
        </template>
    </UCard>
</template>
