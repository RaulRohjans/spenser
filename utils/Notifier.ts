import SNotification from '~/components/SNotification.vue'
import { createApp as vueCreateApp } from 'vue'

export class Notifier {
    static displayMessage(
        message: string | undefined | null,
        type: 'info' | 'warning' | 'error' | 'success' = 'info'
    ) {    
        // Create container and add to DOM
        const mountEl = document.createElement('div')
        document.body.appendChild(mountEl)
    
        // Mount instace to div
        vueCreateApp(SNotification).mount(mountEl)
    }
}