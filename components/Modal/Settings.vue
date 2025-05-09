<script lang="ts" setup>
    const { t: $t } = useI18n()

    const emit = defineEmits(['close'])
    const isOpen = ref<boolean>(true)

    function handleOpenChange(state: boolean) {
        if(!state) emit('close')
    }
</script>

<template>
    <UModal
        v-model:open="isOpen"
        :title="$t('Settings')"
        @update:open="handleOpenChange">
        <template #body>    
            <div class="p-4">
            <!-- Your settings form goes here -->
            </div>
    
            <UButton @click="emit('close')">Close</UButton>
        </template>
    </UModal>
</template>
  

  