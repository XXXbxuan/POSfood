<template>
    <div class="page-stack labels-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">LABEL PRINTING</span>
                <h1>Print Labels</h1>
                <p>Prepare product or batch labels for receiving and storage.</p>
            </div>
            <button class="button print" type="button" :disabled="!product" @click="printLabels"><i class="fa-solid fa-print"></i>Print Labels</button>
        </section>

        <section class="labels-layout">
            <form class="panel label-controls" @submit.prevent>
                <header class="section-header"><span><i class="fa-solid fa-sliders"></i></span><div><h2>Label setup</h2><p>Select what the sticker should show.</p></div></header>
                <label><span>Product <b>*</b></span><select v-model="productId" @change="onProductChange"><option value="" disabled>Select product</option><option v-for="item in activeProducts" :key="item.id" :value="item.id">{{ item.name }} — {{ item.sku }}</option></select></label>
                <label><span>Batch</span><select v-model="batchId"><option value="">Product label (no batch)</option><option v-for="batch in product?.batches || []" :key="batch.id" :value="batch.id">{{ batch.id }} — {{ batch.quantity }} {{ product.unit }}</option></select></label>
                <div class="form-grid two-column">
                    <label><span>Label Size</span><select v-model="size"><option value="medium">60 × 40 mm</option><option value="small">50 × 30 mm</option><option value="large">80 × 50 mm</option></select></label>
                    <label><span>Print Quantity</span><input v-model.number="quantity" type="number" min="1" max="250" inputmode="numeric" /></label>
                </div>
                <label class="toggle-label"><input v-model="showExpiry" type="checkbox" /><span><strong>Show expiry date</strong><small>Recommended for perishables.</small></span></label>
                <label class="toggle-label"><input v-model="showPrice" type="checkbox" /><span><strong>Show selling price</strong><small>Leave off warehouse labels.</small></span></label>
                <dl v-if="product" class="label-meta">
                    <div><dt>Code content</dt><dd class="mono">{{ codeContent }}</dd></div>
                    <div><dt>Location</dt><dd>{{ batch?.location || product.location }}</dd></div>
                    <div><dt>Labels</dt><dd>{{ quantity }}</dd></div>
                </dl>
            </form>

            <section class="panel label-preview-panel">
                <header class="panel-header"><div><span class="eyebrow">PREVIEW</span><h2>Warehouse sticker</h2></div><span>{{ sizeLabel }}</span></header>
                <div v-if="product" class="label-stage">
                    <article id="printable-label" class="inventory-label" :class="`label-${size}`">
                        <header><span><i class="fa-solid fa-boxes-stacked"></i></span><strong>INVENTORY</strong><small>MAIN WAREHOUSE</small></header>
                        <h2>{{ product.name }}</h2>
                        <p class="mono product-label-code">{{ product.sku }}</p>
                        <dl>
                            <div v-if="batch"><dt>Batch</dt><dd class="mono">{{ batch.id }}</dd></div>
                            <div><dt>Quantity</dt><dd>{{ batch?.quantity ?? product.currentStock }} {{ product.unit }}</dd></div>
                            <div><dt>Received</dt><dd>{{ formatDate(batch?.receivedDate) }}</dd></div>
                            <div v-if="showExpiry && batch?.expiryDate"><dt>Expiry</dt><dd>{{ formatDate(batch.expiryDate) }}</dd></div>
                            <div><dt>Location</dt><dd>{{ batch?.location || product.location }}</dd></div>
                            <div v-if="showPrice && product.sellingPrice"><dt>Price</dt><dd>RM {{ Number(product.sellingPrice).toFixed(2) }}</dd></div>
                        </dl>
                        <div class="label-code-row">
                            <img v-if="qrDataUrl" :src="qrDataUrl" alt="Product QR code" />
                            <div class="barcode-visual"><span v-for="(bar, index) in barcodeBars" :key="index" :style="{ width: `${bar}px` }"></span><small>{{ product.barcode }}</small></div>
                        </div>
                    </article>
                    <p><i class="fa-solid fa-circle-info"></i>QR identifies {{ batch ? 'this batch' : 'the product' }}. Product and staff codes remain separate.</p>
                </div>
                <div v-else class="summary-placeholder"><i class="fa-solid fa-tag"></i><p>Select a product to preview its label.</p></div>
            </section>
        </section>

        <div class="print-sheet" aria-hidden="true">
            <article v-for="index in printCount" :key="index" class="inventory-label print-copy" :class="`label-${size}`" v-html="printMarkup"></article>
        </div>
    </div>
</template>

<script>
import QRCode from 'qrcode'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'LabelsView',
    data() {
        return {
            store: inventoryStore,
            productId: '',
            batchId: '',
            size: 'medium',
            quantity: 1,
            showExpiry: true,
            showPrice: false,
            qrDataUrl: '',
            printMarkup: '',
        }
    },
    computed: {
        activeProducts() {
            return this.store.state.products.filter((product) => product.active)
        },
        product() {
            return this.store.findProduct(this.productId)
        },
        batch() {
            return this.product?.batches.find((batch) => batch.id === this.batchId) || null
        },
        codeContent() {
            return this.batch?.batchQr || this.product?.qrCode || ''
        },
        sizeLabel() {
            return { small: '50 × 30 mm', medium: '60 × 40 mm', large: '80 × 50 mm' }[this.size]
        },
        printCount() {
            return Math.min(250, Math.max(1, Number(this.quantity) || 1))
        },
        barcodeBars() {
            const code = String(this.product?.barcode || '')
            return code.split('').flatMap((digit, index) => {
                const value = Number(digit) || 1
                return [1 + ((value + index) % 3), 1, 1 + (value % 2)]
            })
        },
    },
    watch: {
        codeContent: 'generateQr',
    },
    mounted() {
        const product = this.store.findProduct(this.$route.query.product)
        if (product) {
            this.productId = product.id
            this.batchId = this.$route.query.batch || ''
            this.quantity = Math.max(1, Number(this.$route.query.quantity) || 1)
            this.generateQr()
        }
    },
    methods: {
        onProductChange() {
            this.batchId = ''
            this.generateQr()
        },
        async generateQr() {
            if (!this.codeContent) {
                this.qrDataUrl = ''
                return
            }
            this.qrDataUrl = await QRCode.toDataURL(this.codeContent, {
                margin: 0,
                width: 180,
                color: { dark: '#111827', light: '#ffffff' },
            })
        },
        formatDate(value) {
            if (!value) return '—'
            return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
        },
        printLabels() {
            const source = document.getElementById('printable-label')
            if (!source) return
            this.printMarkup = source.innerHTML
            this.$nextTick(() => window.print())
        },
    },
}
</script>
