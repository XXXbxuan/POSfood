<template>
    <div class="qr-zoom-backdrop" @click.self="$emit('close')">
        <section class="qr-zoom-modal">
            <button
                type="button"
                class="qr-zoom-close"
                aria-label="Close QR"
                @click="$emit('close')"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
            <span>E-WALLET PAYMENT</span>
            <h2>Scan to pay RM {{ money(amount) }}</h2>
            <div>
                <img :src="qr" :alt="`${provider} payment QR`" /><small
                    >DEMO</small
                >
            </div>
            <strong>{{ provider }}</strong>
            <p>Keep this QR inside the customer's camera frame.</p>
        </section>
    </div>
</template>

<script>
export default {
    name: 'QrZoomModal',
    props: {
        amount: { type: Number, default: 0 },
        provider: { type: String, default: '' },
        qr: { type: String, required: true },
    },
    emits: ['close'],
    methods: {
        money(value) {
            return Number(value || 0).toFixed(2)
        },
    },
}
</script>
