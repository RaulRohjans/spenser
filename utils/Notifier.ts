import { h, render, type App } from 'vue'
import ModalChooser from '~/components/Modal/Chooser.vue'
import type { ModalChooserProps } from '~/components/Modal/Chooser.vue'
import type { EmitEventCallback } from '~/types/Data'
import { UApp } from '#components'

export class Notifier {
    private static buildAlertTitle(type: string) {
        const { t: $t } = useI18n()
        const locale = getLocaleFromRoute()

        let title = ''
        switch (type) {
            case 'error':
                title = $t('Error', locale)
                break
            case 'warning':
                title = $t('Warning', locale)
                break
            case 'info':
                title = $t('Info', locale)
                break
            case 'success':
                title = $t('Success', locale)
                break
        }

        return title
    }

    private static setupDomContainer() {
        const mountEl = document.createElement('div')
        document.body.appendChild(mountEl)

        return mountEl
    }

    static showChooser(
        title: string,
        message: string,
        confirmCallback?: { (): void },
        cancelCallback?: { (): void }
    ) {
        const container = this.setupDomContainer()
        const nuxtApp = useNuxtApp()

        // Build component emit callbacks
        const unmount = () => {
            render(null, container)
            document.body.removeChild(container)
        }
        const emitCallbacks: { [key: string]: EmitEventCallback } = {
            confirm: (_app: App<Element>) => {
                if (confirmCallback) confirmCallback()
                unmount()
            },
            cancel: (_app: App<Element>) => {
                if (cancelCallback) cancelCallback()
                unmount()
            },
            close: (_app: App<Element>) => {
                unmount()
            }
        }

        // Build component props
        const props: ModalChooserProps = {
            title,
            message
        }

        // Render vnode within existing Nuxt app context
        const vnode = h(UApp, null, {
            default: () =>
                h(ModalChooser, {
                    ...props,
                    onConfirm: () => emitCallbacks.confirm(nuxtApp.vueApp),
                    onCancel: () => emitCallbacks.cancel(nuxtApp.vueApp),
                    onClose: () => emitCallbacks.close(nuxtApp.vueApp)
                })
        })
        vnode.appContext = nuxtApp.vueApp._context
        render(vnode, container)
    }

    static showAlert(
        message: string | undefined | null,
        type:
            | 'info'
            | 'warning'
            | 'error'
            | 'success'
            | 'primary'
            | 'neutral'
            | 'secondary' = 'info'
    ) {
        // Prefer Nuxt UI 3 toast API
        const toast = typeof useToast === 'function' ? useToast() : null
        if (toast && typeof toast.add === 'function') {
            toast.add({
                title: this.buildAlertTitle(type),
                description: message || '',
                color: type
            })
            return
        }

        // Fallback: render our own component tree (should rarely be needed)
        const container = this.setupDomContainer()
        const nuxtApp = useNuxtApp()
        const vnode = h(UApp, null, {
            default: () =>
                h('div', { class: 'fixed right-4 top-4 z-[100]' }, [
                    h(
                        'div',
                        {
                            class: 'rounded-md px-4 py-3 shadow-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white'
                        },
                        [
                            h(
                                'div',
                                { class: 'font-semibold mb-1' },
                                this.buildAlertTitle(type)
                            ),
                            h('div', null, message || '')
                        ]
                    )
                ])
        })
        vnode.appContext = nuxtApp.vueApp._context
        render(vnode, container)
    }
}
