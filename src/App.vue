<template>
    <RouterView />
    <ToastStack />
</template>

<script>
import ToastStack from '@/components/ToastStack.vue'

export default {
    name: 'InventoryApp',
    components: { ToastStack },
}
</script>
