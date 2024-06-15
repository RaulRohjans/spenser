import { createApp as vueCreateApp } from 'vue'
import SNotification from '~/components/SNotification.vue'
import type { SNotificationProps } from '~/components/SNotification.vue'
import type { EmitEventCallback } from '~/types/Data'

export class Notifier {
    static displayMessage(
        message: string | undefined | null,
        type: 'info' | 'warning' | 'error' | 'success' = 'info'
    ) {
        const { t: $t } = useI18n()

        // Create container and add to DOM
        const mountEl = document.createElement('div')
        document.body.appendChild(mountEl)
    
        // Build title
        let title = ''
        switch(type) {
            case 'error':
                title = $t('Error')
                break
            case 'warning':
                title = $t('Warning')
                break
            case 'info':
                title = $t('Info')
                break
            case 'success':
                title = $t('Success')
                break
        }


        const emitCallbacks: { [key: string]: EmitEventCallback } = {
            close: () => {
                console.log('Hell Yeah!')
            }
        }

        const props: SNotificationProps = {
            title,
            message: message || '',
            type,
            emitCallbacks
        }

        // Create app vue instance & mount
        vueCreateApp(SNotification, {...props}).mount(mountEl)
    }
}