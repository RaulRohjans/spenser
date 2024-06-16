import { createApp as vueCreateApp, type App } from 'vue'
import SNotification from '~/components/SNotification.vue'
import { t as $t } from '~/locales/i18n.config'
import type { SNotificationProps } from '~/components/SNotification.vue'
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