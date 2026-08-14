<template>
    <div class="camera-backdrop" @click.self="$emit('close')">
        <section
            class="camera-modal"
            :class="{ 'center-action': centerAction }"
        >
            <header>
                <div>
                    <span>CAMERA SCANNER</span>
                    <h2>{{ title }}</h2>
                    <p>{{ subtitle }}</p>
                </div>
                <button
                    type="button"
                    aria-label="Close scanner"
                    @click="$emit('close')"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>
            <div class="camera-viewport">
                <div :id="readerId" class="camera-reader"></div>
                <div v-if="cameraError" class="camera-fallback">
                    <i class="fa-solid fa-camera"></i>
                    <strong>Camera unavailable</strong>
                    <small>{{ cameraError }}</small>
                </div>
                <div v-else class="scan-window" aria-hidden="true">
                    <i class="corner top-left"></i>
                    <i class="corner top-right"></i>
                    <i class="corner bottom-left"></i>
                    <i class="corner bottom-right"></i>
                    <span class="scan-line"></span>
                </div>
                <div class="camera-status">
                    <i class="fa-solid fa-shield-halved"></i>{{ hint }}
                </div>
            </div>
            <footer>
                <button type="button" class="cancel" @click="$emit('action')">
                    <i class="fa-solid fa-keyboard"></i>{{ actionLabel }}
                </button>
            </footer>
        </section>
    </div>
</template>

<script>
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

export default {
    name: 'CameraScannerModal',
    props: {
        title: { type: String, default: 'Scan QR code' },
        subtitle: { type: String, default: 'Use this device camera' },
        actionLabel: { type: String, default: 'Enter code instead' },
        centerAction: { type: Boolean, default: false },
        unavailableMessage: {
            type: String,
            default:
                'Allow camera permission, or close this window and enter the voucher code.',
        },
        hint: {
            type: String,
            default: 'Position the QR code inside the frame',
        },
    },
    emits: ['action', 'close', 'scanned'],
    data() {
        return {
            scanner: null,
            cameraError: '',
            hasScanned: false,
            readerId: `qr-reader-${Math.random().toString(36).slice(2)}`,
        }
    },
    async mounted() {
        try {
            this.scanner = new Html5Qrcode(this.readerId, {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                verbose: false,
            })
            await this.scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                this.onScanSuccess,
                () => {},
            )
        } catch (error) {
            this.cameraError = this.unavailableMessage
        }
    },
    beforeUnmount() {
        this.stopScanner()
    },
    methods: {
        async onScanSuccess(value) {
            if (this.hasScanned) return
            this.hasScanned = true
            await this.stopScanner()
            this.$emit('scanned', value)
        },
        async stopScanner() {
            if (!this.scanner) return
            try {
                if (this.scanner.isScanning) await this.scanner.stop()
                this.scanner.clear()
            } catch (error) {
                // The browser can close the camera stream before this hook runs.
            }
            this.scanner = null
        },
    },
}
</script>
