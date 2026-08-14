<template>
    <Transition name="network-alert">
        <div v-if="offline" class="network-status__backdrop">
            <section class="network-status" role="alertdialog" aria-modal="true" aria-live="assertive">
                <div class="network-status__icon" aria-hidden="true">
                    <i class="fa-solid fa-wifi"></i>
                    <span class="network-status__slash"></span>
                </div>
                <div class="network-status__content">
                    <strong>{{ $t('network.offlineTitle') }}</strong>
                    <span>{{ $t('network.offlineMessage') }}</span>
                </div>
            </section>
        </div>
    </Transition>
</template>

<script>
import { onBeforeUnmount, ref } from 'vue'
import { useOnline } from '@vueuse/core'

export default {
    name: 'NetworkStatus',
    setup() {
        const online = useOnline()
        const offline = ref(!online.value)
        const checkConnection = () => { offline.value = !online.value || !navigator.onLine }
        const intervalId = window.setInterval(checkConnection, 1000)
        onBeforeUnmount(() => window.clearInterval(intervalId))
        return { offline }
    },
}
</script>
