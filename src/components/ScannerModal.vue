<template>
    <div class="modal-backdrop" @click.self="$emit('close')">
        <section class="scanner-modal">
            <header class="modal-header">
                <div>
                    <span class="eyebrow">{{ mode === 'staff' ? 'STAFF IDENTITY' : 'PRODUCT LOOKUP' }}</span>
                    <h2>{{ title }}</h2>
                    <p>{{ subtitle }}</p>
                </div>
                <button class="icon-button" type="button" aria-label="Close scanner" @click="$emit('close')">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>

            <div class="scanner-viewport">
                <div :id="readerId" class="scanner-reader"></div>
                <div v-if="cameraError" class="scanner-fallback">
                    <span><i class="fa-solid fa-camera"></i></span>
                    <strong>Camera is not available</strong>
                    <p>{{ cameraError }}</p>
                </div>
                <div v-else class="scanner-frame" aria-hidden="true">
                    <i></i><i></i><i></i><i></i>
                    <span></span>
                </div>
                <small class="scanner-secure"><i class="fa-solid fa-shield-halved"></i> Camera is used only while this window is open</small>
            </div>

            <form class="manual-code" @submit.prevent="submitManual">
                <label>
                    <span>{{ mode === 'staff' ? 'Staff code' : 'Product code / barcode' }}</span>
                    <div class="input-with-button">
                        <input v-model.trim="manualCode" type="text" :placeholder="placeholder" autocomplete="off" />
                        <button class="button secondary" type="submit">Use code</button>
                    </div>
                </label>
                <button class="demo-link" type="button" @click="$emit('scanned', demoCode)">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>{{ demoLabel }}
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
        title: { type: String, default: 'Scan product code' },
        subtitle: { type: String, default: 'Point the rear camera at a QR code or barcode.' },
        demoCode: { type: String, default: 'MILK-001' },
        demoLabel: { type: String, default: 'Scan demo product' },
    },
    emits: ['close', 'scanned'],
    data() {
        return {
            manualCode: '',
            scanner: null,
            cameraError: '',
            scanned: false,
            readerId: `ims-reader-${Math.random().toString(36).slice(2)}`,
        }
    },
    computed: {
        placeholder() {
            return this.mode === 'staff' ? 'IMS:STAFF:INV001' : 'MILK-001'
        },
    },
    async mounted() {
        try {
            this.scanner = new Html5Qrcode(this.readerId, {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                ],
                verbose: false,
            })
            await this.scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 180 } },
                this.onScan,
                () => {},
            )
        } catch (error) {
            this.cameraError = 'Allow camera access or enter the code below.'
        }
    },
    beforeUnmount() {
        this.stop()
    },
    methods: {
        submitManual() {
            if (this.manualCode) this.$emit('scanned', this.manualCode)
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
