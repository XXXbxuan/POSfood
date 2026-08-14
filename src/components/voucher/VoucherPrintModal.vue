<template>
    <div
        class="voucher-print-backdrop"
        :class="{ 'auto-printing': autoPrint }"
        @click.self="$emit('close')"
    >
        <section class="voucher-print-modal" role="dialog" aria-modal="true">
            <header>
                <div>
                    <span>VOUCHER</span>
                    <h2>Print voucher</h2>
                </div>
                <div>
                    <button
                        v-if="!autoPrint"
                        type="button"
                        aria-label="Print voucher"
                        @click="print"
                    >
                        <i class="fa-solid fa-print"></i>
                    </button>
                    <button type="button" aria-label="Close voucher" @click="$emit('close')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <div ref="sheet" class="voucher-print-sheet">
                <section class="voucher-print-details">
                    <span>RESTRO POS VOUCHER</span>
                    <div class="voucher-print-title-row">
                        <h1>{{ voucher.code }}</h1>
                        <strong class="voucher-print-offer">{{ offer }}</strong>
                    </div>
                    <dl>
                        <div><dt>Minimum spend</dt><dd>RM {{ money(voucher.minSpend) }}</dd></div>
                        <div><dt>Service</dt><dd>{{ services }}</dd></div>
                        <div><dt>Validity</dt><dd>{{ validity }}</dd></div>
                        <div><dt>Time</dt><dd>{{ availability }}</dd></div>
                    </dl>
                    <small>Present this voucher QR code to staff before payment.</small>
                </section>
                <section class="voucher-barcode-panel">
                    <button
                        v-if="qrDataUrl"
                        type="button"
                        class="voucher-qr-trigger"
                        aria-label="Enlarge voucher QR code"
                        @click="showQrZoom = true"
                    >
                        <img
                            class="voucher-qr-code"
                            :src="qrDataUrl"
                            :alt="`${voucher.code} voucher QR code`"
                        />
                    </button>
                </section>
            </div>
        </section>

        <div
            v-if="showQrZoom"
            class="voucher-qr-zoom-backdrop"
            @click.self="showQrZoom = false"
        >
            <section class="voucher-qr-zoom-modal" role="dialog" aria-modal="true">
                <button
                    type="button"
                    aria-label="Close enlarged QR code"
                    @click="showQrZoom = false"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <img :src="qrDataUrl" :alt="`${voucher.code} enlarged QR code`" />
            </section>
        </div>
    </div>
</template>

<script>
import QRCode from 'qrcode'
import { printElement } from '@/utils/printElement.js'

export default {
    name: 'VoucherPrintModal',
    props: {
        voucher: { type: Object, required: true },
        autoPrint: { type: Boolean, default: false },
    },
    emits: ['close'],
    data() {
        return { qrDataUrl: '', showQrZoom: false }
    },
    mounted() {
        this.createQrCode()
    },
    computed: {
        offer() {
            const value = Number(this.voucher.value || 0)
            const compact = Number.isInteger(value) ? value : value.toFixed(2)
            return this.voucher.type === 'percentage' ? `${compact}%` : `RM${compact}`
        },
        services() {
            return (this.voucher.serviceTypes || []).join(' / ') || 'All services'
        },
        validity() {
            if (!this.voucher.startDate && !this.voucher.endDate) return 'No date limit'
            return `${this.shortDate(this.voucher.startDate) || 'Now'} - ${this.shortDate(this.voucher.endDate) || 'No expiry'}`
        },
        availability() {
            return this.voucher.startTime && this.voucher.endTime
                ? `${this.voucher.startTime} - ${this.voucher.endTime}`
                : 'All day'
        },
    },
    methods: {
        async createQrCode() {
            this.qrDataUrl = await QRCode.toDataURL(
                String(this.voucher.code || '').toUpperCase(),
                { width: 420, margin: 2, errorCorrectionLevel: 'H' },
            )
            if (this.autoPrint) {
                await this.$nextTick()
                await this.print()
            }
        },
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        shortDate(value) {
            if (!value) return ''
            const date = new Date(`${value}T00:00:00`)
            return Number.isNaN(date.getTime())
                ? value
                : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        },
        async print() {
            const printed = await printElement(this.$refs.sheet, {
                variant: 'voucher-ticket-print',
            })
            if (printed && this.autoPrint) this.$emit('close')
        },
    },
}
</script>
