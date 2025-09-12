import { h, render, type App } from 'vue'
import ModalChooser from '~/components/Modal/Chooser.vue'
import type { ModalChooserProps } from '~/components/Modal/Chooser.vue'
import ModalProgress from '~/components/Modal/Progress.vue'
import type { ModalProgressProps } from '~/components/Modal/Progress.vue'
import type { EmitEventCallback } from '~~/types/Data'
import { UApp } from '#components'

export class Notifier {
    private static uiProviderMounted = false
    private static uiProviderContainer: HTMLDivElement | null = null
    private static toasterOptions: {
        position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    } = { position: 'top-right' }

    private static ensureUiProvidersMounted() {
        if (!import.meta.client) return
        if (this.uiProviderMounted) return

        const container = this.setupDomContainer()
        const nuxtApp = useNuxtApp()
        const vnode = h(
            UApp,
            { toaster: this.toasterOptions },
            { default: () => null }
        )
        vnode.appContext = nuxtApp.vueApp._context
        render(vnode, container)

        this.uiProviderMounted = true
        this.uiProviderContainer = container
    }

    private static updateUiProviders() {
        if (!import.meta.client) return
        if (!this.uiProviderContainer) return

        const nuxtApp = useNuxtApp()
        const vnode = h(
            UApp,
            { toaster: this.toasterOptions },
            { default: () => null }
        )
        vnode.appContext = nuxtApp.vueApp._context
        render(vnode, this.uiProviderContainer)
    }

    static configureToaster(options: {
        position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    }) {
        this.toasterOptions = { ...this.toasterOptions, ...options }
        this.updateUiProviders()
    }

    private static buildAlertTitle(type: string) {
        const { $i18n } = useNuxtApp()

        // The reason this has to be used this way is because it expects to be used inside setup of a component
        // and this is the hack to get around it and use it here
        const translate = (key: string) => {
            if (
                $i18n &&
                typeof ($i18n as { t?: (k: string) => unknown }).t ===
                    'function'
            ) {
                return ($i18n as { t: (k: string) => unknown }).t(key) as string
            }
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

    private static safeRemoveNode(el: HTMLElement | null) {
        try {
            if (el && el.parentNode) el.parentNode.removeChild(el)
        } catch {
            /* no-op */
        }
    }

    static showChooser(
        title: string,
        message: string,
        confirmCallback?: { (): void },
        cancelCallback?: { (): void },
        options?: { buttons?: Array<{ label: string; action: 'confirm' | 'cancel' | 'close'; color?: string }> }
    ) {
        const container = this.setupDomContainer()
        const nuxtApp = useNuxtApp()

        // Build component emit callbacks
        const unmount = () => { render(null, container); this.safeRemoveNode(container) }
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
        const props: ModalChooserProps = { title, message, buttons: options?.buttons }

        // Render ModalChooser directly within existing Nuxt app context
        const vnode = h(ModalChooser, {
            ...props,
            onConfirm: () => emitCallbacks.confirm!(nuxtApp.vueApp),
            onCancel: () => emitCallbacks.cancel!(nuxtApp.vueApp),
            onClose: () => emitCallbacks.close!(nuxtApp.vueApp)
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
        // Ensure a single notifications outlet exists without duplicating providers
        this.ensureUiProvidersMounted()

        // Use the existing app context to dispatch the toast
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

    static showProgress(
        message: string,
        initialValue: number = 0
    ): {
        update: (nextValue?: number, nextMessage?: string) => void
        success: (finalMessage?: string, autoCloseMs?: number) => void
        error: (finalMessage?: string, autoCloseMs?: number) => void
        close: () => void
    } {
        const container = this.setupDomContainer()
        const nuxtApp = useNuxtApp()

        let value = Math.max(0, Math.min(100, initialValue))
        let text = message
        let color: ModalProgressProps['color'] = 'primary'

        const mount = () => {
            nuxtApp.vueApp.runWithContext(() => {
                const vnode = h(ModalProgress, {
                    text,
                    value,
                    color
                })
                vnode.appContext = nuxtApp.vueApp._context
                render(vnode, container)
            })
        }

        const close = () => {
            render(null, container)
            document.body.removeChild(container)
        }

        const update = (nextValue?: number, nextMessage?: string) => {
            if (typeof nextValue === 'number')
                value = Math.max(0, Math.min(100, nextValue))
            if (typeof nextMessage === 'string') text = nextMessage
            color = 'primary'
            mount()
        }

        const success = (finalMessage?: string, autoCloseMs: number = 800) => {
            value = 100
            color = 'success'
            if (finalMessage) text = finalMessage
            mount()
            setTimeout(close, autoCloseMs)
        }

        const error = (finalMessage?: string, autoCloseMs: number = 1500) => {
            color = 'error'
            if (finalMessage) text = finalMessage
            mount()
            setTimeout(close, autoCloseMs)
        }

        // initial render
        mount()

        return { update, success, error, close }
    }
}
