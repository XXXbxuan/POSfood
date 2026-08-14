<template>
    <RouterView />
    <ToastStack />

    <Teleport to="body">
        <div
            v-if="!isOnline"
            ref="offlineOverlay"
            class="network-offline-lock"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="network-offline-title"
            aria-describedby="network-offline-message"
            tabindex="-1"
        >
            <section class="network-offline-card">
                <span class="network-offline-icon"><i class="fa-solid fa-wifi-slash"></i></span>
                <div>
                    <strong id="network-offline-title">No internet connection</strong>
                    <p id="network-offline-message">Network connection is required. The system will reconnect automatically.</p>
                </div>
                <span class="network-offline-checking"><i class="fa-solid fa-rotate"></i> Checking every second</span>
            </section>
        </div>
    </Teleport>
</template>

<script>
import ToastStack from '@/components/common/ToastStack.vue'

const NETWORK_CHECK_URL = 'https://www.gstatic.com/generate_204'
const NETWORK_CHECK_INTERVAL = 1000
const NETWORK_CHECK_TIMEOUT = 850

export default {
    name: 'InventoryApp',
    components: { ToastStack },
    data() {
        return {
            isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
            connectivityTimer: null,
            connectivityCheckInFlight: false,
        }
    },
    mounted() {
        window.addEventListener('online', this.handleNetworkHint)
        window.addEventListener('offline', this.handleNetworkHint)
        this.syncInteractionLock()
        this.checkConnectivity()
        this.connectivityTimer = window.setInterval(() => this.checkConnectivity(), NETWORK_CHECK_INTERVAL)
    },
    beforeUnmount() {
        window.removeEventListener('online', this.handleNetworkHint)
        window.removeEventListener('offline', this.handleNetworkHint)
        if (this.connectivityTimer) window.clearInterval(this.connectivityTimer)
        this.connectivityTimer = null
        this.setAppInteractionLocked(false)
    },
    methods: {
        handleNetworkHint() {
            this.checkConnectivity()
        },
        async checkConnectivity() {
            if (this.connectivityCheckInFlight) return
            this.connectivityCheckInFlight = true

            let online = typeof navigator === 'undefined' ? true : navigator.onLine
            if (online && typeof fetch === 'function') {
                const controller = typeof AbortController === 'function' ? new AbortController() : null
                const timeout = window.setTimeout(() => controller?.abort(), NETWORK_CHECK_TIMEOUT)
                try {
                    await fetch(`${NETWORK_CHECK_URL}?ims=${Date.now()}`, {
                        method: 'GET',
                        mode: 'no-cors',
                        cache: 'no-store',
                        credentials: 'omit',
                        referrerPolicy: 'no-referrer',
                        signal: controller?.signal,
                    })
                    online = true
                } catch (error) {
                    online = false
                } finally {
                    window.clearTimeout(timeout)
                }
            }

            if (this.isOnline !== online) {
                this.isOnline = online
                this.$nextTick(this.syncInteractionLock)
            } else if (!online) {
                this.$nextTick(() => this.$refs.offlineOverlay?.focus?.({ preventScroll: true }))
            }
            this.connectivityCheckInFlight = false
        },
        syncInteractionLock() {
            this.setAppInteractionLocked(!this.isOnline)
            if (!this.isOnline) {
                this.$nextTick(() => this.$refs.offlineOverlay?.focus?.({ preventScroll: true }))
            }
        },
        setAppInteractionLocked(locked) {
            const app = document.getElementById('app')
            if (!app) return
            if (locked) {
                document.activeElement?.blur?.()
                app.setAttribute('inert', '')
                app.setAttribute('aria-hidden', 'true')
                app.style.pointerEvents = 'none'
            } else {
                app.removeAttribute('inert')
                app.removeAttribute('aria-hidden')
                app.style.removeProperty('pointer-events')
            }
        },
    },
}
</script>

<style src="@/assets/css/components/offline-banner.css"></style>
