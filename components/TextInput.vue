<script setup lang="ts">
    export type TextInputProps = {
        /**
         * The id of the input
         */
        id?: string

        /**
         * If the input is type password
         */
        password?: boolean

        /**
         * Label of the input
         */
        label?: string

        /**
         * Placeholder of the input
         */
        placeholder?: string
        
        /**
         * If the input is required
         */
        required?: boolean

        /**
         * If the input is disabled
         */
        disabled?: boolean
    }

    const props = withDefaults(defineProps<TextInputProps>(), {
        id: (Math.random() + 1).toString(36).substring(7),
        password: false,
        label: '',
        placeholder: '',
        required: false,
        disabled: false
    })

    const emit = defineEmits<{
        (event: 'text-change', value: string): void
    }>()

    const model = defineModel({ type: String })

    const getInputType = computed(() => {
        if(props.password) return 'password'
        else return 'text'
    })

    const getPlaceholder = computed(() => {
        if(props.password) return '•••••••••'
        else return props.placeholder
    })

    const inputClasses = computed(() => {
        const classes: string[] = ['border', 'border-gray-300', 'text-gray-900', 'text-sm', 'rounded-lg', 'focus:ring-blue-500', 
            'focus:border-blue-500', 'block w-full', 'p-2.5', 'dark:bg-gray-700', 'dark:border-gray-600', 'dark:placeholder-gray-400',
            'dark:focus:ring-blue-500', 'dark:focus:border-blue-500']
    
        if(props.disabled) classes.push(...['bg-gray-100', 'cursor-not-allowed', 'dark:text-gray-400'])
        else classes.push(...['bg-gray-50', 'dark:text-white'])

        return classes
    })

    const onTextChange = function(event: Event) {
        emit('text-change', (event.target as HTMLInputElement).value)
    }
</script>

<template>
    <label 
        v-if="props.label"
        :for="props.id"
        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        {{ props.label }}
    </label>

    <input 
        :type="getInputType"
        :id="id"
        v-model="model"
        :class="inputClasses" 
        :placeholder="getPlaceholder"
        :required="props.required"
        :disabled="props.disabled"
        @input="onTextChange" />
</template>