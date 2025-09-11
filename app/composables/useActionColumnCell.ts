import { UDropdownMenu, UButton } from '#components'
import { h } from 'vue'

interface ActionCallbacks<T> {
    onEdit?: (row: T) => void
    onDuplicate?: (row: T) => void
    onDelete?: (row: T) => void
    onSetDefault?: (row: T) => void
}

export function useActionColumnCell<T>(options: {
    actions: ('edit' | 'duplicate' | 'delete' | 'setDefault')[]
    callbacks: ActionCallbacks<T>
    isSetDefaultDisabled?: (row: T) => boolean
}) {
    const { actions, callbacks, isSetDefaultDisabled } = options
    const { t: $t } = useI18n()

    return {
        cell: ({ row }: { row: { original: T } }) => {
            const items = [
                { type: 'label', label: $t('Actions') },
                ...(actions.includes('setDefault')
                    ? [
                          {
                              label: $t('Set as Default'),
                              icon: 'i-heroicons-check-circle',
                              disabled: isSetDefaultDisabled?.(row.original) === true,
                              onSelect: () => callbacks.onSetDefault?.(row.original)
                          }
                      ]
                    : []),
                ...(actions.includes('edit')
                    ? [
                          {
                              label: $t('Edit'),
                              icon: 'i-heroicons-pencil-square-20-solid',
                              onSelect: () => callbacks.onEdit?.(row.original)
                          }
                      ]
                    : []),
                ...(actions.includes('duplicate')
                    ? [
                          {
                              label: $t('Duplicate'),
                              icon: 'i-heroicons-document-duplicate-20-solid',
                              onSelect: () =>
                                  callbacks.onDuplicate?.(row.original)
                          }
                      ]
                    : []),
                { type: 'separator' },
                ...(actions.includes('delete')
                    ? [
                          {
                              label: $t('Delete'),
                              icon: 'i-heroicons-trash-20-solid',
                              onSelect: () => callbacks.onDelete?.(row.original)
                          }
                      ]
                    : [])
            ]

            return h('div', { class: 'text-right' }, [
                h(UDropdownMenu as any, {
                    content: { align: 'end' },
                    items,
                    'aria-label': $t('Actions')
                }, {
                    default: () => h(UButton, {
                        icon: 'i-heroicons-ellipsis-vertical',
                        color: 'neutral',
                        variant: 'ghost',
                        class: 'ml-auto',
                        'aria-label': $t('Actions')
                    })
                })
            ])
        }
    }
}
