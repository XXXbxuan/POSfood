<template>
    <div class="page-stack labels-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">LABEL PRINTING</span>
                <h1>Print Labels</h1>
                <p>Prepare product or batch labels for receiving and storage.</p>
            </div>
            <div class="label-heading-actions">
                <button class="button print" type="button" :disabled="!product" @click="printLabels"><i class="fa-solid fa-print"></i>Print Labels</button>
            </div>
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

            <section class="panel label-preview-panel" :class="{ interactive: product }" @click="product && openLabelDesigner()">
                <header class="panel-header"><div><span class="eyebrow">PREVIEW</span><h2>Warehouse sticker</h2></div><span>{{ sizeLabel }}</span></header>
                <div v-if="product" class="label-stage">
                    <article id="printable-label" class="inventory-label" :class="`label-${size}`">
                        <header>
                            <span :style="labelStyle('logo')"><i class="fa-solid fa-boxes-stacked"></i></span>
                            <strong :style="labelStyle('brand')">{{ labelText('brand', 'INVENTORY') }}</strong>
                            <small :style="labelStyle('warehouse')">{{ labelText('warehouse', 'MAIN WAREHOUSE') }}</small>
                        </header>
                        <h2 :style="labelStyle('name')">{{ labelText('name', product.name) }}</h2>
                        <p class="mono product-label-code" :style="labelStyle('sku')">{{ labelText('sku', product.sku) }}</p>
                        <dl>
                            <div v-if="batch"><dt>Batch</dt><dd class="mono" :style="labelStyle('batch')">{{ labelText('batch', batch.id) }}</dd></div>
                            <div><dt>Quantity</dt><dd :style="labelStyle('quantity')">{{ labelText('quantity', `${batch?.quantity ?? product.currentStock} ${product.unit}`) }}</dd></div>
                            <div><dt>Received</dt><dd :style="labelStyle('received')">{{ labelText('received', formatDate(batch?.receivedDate)) }}</dd></div>
                            <div v-if="showExpiry && batch?.expiryDate"><dt>Expiry</dt><dd :style="labelStyle('expiry')">{{ labelText('expiry', formatDate(batch.expiryDate)) }}</dd></div>
                            <div><dt>Location</dt><dd :style="labelStyle('location')">{{ labelText('location', batch?.location || product.location) }}</dd></div>
                            <div v-if="showPrice && product.sellingPrice"><dt>Price</dt><dd :style="labelStyle('price')">{{ labelText('price', `RM ${Number(product.sellingPrice).toFixed(2)}`) }}</dd></div>
                        </dl>
                        <div class="label-code-row">
                            <img v-if="qrDataUrl" :src="qrDataUrl" :style="labelStyle('qr')" alt="Product QR code" />
                            <div class="barcode-visual" :style="labelStyle('barcode')"><span v-for="(bar, index) in barcodeBars" :key="index" :style="{ width: `${bar}px` }"></span><small>{{ product.barcode }}</small></div>
                        </div>
                    </article>
                    <p><i class="fa-solid fa-pen"></i>Tap the sticker to edit its text.</p>
                </div>
                <div v-else class="summary-placeholder"><i class="fa-solid fa-tag"></i><p>Select a product to preview its label.</p></div>
            </section>
        </section>

        <div class="print-sheet" aria-hidden="true">
            <article v-for="index in printCount" :key="index" class="inventory-label print-copy" :class="`label-${size}`" v-html="printMarkup"></article>
        </div>

        <div v-if="labelDesignerOpen" class="modal-backdrop" @click.self="labelDesignerOpen = false">
            <section class="form-modal label-designer-modal">
                <header class="modal-header">
                    <div><span class="eyebrow">LABEL EDITOR</span><h2>Edit Warehouse Sticker</h2><p>Tap any item, then move or resize it on the right.</p></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="labelDesignerOpen = false"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="label-designer-body">
                    <div class="label-designer-stage">
                        <article class="inventory-label is-editing" :class="`label-${size}`">
                            <header>
                                <span class="label-edit-target" :class="{ selected: selectedTextKey === 'logo' }" :style="labelStyle('logo', true)" @click="selectLabelText('logo')"><i class="fa-solid fa-boxes-stacked"></i></span>
                                <strong class="label-edit-target" :class="{ selected: selectedTextKey === 'brand' }" :style="labelStyle('brand', true)" @click="selectLabelText('brand', 'INVENTORY')">{{ labelText('brand', 'INVENTORY', true) }}</strong>
                                <small class="label-edit-target" :class="{ selected: selectedTextKey === 'warehouse' }" :style="labelStyle('warehouse', true)" @click="selectLabelText('warehouse', 'MAIN WAREHOUSE')">{{ labelText('warehouse', 'MAIN WAREHOUSE', true) }}</small>
                            </header>
                            <h2 class="label-edit-target" :class="{ selected: selectedTextKey === 'name' }" :style="labelStyle('name', true)" @click="selectLabelText('name', product.name)">{{ labelText('name', product.name, true) }}</h2>
                            <p class="mono product-label-code label-edit-target" :class="{ selected: selectedTextKey === 'sku' }" :style="labelStyle('sku', true)" @click="selectLabelText('sku', product.sku)">{{ labelText('sku', product.sku, true) }}</p>
                            <dl>
                                <div v-if="batch"><dt>Batch</dt><dd class="mono label-edit-target" :class="{ selected: selectedTextKey === 'batch' }" :style="labelStyle('batch', true)" @click="selectLabelText('batch', batch.id)">{{ labelText('batch', batch.id, true) }}</dd></div>
                                <div><dt>Quantity</dt><dd class="label-edit-target" :class="{ selected: selectedTextKey === 'quantity' }" :style="labelStyle('quantity', true)" @click="selectLabelText('quantity', `${batch?.quantity ?? product.currentStock} ${product.unit}`)">{{ labelText('quantity', `${batch?.quantity ?? product.currentStock} ${product.unit}`, true) }}</dd></div>
                                <div><dt>Received</dt><dd class="label-edit-target" :class="{ selected: selectedTextKey === 'received' }" :style="labelStyle('received', true)" @click="selectLabelText('received', formatDate(batch?.receivedDate))">{{ labelText('received', formatDate(batch?.receivedDate), true) }}</dd></div>
                                <div v-if="showExpiry && batch?.expiryDate"><dt>Expiry</dt><dd class="label-edit-target" :class="{ selected: selectedTextKey === 'expiry' }" :style="labelStyle('expiry', true)" @click="selectLabelText('expiry', formatDate(batch.expiryDate))">{{ labelText('expiry', formatDate(batch.expiryDate), true) }}</dd></div>
                                <div><dt>Location</dt><dd class="label-edit-target" :class="{ selected: selectedTextKey === 'location' }" :style="labelStyle('location', true)" @click="selectLabelText('location', batch?.location || product.location)">{{ labelText('location', batch?.location || product.location, true) }}</dd></div>
                                <div v-if="showPrice && product.sellingPrice"><dt>Price</dt><dd class="label-edit-target" :class="{ selected: selectedTextKey === 'price' }" :style="labelStyle('price', true)" @click="selectLabelText('price', `RM ${Number(product.sellingPrice).toFixed(2)}`)">{{ labelText('price', `RM ${Number(product.sellingPrice).toFixed(2)}`, true) }}</dd></div>
                            </dl>
                            <div class="label-code-row">
                                <img v-if="qrDataUrl" class="label-edit-target" :class="{ selected: selectedTextKey === 'qr' }" :src="qrDataUrl" :style="labelStyle('qr', true)" alt="Product QR code" @click="selectLabelText('qr')" />
                                <div class="barcode-visual label-edit-target" :class="{ selected: selectedTextKey === 'barcode' }" :style="labelStyle('barcode', true)" @click="selectLabelText('barcode')"><span v-for="(bar, index) in barcodeBars" :key="index" :style="{ width: `${bar}px` }"></span><small>{{ product.barcode }}</small></div>
                            </div>
                        </article>
                    </div>
                    <form class="label-designer-controls form-grid" @submit.prevent="saveLabelText">
                        <div class="designer-selection"><span>SELECTED ITEM</span><strong>{{ editorLabel }}</strong></div>
                        <label v-if="isTextElement"><span>Display Text</span><input v-model="textDraft.text" type="text" /></label>
                        <label v-if="isTextElement"><span>Font Size</span><div class="label-size-control"><input v-model.number="textDraft.size" type="range" min="7" max="42" /><strong>{{ textDraft.size }}px</strong></div></label>
                        <label><span>Item Size</span><div class="label-size-control"><input v-model.number="textDraft.scale" type="range" min="50" max="220" /><strong>{{ textDraft.scale }}%</strong></div></label>
                        <div class="label-position-controls">
                            <label><span>Horizontal</span><input v-model.number="textDraft.x" type="range" min="-160" max="160" /></label>
                            <strong>{{ textDraft.x > 0 ? '+' : '' }}{{ textDraft.x }}</strong>
                            <label><span>Vertical</span><input v-model.number="textDraft.y" type="range" min="-100" max="100" /></label>
                            <strong>{{ textDraft.y > 0 ? '+' : '' }}{{ textDraft.y }}</strong>
                        </div>
                        <label v-if="isTextElement"><span>Text Alignment</span>
                            <div class="label-align-control">
                                <button v-for="align in ['left', 'center', 'right']" :key="align" type="button" :class="{ active: textDraft.align === align }" @click="textDraft.align = align">
                                    <i class="fa-solid" :class="`fa-align-${align}`"></i>
                                </button>
                            </div>
                        </label>
                        <footer class="form-actions">
                            <button class="button secondary" type="button" @click="resetLabelText">Reset</button>
                            <span></span>
                            <button class="button primary" type="submit">Save</button>
                        </footer>
                    </form>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import QRCode from 'qrcode'
