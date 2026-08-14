<template>
    <PosSidebar v-if="activeSidebar" :active="activeSidebar" />
    <slot></slot>
</template>

<script>
import PosSidebar from '@/components/common/PosSidebar.vue'

export default {
    name: 'MainLayout',
    components: { PosSidebar },
    computed: {
        activeSidebar() {
            return String(this.$route.meta.sidebar || '')
        },
    },
}
</script>
