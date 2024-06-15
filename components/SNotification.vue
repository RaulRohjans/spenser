<script setup lang="ts">
    import type { EmitEventCallback } from '~/types/Data'

    export interface SNotificationProps {
        /*
         * Title of the notification
         */
        title: string

        /*
         * Message of the notification
         */
        message: string

        /*
         * Notification display timeout
         */
        timeout?: number

        /*
         * Type of notification to be displayed
         */
        type?: 'info' | 'warning' | 'error' | 'success'

        /*
         * Emit event callbacks
         */
        emitCallbacks?: { [key: string]: EmitEventCallback }
    }

    const props = withDefaults(defineProps<SNotificationProps>(), {
        timeout: 5000,
        type: 'info'
    })

    const emit = defineEmits<{
        (event: 'close'): void
    }>()

    const getColor = computed(() => {
        switch(props.type) {
            case 'info': return 'primary'
            case 'error': return 'error'
            case 'success': return 'green'
            case 'warning': return 'yellow'
        }
    })

    const getIcon = computed(() => {
        const prefix = 'i-heroicons-'

        switch(props.type) {
            case 'info': return `${prefix}information-circle`
            case 'error': return `${prefix}x-circle`
            case 'success': return `${prefix}check-circle`
            case 'warning': return `${prefix}exclamation-circle`
        }
    })
    
    const onClose = function () {
        // Run callbacks if there are any
        if(props.emitCallbacks && 'close' in props.emitCallbacks) 
            props.emitCallbacks.close()

        emit('close')
    }
</script>

<template>
    <div class="absolute top-4 right-4 w-[20%]">
        <div class="sticky">
            <UNotification
                :title="props.title"
                :description="props.message"
                :icon="getIcon"
                :color="getColor"
                :timeout="timeout"
                @close="onClose"
            />
        </div>
    </div>
</template>