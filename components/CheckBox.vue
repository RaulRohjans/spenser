<script setup lang="ts">
    export type CheckBoxProps = {
        /**
         * The id of the input
         */
        id?: string

        /**
         * Label of the input
         */
        label?: string
        
        /**
         * If the checkbox is required
         */
        required?: boolean

        /**
         * If the checkbox is disabled
         */
        disabled?: boolean
    }

    const props = withDefaults(defineProps<CheckBoxProps>(), {
        id: (Math.random() + 1).toString(36).substring(7),
        label: '',
        required: false,
        disabled: false
    })

    const emit = defineEmits<{
        (event: 'state-change', value: boolean): void
    }>()

    const model = defineModel({ type: Boolean })

    const labelClasses = computed(() => {
        const classes: string[] = ['ms-2', 'text-sm', 'font-medium']

        if(props.disabled) classes.push(...['text-gray-400', 'dark:text-gray-500'])
        else classes.push(...['text-gray-900', 'dark:text-gray-300'])

        return classes
    })
</script>

<template>
    <div class="flex items-center h-5">
        <input 
            :id="props.id"
            type="checkbox" 
            v-model="model"
            class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800" 
            :required="props.required"
            :disabled="props.disabled" />
    </div>

    <label 
        v-if="props.label"
        :for="props.id" 
        :class="labelClasses">
        {{ props.label }}
    </label>
</template>