<script setup lang="ts">
    /**
     * SLanguagePicker
     *
     * A polished language dropdown that shows each language's flag and autonym
     * (self name). Emits the selected BCP-47/ISO code (e.g. 'en', 'pt').
     */
    const props = withDefaults(defineProps<{ modelValue: string; size?: 'sm' | 'md' | 'lg' }>(), {
        size: 'md'
    })
    const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

    type LangItem = { value: string; autonym: string; name: string; flag: string; label: string }
    const languages: LangItem[] = [
        { value: 'en', autonym: 'English', name: 'English', flag: '🇺🇸', label: 'English' },
        { value: 'pt', autonym: 'Português', name: 'Portuguese', flag: '🇵🇹', label: 'Português' }
    ]

    const selected = computed({
        get: () => props.modelValue,
        set: (v: string) => emit('update:modelValue', v)
    })

    const findByCode = (code?: string | null): LangItem | undefined =>
        languages.find((l) => l.value === code)
</script>

<template>
    <USelect
        v-model="selected"
        :items="languages"
        :size="props.size"
        class="w-48 min-w-[11rem]"
        :ui="{ base: 'justify-start', content: 'min-w-[12rem]' }">
        <template #leading="{ modelValue }">
            <span v-if="findByCode(modelValue)" class="text-lg leading-none">
                {{ findByCode(modelValue)?.flag }}
            </span>
        </template>

        <template #item="{ item }">
            <div class="flex items-center gap-2 py-1">
                <span class="text-lg leading-none">{{ item.flag }}</span>
                <span class="font-medium">{{ item.autonym }}</span>
                <span class="opacity-60 text-xs">({{ item.name }})</span>
            </div>
        </template>
    </USelect>
</template>

<style scoped></style>


