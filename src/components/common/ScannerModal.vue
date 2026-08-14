<template>
    <div class="modal-backdrop" @click.self="$emit('close')">
        <section class="scanner-modal scanner-choice-modal">
            <header class="modal-header">
                <div>
                    <span class="eyebrow">{{ mode === 'staff' ? 'STAFF IDENTITY' : 'INVENTORY LOOKUP' }}</span>
                    <h2>{{ title }}</h2>
                </div>
                <button class="icon-button" type="button" aria-label="Close scanner" @click="$emit('close')">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>

            <div class="scanner-method-toggle">
                <button type="button" :class="{ active: method === 'camera' }" @click="setMethod('camera')">
                    <i class="fa-solid fa-camera"></i>Scan Camera
                </button>
                <button type="button" :class="{ active: method === 'manual' }" @click="setMethod('manual')">
                    <i class="fa-solid fa-keyboard"></i>Enter Code
                </button>
            </div>

            <div v-if="method === 'camera'" class="scanner-viewport">
                <div :id="readerId" class="scanner-reader"></div>
                <div v-if="cameraError" class="scanner-fallback">
                    <span><i class="fa-solid fa-camera"></i></span>
                    <strong>Camera is not available</strong>
                    <p>{{ cameraError }}</p>
                    <button class="button secondary" type="button" @click="setMethod('manual')">Enter code instead</button>
                </div>
                <div v-else class="scanner-frame" aria-hidden="true">
                    <i></i><i></i><i></i><i></i>
                    <span></span>
                </div>
            </div>

            <form v-else class="manual-code manual-code-only" @submit.prevent="submitManual">
                <span class="manual-code-icon"><i class="fa-solid fa-barcode"></i></span>
                <h3>{{ mode === 'staff' ? 'Enter staff code' : 'Enter product or Batch code' }}</h3>
                <label>
                    <span>{{ mode === 'staff' ? 'Staff barcode' : 'Product / Batch code' }}</span>
                    <input v-model.trim="manualCode" type="text" :placeholder="placeholder" autocomplete="off" autofocus />
                </label>
                <button class="button primary full-width" type="submit" :disabled="!manualCode">
                    <i class="fa-solid fa-arrow-right"></i>Use Code
                </button>
            </form>
        </section>
    </div>
</template>

<script>
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

export default {
    name: 'ScannerModal',
    props: {
        mode: { type: String, default: 'product' },
        title: { type: String, default: 'Find product' },
    },
    emits: ['close', 'scanned'],
    data() {
        return {
            method: 'camera',
            manualCode: '',
            scanner: null,
            cameraError: '',
            scanned: false,
            readerId: `ims-reader-${Math.random().toString(36).slice(2)}`,
        }
    },
    computed: {
        placeholder() {
            return this.mode === 'staff' ? 'STAFF-INV001' : 'DAI-001 or IMS:BATCH:BAT-...'
        },
    },
    mounted() {
        this.startCamera()
    },
    beforeUnmount() {
        this.stop()
    },
    methods: {
        async setMethod(method) {
            if (method === this.method) return
            await this.stop()
            this.method = method
            this.cameraError = ''
            if (method === 'camera') {
                await this.$nextTick()
                this.startCamera()
            }
        },
        submitManual() {
            if (this.manualCode) this.$emit('scanned', this.manualCode)
        },
        async startCamera() {
            try {
                this.scanner = new Html5Qrcode(this.readerId, {
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                    ],
                    verbose: false,
                })
                await this.scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 260, height: 190 } },
                    this.onScan,
                    () => {},
                )
            } catch (error) {
                this.cameraError = 'Allow camera access or choose Enter Code.'
            }
        },
        async onScan(value) {
            if (this.scanned) return
            this.scanned = true
            await this.stop()
            this.$emit('scanned', value)
        },
        async stop() {
            if (!this.scanner) return
            try {
                if (this.scanner.isScanning) await this.scanner.stop()
                this.scanner.clear()
            } catch (error) {
                // Camera streams can close before the component unmounts.
            }
            this.scanner = null
        },
    },
}
</script>

<style scoped src="@/assets/css/components/scanner-modal.css"></style>
