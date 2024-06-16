import { createApp as vueCreateApp, type App } from 'vue'
import { t as $t } from '~/locales/i18n.config'
import SNotification from '~/components/SNotification.vue'
import ModalChooser from '~/components/Modal/Chooser.vue'
import type { SNotificationProps } from '~/components/SNotification.vue'
import type { ModalChooserProps } from '~/components/Modal/Chooser.vue'
import type { EmitEventCallback } from '~/types/Data'

export class Notifier {
    private static buildAlertTitle(type: string) {
        const locale = getLocaleFromRoute()

        let title = ''
        switch(type) {
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
        // Create div container and add to body
        const mountEl = document.createElement('div')
        document.body.appendChild(mountEl)

        return mountEl
    }

    static showChooser(
        title: string,
        message: string,
        confirmCallback?: { () : void },
        cancelCallback?: { () : void }
    ) {
        const container = this.setupDomContainer()

        // Build component emit callbacks
        const emitCallbacks: { [key: string]: EmitEventCallback } = {
            confirm: (app: App<Element>) => {
                if(confirmCallback) confirmCallback()
                
                // Unmount alert app instance
                app.unmount()
                
                // Remove alert div from dom
                document.body.removeChild(container)
            },
            cancel: (app: App<Element>) => {                
                if(cancelCallback) cancelCallback()
                
                // Unmount alert app instance
                app.unmount()
                
                // Remove alert div from dom
                document.body.removeChild(container)
            },
            close: (app: App<Element>) => {
                // Unmount alert app instance
                app.unmount()

                // Remove alert div from dom
                document.body.removeChild(container)
            }
        }

        // Build component props
        const props: ModalChooserProps = {
            title,
            message
        }

        // Create app vue instance & mount
        const app = vueCreateApp({
            render() {
                return h(ModalChooser, {
                    ...props,
                    onConfirm: () => emitCallbacks.confirm(app),
                    onCancel: () => emitCallbacks.cancel(app),
                    onClose: () => emitCallbacks.close(app),
                })
            }
        })

        app.mount(container)
    }

    static showAlert(
        message: string | undefined | null,
        type: 'info' | 'warning' | 'error' | 'success' = 'info'
    ) {
        const container = this.setupDomContainer()
                
        // Build component emit callbacks
        const emitCallbacks: { [key: string]: EmitEventCallback } = {
            close: (app: App<Element>) => {
                // Unmount alert app instance
                app.unmount()

                // Remove alert div from dom
                document.body.removeChild(container)
            }
        }

        // Build component props
        const props: SNotificationProps = {
            title: this.buildAlertTitle(type),
            message: message || '',
            type
        }

        // Create app vue instance & mount
        const app = vueCreateApp({
            render() {
                return h(SNotification, {
                    ...props,
                    onClose: () => emitCallbacks.close(app)
                })
            }
        })

        app.mount(container)
    }
}