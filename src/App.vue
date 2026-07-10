<template>
    <Preloader v-if="perload"></Preloader>

    <RouterView v-slot="{ Component }" v-if="isRouterAlive">
        <transition name="fade-slow" mode="out-in">
            <component :is="Component" />
        </transition>
    </RouterView>
</template>

<script setup>
import Preloader from '@/components/preloader/index.vue'
import { nextTick, provide, ref } from 'vue'

const isRouterAlive = ref(true)
const perload = ref(false)

const onRefresh = () => {
    isRouterAlive.value = false

    nextTick(() => {
        isRouterAlive.value = true
    })
}

const onPreload = (value) => {
    perload.value = value
}

provide('reload', onRefresh)
provide('preloader', onPreload)
</script>

<script>
import { currentLanguage } from '@/system/store/state.js'

export default {
    created() {
        if (currentLanguage.value === 'none') {
            currentLanguage.value = 'en'
            this.$i18n.locale = 'en'
        } else {
            this.$i18n.locale = currentLanguage.value
        }
    },
}
</script>