import { inventoryStore } from '@/services/inventoryStore'

function readSavedLabelEdits() {
    try {
        return JSON.parse(localStorage.getItem('ims_label_text_styles')) || {}
    } catch (error) {
        return {}
    }
}

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
            labelDesignerOpen: false,
            selectedTextKey: '',
            selectedFallback: '',
            textDraft: { text: '', size: 12, align: 'left' },
            labelEditsByProduct: readSavedLabelEdits(),
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
        labelEdits() {
            return this.labelEditsByProduct[this.productId] || {}
        },
        editorLabel() {
            return {
                logo: 'Logo',
                brand: 'Brand',
                warehouse: 'Warehouse',
                name: 'Product Name',
                sku: 'Product Code',
                batch: 'Batch Number',
                quantity: 'Quantity',
                received: 'Received Date',
                expiry: 'Expiry Date',
                location: 'Location',
                price: 'Price',
                qr: 'QR Code',
                barcode: 'Barcode',
            }[this.selectedTextKey] || 'Text'
        },
        isTextElement() {
            return !['logo', 'qr', 'barcode'].includes(this.selectedTextKey)
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
        defaultTextStyle(key) {
            const sizes = { brand: 12, name: 22, sku: 9, quantity: 8, location: 8 }
            return { text: '', size: sizes[key] || 10, align: 'left', scale: 100, x: 0, y: 0 }
        },
        labelText(key, fallback, useDraft = false) {
            if (useDraft && this.selectedTextKey === key && this.isTextElement) return this.textDraft.text
            return Object.prototype.hasOwnProperty.call(this.labelEdits, key)
                ? this.labelEdits[key].text
                : fallback
        },
        labelStyle(key, useDraft = false) {
            const saved = this.labelEdits[key] || this.defaultTextStyle(key)
            const style = useDraft && this.selectedTextKey === key ? this.textDraft : saved
            return {
                fontSize: style.size ? `${style.size}px` : undefined,
                textAlign: style.align || undefined,
                transform: `translate(${style.x || 0}px, ${style.y || 0}px) scale(${(style.scale || 100) / 100})`,
                transformOrigin: 'center',
            }
        },
        openLabelDesigner() {
            this.labelDesignerOpen = true
            this.selectLabelText('name', this.product.name)
        },
        selectLabelText(key, fallback) {
            this.selectedTextKey = key
            this.selectedFallback = String(fallback || '')
            const saved = this.labelEdits[key]
            this.textDraft = saved
                ? { ...this.defaultTextStyle(key), ...saved }
                : { ...this.defaultTextStyle(key), text: this.selectedFallback }
        },
        saveLabelText() {
            this.labelEditsByProduct[this.productId] = {
                ...this.labelEdits,
                [this.selectedTextKey]: { ...this.textDraft },
            }
            localStorage.setItem('ims_label_text_styles', JSON.stringify(this.labelEditsByProduct))
            this.store.addToast('Label text style saved.')
        },
        resetLabelText() {
            const next = { ...this.labelEdits }
            delete next[this.selectedTextKey]
            this.labelEditsByProduct[this.productId] = next
            localStorage.setItem('ims_label_text_styles', JSON.stringify(this.labelEditsByProduct))
            this.textDraft = {
                ...this.defaultTextStyle(this.selectedTextKey),
                text: this.selectedFallback,
            }
        },
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
