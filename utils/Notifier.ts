import { h, render, type App } from 'vue'
import { useToast } from '#imports'
import ModalChooser from '~/components/Modal/Chooser.vue'
import type { ModalChooserProps } from '~/components/Modal/Chooser.vue'
import type { EmitEventCallback } from '~/types/Data'
import { UApp } from '#components'

export class Notifier {
    private static uiProviderMounted = false
    private static uiProviderContainer: HTMLDivElement | null = null

    private static ensureUiProvidersMounted() {
        if (!import.meta.client) return
        if (this.uiProviderMounted) return

        const container = this.setupDomContainer()
        const nuxtApp = useNuxtApp()
        const vnode = h(UApp, null, { default: () => null })
        vnode.appContext = nuxtApp.vueApp._context
        render(vnode, container)

        this.uiProviderMounted = true
        this.uiProviderContainer = container
    }

    private static buildAlertTitle(type: string) {
        const { $i18n } = useNuxtApp()
        const translate = (key: string) => {
            if ($i18n && typeof $i18n.t === 'function')
                return $i18n.t(key) as string
            return key
        }

        switch (type) {
            case 'error':
                return translate('Error')
            case 'warning':
                return translate('Warning')
            case 'info':
                return translate('Info')
            case 'success':
                return translate('Success')
            default:
                return ''
        }
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
        // Ensure UI providers exist once (fixes cases where toast container isn't in DOM yet)
        this.ensureUiProvidersMounted()

        const nuxtApp = useNuxtApp()
        nuxtApp.vueApp.runWithContext(() => {
            const toast = useToast()
            if (toast && typeof toast.add === 'function') {
                toast.add({
                    title: this.buildAlertTitle(type),
                    description: message || '',
                    color: type,
                    close: {
                        color: 'neutral',
                        variant: 'ghost'
                    }
                })
            }
        })
    }
}
