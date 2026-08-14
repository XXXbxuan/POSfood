<template>
    <div
        class="voucher-print-backdrop"
        :class="{ 'auto-printing': autoPrint }"
        @click.self="$emit('close')"
    >
        <section
            class="voucher-print-modal voucher-bulk-print-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-bulk-print-title"
        >
            <header>
                <div>
                    <span>VOUCHERS</span>
                    <h2 id="voucher-bulk-print-title">
                        Print active vouchers
                    </h2>
                    <small>{{ vouchers.length }} active vouchers</small>
                </div>

                <div>
                    <button
                        v-if="!autoPrint"
                        type="button"
                        aria-label="Print all active vouchers"
                        title="Print all active vouchers"
                        @click="print"
                    >
                        <i class="fa-solid fa-print"></i>
                    </button>

                    <button
                        type="button"
                        aria-label="Close active voucher print"
                        title="Close"
                        @click="$emit('close')"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <div class="voucher-bulk-print-preview">
                <div ref="sheet" class="voucher-bulk-print-sheet">
                    <section
                        v-for="item in printItems"
                        :key="item.voucher.id || item.voucher.code"
                        class="voucher-print-sheet voucher-bulk-print-ticket"
                    >
                        <section class="voucher-print-details">
                            <span>RESTRO POS VOUCHER</span>

                            <div class="voucher-print-title-row">
                                <h1>{{ item.voucher.code }}</h1>

                                <strong class="voucher-print-offer">
                                    {{ offer(item.voucher) }}
                                </strong>
                            </div>

                            <dl>
                                <div>
                                    <dt>Minimum spend</dt>
                                    <dd>
                                        RM
                                        {{ money(item.voucher.minSpend) }}
                                    </dd>
                                </div>

                                <div>
                                    <dt>Service</dt>
                                    <dd>
                                        {{ services(item.voucher) }}
                                    </dd>
                                </div>

                                <div>
                                    <dt>Validity</dt>
                                    <dd>
                                        {{ validity(item.voucher) }}
                                    </dd>
                                </div>

                                <div>
                                    <dt>Time</dt>
                                    <dd>
                                        {{ availability(item.voucher) }}
                                    </dd>
                                </div>
                            </dl>

                            <small>
                                Present this voucher QR code to staff before
                                payment.
                            </small>
                        </section>

                        <section class="voucher-barcode-panel">
                            <img
                                v-if="item.qrDataUrl"
                                class="voucher-qr-code"
                                :src="item.qrDataUrl"
                                :alt="`${item.voucher.code} voucher QR code`"
                            />

                            <span
                                v-else
                                class="voucher-bulk-qr-loading"
                            >
                                Preparing QR code...
                            </span>
                        </section>
                    </section>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import QRCode from 'qrcode'
import { printElement } from '@/utils/printElement.js'

export default {
    name: 'VoucherBulkPrintModal',

    props: {
        vouchers: {
            type: Array,
            required: true,
        },
        autoPrint: {
            type: Boolean,
            default: false,
        },
    },

    emits: ['close'],

    data() {
        return {
            printItems: [],
            preparingPrint: false,
        }
    },

    mounted() {
        this.preparePrintItems()
    },

    methods: {
        async preparePrintItems() {
            if (this.preparingPrint) return

            this.preparingPrint = true

            try {
                this.printItems = await Promise.all(
                    this.vouchers.map(async (voucher) => {
                        const code = String(
                            voucher.code || '',
                        ).toUpperCase()

                        let qrDataUrl = ''

                        if (code) {
                            qrDataUrl = await QRCode.toDataURL(code, {
                                width: 420,
                                margin: 2,
                                errorCorrectionLevel: 'H',
                            })
                        }

                        return {
                            voucher,
                            qrDataUrl,
                        }
                    }),
                )

                await this.$nextTick()

                if (this.autoPrint) {
                    await this.print()
                }
            } catch (error) {
                console.error(
                    'Unable to prepare active voucher printing:',
                    error,
                )
            } finally {
                this.preparingPrint = false
            }
        },

        offer(voucher) {
            const value = Number(voucher.value || 0)
            const compact = Number.isInteger(value)
                ? String(value)
                : value.toFixed(2)

            return voucher.type === 'percentage'
                ? `${compact}%`
                : `RM${compact}`
        },

        services(voucher) {
            const serviceTypes = Array.isArray(
                voucher.serviceTypes,
            )
                ? voucher.serviceTypes
                : []

            return serviceTypes.join(' / ') || 'All services'
        },

        validity(voucher) {
            if (!voucher.startDate && !voucher.endDate) {
                return 'No date limit'
            }

            const start =
                this.shortDate(voucher.startDate) || 'Now'
            const end =
                this.shortDate(voucher.endDate) || 'No expiry'

            return `${start} - ${end}`
        },

        availability(voucher) {
            if (voucher.startTime && voucher.endTime) {
                return `${voucher.startTime} - ${voucher.endTime}`
            }

            return 'All day'
        },

        money(value) {
            return Number(value || 0).toFixed(2)
        },

        shortDate(value) {
            if (!value) return ''

            const date = new Date(`${value}T00:00:00`)

            if (Number.isNaN(date.getTime())) {
                return value
            }

            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
            })
        },

        async print() {
            if (!this.$refs.sheet || !this.printItems.length) {
                return
            }

            try {
                const printed = await printElement(
                    this.$refs.sheet,
                    {
                        variant: 'voucher-ticket-print',
                    },
                )

                if (printed && this.autoPrint) {
                    this.$emit('close')
                }
            } catch (error) {
                console.error(
                    'Unable to print active vouchers:',
                    error,
                )
            }
        },
    },
}
</script>