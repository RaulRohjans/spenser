<script setup lang="ts">
    import type { EmitEventCallback } from '~~/types/Data'

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
        switch (props.type) {
            case 'info':
                return 'gray'
            case 'error':
                return 'red'
            case 'success':
                return 'green'
            case 'warning':
                return 'yellow'
            default:
                throw new Error('Invalid notification type')
        }
    })

    const getIcon = computed(() => {
        switch (props.type) {
            case 'info':
                return 'i-heroicons-information-circle'
            case 'error':
                return 'i-heroicons-x-circle'
            case 'success':
                return 'i-heroicons-check-circle'
            case 'warning':
                return 'i-heroicons-exclamation-circle'
            default:
                throw new Error('Invalid notification type')
        }
    })

    const onClose = function () {
        // Run callbacks if there are any
        if (props.emitCallbacks && 'close' in props.emitCallbacks)
            props.emitCallbacks.close()

        emit('close')
    }
</script>

<template>
    <!--
    This is again another hack due to NuxtUi being the way it is.
    
    UNotification doesn't support dynamic icons, which means to achieve that
    you would have to use a slot for #title and set a UIcon there with the dynamic prop.
    The problem is that rendering a dynamic icon here messes up the entire browser window,
    it crashes!

    So current solution is load these into the DOM so they are present in Tailwind bundle
    and can be "dynamically" used in UNotification
    -->
    <div class="hidden">
        <span class="i-heroicons-information-circle" />
        <span class="i-heroicons-x-circle" />
        <span class="i-heroicons-check-circle" />
        <span class="i-heroicons-exclamation-circle" />
    </div>
    <!------------------------------------------------->

    <div
        class="absolute top-4 right-4 w-[calc(100%-(1rem*2))] sm:w-[50%] lg:w-[30%]">
        <div class="sticky">
            <UNotification
                :id="1"
                :icon="getIcon"
                :title="props.title"
                :description="props.message"
                :color="getColor"
                :timeout="props.timeout"
                @close="onClose" />
        </div>
    </div>
</template>
