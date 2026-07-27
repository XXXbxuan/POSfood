<template>
    <MainLayout>
        <RouterView v-slot="{ Component, route }">
            <component :is="Component" :key="route.fullPath" />
        </RouterView>
    </MainLayout>
    <TabletKeyboard />
    <NetworkStatus />
</template>

<script>
import MainLayout from '@/layouts/MainLayout.vue'
import TabletKeyboard from '@/components/common/TabletKeyboard.vue'
import NetworkStatus from '@/components/common/NetworkStatus.vue'

export default {
    name: 'App',
    components: { MainLayout, TabletKeyboard, NetworkStatus },
}
</script>
