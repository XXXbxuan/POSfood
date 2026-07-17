<template>
    <div class="camera-backdrop" @click.self="$emit('close')">
        <section class="camera-modal">
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
                <video ref="video" autoplay muted playsinline></video>
                <div v-if="cameraError" class="camera-fallback">
                    <i class="fa-solid fa-camera"></i
                    ><strong>Camera preview</strong
                    ><small>{{ cameraError }}</small>
                </div>
                <div class="scan-window">
                    <i class="corner top-left"></i
                    ><i class="corner top-right"></i
                    ><i class="corner bottom-left"></i
                    ><i class="corner bottom-right"></i
                    ><span class="scan-line"></span>
                </div>
                <div class="camera-status">
                    <i class="fa-solid fa-shield-halved"></i>{{ hint }}
                </div>
            </div>
            <footer>
                <button type="button" class="cancel" @click="$emit('close')">
                    Cancel</button
                ><button
                    type="button"
                    class="complete"
                    @click="$emit('scanned')"
                >
                    <i class="fa-solid fa-qrcode"></i>{{ actionLabel }}
                </button>
            </footer>
        </section>
    </div>
</template>

<script>
export default {
    name: 'CameraScannerModal',
    props: {
        title: { type: String, default: 'Scan QR code' },
        subtitle: { type: String, default: 'Use this device camera' },
        actionLabel: { type: String, default: 'Complete demo scan' },
        hint: {
            type: String,
            default: 'Position the QR code inside the frame',
        },
    },
    emits: ['close', 'scanned'],
    data() {
        return { stream: null, cameraError: '' }
    },
    async mounted() {
        try {
            if (!navigator.mediaDevices?.getUserMedia)
                throw new Error('Camera is unavailable in this browser.')
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            })
            if (this.$refs.video) {
                this.$refs.video.srcObject = this.stream
                await this.$refs.video.play()
            }
        } catch (error) {
            this.cameraError =
                'Camera permission is unavailable — demo scan is still available.'
        }
    },
    beforeUnmount() {
        this.stopCamera()
    },
    methods: {
        stopCamera() {
            if (this.stream)
                this.stream.getTracks().forEach((track) => track.stop())
            this.stream = null
        },
    },
}
</script>
