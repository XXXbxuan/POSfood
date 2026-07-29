<template>
    <div class="page-stack labels-page">
        <section class="page-heading labels-heading-simple">
            <div><h1>Print Labels</h1></div>
            <div class="label-heading-actions">
                <button class="button print" type="button" :disabled="!product" @click="printLabels"><i class="fa-solid fa-print"></i>Print Labels</button>
            </div>
        </section>

        <section class="labels-layout">
            <form class="panel label-controls" @submit.prevent>
                <header class="section-header label-setup-header"><span><i class="fa-solid fa-sliders"></i></span><div><h2>Label setup</h2></div></header>
                <label><span>Product <b>*</b></span><select v-model="productId" @change="onProductChange"><option value="" disabled>Select product</option><option v-for="item in activeProducts" :key="item.id" :value="item.id">{{ item.name }} — {{ item.sku }}</option></select></label>
                <label><span>Batch</span><select v-model="batchId"><option value="">Product label (no batch)</option><option v-for="batch in product?.batches || []" :key="batch.id" :value="batch.id">{{ batch.id }} — {{ batch.quantity }} {{ product.unit }}</option></select></label>
                <div class="form-grid two-column">
                    <label><span>Label Size</span><select v-model="size"><option value="medium">60 × 40 mm</option><option value="small">50 × 30 mm</option><option value="large">80 × 50 mm</option></select></label>
                    <label><span>Print Quantity</span><input v-model.number="quantity" type="number" min="1" max="250" inputmode="numeric" /></label>
                </div>
                <label class="toggle-label"><input v-model="showExpiry" type="checkbox" /><span><strong>Show expiry date</strong></span></label>
                <label class="toggle-label"><input v-model="showPrice" type="checkbox" /><span><strong>Show selling price</strong></span></label>
            </form>

            <section class="panel label-preview-panel">
                <header class="panel-header label-preview-header"><div><h2>Warehouse sticker</h2></div><span>{{ sizeLabel }}</span></header>
                <div v-if="product" class="label-stage" @click="openLabelDesigner">
                    <article id="printable-label" class="inventory-label" :class="`label-${size}`">
                        <header>
                            <span :style="labelStyle('logo')"><i class="fa-solid fa-boxes-stacked"></i></span>
                            <strong :style="labelStyle('brand')">{{ labelText('brand', 'INVENTORY') }}</strong>
                            <small :style="labelStyle('warehouse')">{{ labelText('warehouse', 'MAIN WAREHOUSE') }}</small>
                        </header>
                        <h2 :style="labelStyle('name')">{{ labelText('name', product.name) }}</h2>
                        <p class="mono product-label-code" :style="labelStyle('sku')">{{ labelText('sku', product.sku) }}</p>
                        <dl>
                            <div v-if="batch" :style="labelFieldStyle('batch')"><dt>Batch</dt><dd class="mono" :style="labelTextStyle('batch')">{{ labelText('batch', batch.id) }}</dd></div>
                            <div :style="labelFieldStyle('quantity')"><dt>Quantity</dt><dd :style="labelTextStyle('quantity')">{{ labelText('quantity', `${batch?.quantity ?? product.currentStock} ${product.unit}`) }}</dd></div>
                            <div :style="labelFieldStyle('received')"><dt>Received</dt><dd :style="labelTextStyle('received')">{{ labelText('received', formatDate(batch?.receivedDate)) }}</dd></div>
                            <div v-if="showExpiry && batch?.expiryDate" :style="labelFieldStyle('expiry')"><dt>Expiry</dt><dd :style="labelTextStyle('expiry')">{{ labelText('expiry', formatDate(batch.expiryDate)) }}</dd></div>
                            <div :style="labelFieldStyle('location')"><dt>Location</dt><dd :style="labelTextStyle('location')">{{ labelText('location', batch?.location || product.location) }}</dd></div>
                            <div v-if="showPrice && product.sellingPrice" :style="labelFieldStyle('price')"><dt>Price</dt><dd :style="labelTextStyle('price')">{{ labelText('price', `RM ${Number(product.sellingPrice).toFixed(2)}`) }}</dd></div>
                        </dl>
                        <span
                            v-for="key in savedCustomTextKeys"
                            :key="key"
                            class="label-custom-text"
                            :style="labelStyle(key)"
                        >{{ labelText(key, 'Text') }}</span>
                        <div class="label-code-row">
                            <img v-if="barcodeDataUrl" class="label-barcode-image" :src="barcodeDataUrl" :style="labelStyle('barcode')" alt="Product barcode" />
                        </div>
                    </article>
                </div>
                <div v-else class="summary-placeholder"><i class="fa-solid fa-tag"></i><p>Select a product to preview its label.</p></div>
            </section>
        </section>

        <div class="print-sheet" aria-hidden="true">
            <article v-for="index in printCount" :key="index" class="inventory-label print-copy" :class="`label-${size}`" v-html="printMarkup"></article>
        </div>

        <div v-if="labelDesignerOpen" class="modal-backdrop" @click.self="requestCloseDesigner">
            <section class="form-modal label-designer-modal">
                <header class="modal-header">
                    <div><h2>Edit Warehouse Sticker</h2></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="requestCloseDesigner"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <div class="label-designer-body">
                    <div class="label-designer-stage">
                        <article class="inventory-label is-editing" :class="`label-${size}`">
                            <header>
                                <span class="label-edit-target" :class="{ selected: selectedTextKey === 'logo' }" :style="labelStyle('logo', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'logo')"><i class="fa-solid fa-boxes-stacked"></i></span>
                                <strong class="label-edit-target" :class="{ selected: selectedTextKey === 'brand' }" :style="labelStyle('brand', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'brand', 'INVENTORY')">{{ labelText('brand', 'INVENTORY', true) }}</strong>
                                <small class="label-edit-target" :class="{ selected: selectedTextKey === 'warehouse' }" :style="labelStyle('warehouse', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'warehouse', 'MAIN WAREHOUSE')">{{ labelText('warehouse', 'MAIN WAREHOUSE', true) }}</small>
                            </header>
                            <h2 class="label-edit-target" :class="{ selected: selectedTextKey === 'name' }" :style="labelStyle('name', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'name', product.name)">{{ labelText('name', product.name, true) }}</h2>
                            <p class="mono product-label-code label-edit-target" :class="{ selected: selectedTextKey === 'sku' }" :style="labelStyle('sku', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'sku', product.sku)">{{ labelText('sku', product.sku, true) }}</p>
                            <dl>
                                <div v-if="batch" class="label-edit-target label-field-target" :class="{ selected: selectedTextKey === 'batch' }" :style="labelFieldStyle('batch', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'batch', batch.id)"><dt>Batch</dt><dd class="mono" :style="labelTextStyle('batch', true)">{{ labelText('batch', batch.id, true) }}</dd></div>
                                <div class="label-edit-target label-field-target" :class="{ selected: selectedTextKey === 'quantity' }" :style="labelFieldStyle('quantity', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'quantity', `${batch?.quantity ?? product.currentStock} ${product.unit}`)"><dt>Quantity</dt><dd :style="labelTextStyle('quantity', true)">{{ labelText('quantity', `${batch?.quantity ?? product.currentStock} ${product.unit}`, true) }}</dd></div>
                                <div class="label-edit-target label-field-target" :class="{ selected: selectedTextKey === 'received' }" :style="labelFieldStyle('received', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'received', formatDate(batch?.receivedDate))"><dt>Received</dt><dd :style="labelTextStyle('received', true)">{{ labelText('received', formatDate(batch?.receivedDate), true) }}</dd></div>
                                <div v-if="showExpiry && batch?.expiryDate" class="label-edit-target label-field-target" :class="{ selected: selectedTextKey === 'expiry' }" :style="labelFieldStyle('expiry', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'expiry', formatDate(batch.expiryDate))"><dt>Expiry</dt><dd :style="labelTextStyle('expiry', true)">{{ labelText('expiry', formatDate(batch.expiryDate), true) }}</dd></div>
                                <div class="label-edit-target label-field-target" :class="{ selected: selectedTextKey === 'location' }" :style="labelFieldStyle('location', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'location', batch?.location || product.location)"><dt>Location</dt><dd :style="labelTextStyle('location', true)">{{ labelText('location', batch?.location || product.location, true) }}</dd></div>
                                <div v-if="showPrice && product.sellingPrice" class="label-edit-target label-field-target" :class="{ selected: selectedTextKey === 'price' }" :style="labelFieldStyle('price', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'price', `RM ${Number(product.sellingPrice).toFixed(2)}`)"><dt>Price</dt><dd :style="labelTextStyle('price', true)">{{ labelText('price', `RM ${Number(product.sellingPrice).toFixed(2)}`, true) }}</dd></div>
                            </dl>
                            <span
                                v-for="key in designerCustomTextKeys"
                                :key="key"
                                class="label-custom-text label-edit-target"
                                :class="{ selected: selectedTextKey === key }"
                                :style="labelStyle(key, true)"
                                @pointerdown.stop.prevent="beginDesignerPointer($event, key, 'Text')"
                            >{{ labelText(key, 'Text', true) }}</span>
                            <div class="label-code-row">
                                <span v-if="barcodeDataUrl" class="label-edit-target label-barcode-target" :class="{ selected: selectedTextKey === 'barcode' }" :style="labelStyle('barcode', true)" @pointerdown.stop.prevent="beginDesignerPointer($event, 'barcode')"><img :src="barcodeDataUrl" alt="Product barcode" /></span>
                            </div>
                        </article>
                    </div>
                    <form class="label-designer-controls form-grid" @submit.prevent="saveLabelText">
                        <div class="designer-selection"><span>SELECTED ITEM</span><strong>{{ editorLabel }}</strong></div>
                        <button class="button secondary label-add-text-button" type="button" @click="addTextBox"><i class="fa-solid fa-plus"></i>Add Text Box</button>
                        <label v-if="isTextElement"><span>Display Text</span><input v-model="textDraft.text" type="text" /></label>
                        <label v-if="isTextElement"><span>Font Size</span>
                            <div class="label-font-size-control">
                                <input v-model.number="textDraft.size" class="label-font-size-range" type="range" min="7" max="64" />
                                <input v-model.number="textDraft.size" class="label-font-size-number" type="number" min="7" max="200" inputmode="numeric" aria-label="Exact font size" @change="normaliseFontSize" />
                            </div>
                        </label>
                        <label v-if="isTextElement"><span>Text Alignment</span>
                            <div class="label-align-control">
                                <button v-for="align in ['left', 'center', 'right']" :key="align" type="button" :class="{ active: textDraft.align === align }" @click="textDraft.align = align">
                                    <i class="fa-solid" :class="`fa-align-${align}`"></i>
                                </button>
                            </div>
                        </label>
                        <button v-if="isCustomText" class="button label-delete-text-button" type="button" @click="deleteTextBox"><i class="fa-solid fa-trash-can"></i>Delete Text Box</button>
                        <footer class="form-actions label-designer-actions">
                            <button class="button secondary" type="button" @click="resetAllLabelElements">Reset</button>
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
import { inventoryStore } from '@/services/inventoryStore'
import { barcodeDataUrl as createBarcodeDataUrl } from '@/utils/barcode'

function readSavedLabelEdits() {
    try {
        const saved =
            JSON.parse(localStorage.getItem('ims_label_text_styles')) || {}
        return Object.fromEntries(
            Object.entries(saved).map(([productId, edits]) => {
                const {
                    barcode: savedBarcodeStyle,
                    bar: legacyBarStyle,
                    qr: legacyQrStyle,
                    ...currentEdits
                } = edits || {}
                const barcodeStyle =
                    savedBarcodeStyle || legacyBarStyle || legacyQrStyle
                return [
                    productId,
                    {
                        ...currentEdits,
                        ...(barcodeStyle ? { barcode: barcodeStyle } : {}),
                    },
                ]
            }),
        )
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
            barcodeDataUrl: '',
            printMarkup: '',
            labelDesignerOpen: false,
            selectedTextKey: '',
            selectedFallback: '',
            textDraft: { text: '', size: 12, align: 'left' },
            labelEditsByProduct: readSavedLabelEdits(),
            designerEdits: {},
            designerPointer: null,
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
            return this.product?.bar || ''
        },
        sizeLabel() {
            return { small: '50 × 30 mm', medium: '60 × 40 mm', large: '80 × 50 mm' }[this.size]
        },
        printCount() {
            return Math.min(250, Math.max(1, Number(this.quantity) || 1))
        },
        labelEdits() {
            return this.labelEditsByProduct[this.productId] || {}
        },
        savedCustomTextKeys() {
            return this.labelEdits.__customTextKeys || []
        },
        designerCustomTextKeys() {
            return this.designerEdits.__customTextKeys || []
        },
        editorLabel() {
            if (this.isCustomText) return 'Text Box'
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
                barcode: 'Barcode',
            }[this.selectedTextKey] || 'Text'
        },
        isTextElement() {
            return !['logo', 'barcode'].includes(this.selectedTextKey)
        },
        isCustomText() {
            return this.selectedTextKey.startsWith('custom-text-')
        },
    },
    watch: {
        codeContent: 'generateBarcode',
    },
    beforeUnmount() {
        this.endDesignerPointer()
    },
    mounted() {
        const product = this.store.findProduct(this.$route.query.product)
        if (product) {
            this.productId = product.id
            this.batchId = this.$route.query.batch || ''
            this.quantity = Math.max(1, Number(this.$route.query.quantity) || 1)
            this.generateBarcode()
        }
    },
    methods: {
        defaultTextStyle(key) {
            const sizes = { brand: 12, name: 22, sku: 9, quantity: 8, location: 8 }
            const custom = key.startsWith('custom-text-')
            return {
                text: custom ? 'Text' : '',
                size: custom ? 12 : sizes[key] || 10,
                align: 'left',
                scale: 100,
                x: 0,
                y: 0,
            }
        },
        labelText(key, fallback, useDraft = false) {
            if (useDraft && this.selectedTextKey === key && this.isTextElement) return this.textDraft.text
            const source = useDraft ? this.designerEdits : this.labelEdits
            return Object.prototype.hasOwnProperty.call(source, key)
                ? source[key].text
                : fallback
        },
        labelStyle(key, useDraft = false) {
            const source = useDraft ? this.designerEdits : this.labelEdits
            const saved = source[key] || this.defaultTextStyle(key)
            const style = useDraft && this.selectedTextKey === key ? this.textDraft : saved
            return {
                fontSize: style.size ? `${style.size}px` : undefined,
                textAlign: style.align || undefined,
                transform: `translate(${style.x || 0}px, ${style.y || 0}px) scale(${(style.scale || 100) / 100})`,
                transformOrigin: 'center',
            }
        },
        labelTextStyle(key, useDraft = false) {
            const source = useDraft ? this.designerEdits : this.labelEdits
            const saved = source[key] || this.defaultTextStyle(key)
            const style = useDraft && this.selectedTextKey === key ? this.textDraft : saved
            return {
                fontSize: style.size ? `${style.size}px` : undefined,
                textAlign: style.align || undefined,
            }
        },
        labelFieldStyle(key, useDraft = false) {
            const source = useDraft ? this.designerEdits : this.labelEdits
            const saved = source[key] || this.defaultTextStyle(key)
            const style = useDraft && this.selectedTextKey === key ? this.textDraft : saved
            return {
                transform: `translate(${style.x || 0}px, ${style.y || 0}px) scale(${(style.scale || 100) / 100})`,
                transformOrigin: 'center',
            }
        },
        openLabelDesigner() {
            this.designerEdits = JSON.parse(JSON.stringify(this.labelEdits))
            this.labelDesignerOpen = true
            this.selectedTextKey = ''
            this.selectLabelText('name', this.product.name)
        },
        selectLabelText(key, fallback) {
            this.commitDesignerDraft()
            this.selectedTextKey = key
            this.selectedFallback = String(fallback || '')
            const saved = this.designerEdits[key]
            this.textDraft = saved
                ? { ...this.defaultTextStyle(key), ...saved }
                : { ...this.defaultTextStyle(key), text: this.selectedFallback }
        },
        commitDesignerDraft() {
            if (!this.selectedTextKey) return
            this.designerEdits = {
                ...this.designerEdits,
                [this.selectedTextKey]: { ...this.textDraft },
            }
        },
        addTextBox() {
            this.commitDesignerDraft()
            const key = `custom-text-${Date.now()}`
            const customCount = this.designerCustomTextKeys.length
            this.designerEdits = {
                ...this.designerEdits,
                __customTextKeys: [...this.designerCustomTextKeys, key],
                [key]: {
                    ...this.defaultTextStyle(key),
                    text: 'Text',
                    x: 150,
                    y: 82 + customCount * 18,
                },
            }
            this.selectedTextKey = ''
            this.selectLabelText(key, 'Text')
        },
        deleteTextBox() {
            if (!this.isCustomText) return
            const key = this.selectedTextKey
            const { [key]: removed, ...remainingEdits } = this.designerEdits
            this.designerEdits = {
                ...remainingEdits,
                __customTextKeys: this.designerCustomTextKeys.filter((item) => item !== key),
            }
            this.selectedTextKey = ''
            this.selectLabelText('name', this.product.name)
        },
        beginDesignerPointer(event, key, fallback = '') {
            if (this.designerPointer) this.endDesignerPointer()
            if (this.selectedTextKey !== key) this.selectLabelText(key, fallback)
            const target = event.currentTarget
            const rect = target.getBoundingClientRect()
            const resizeEdge = 20
            const isResize =
                event.clientX >= rect.right - resizeEdge &&
                event.clientY >= rect.bottom - resizeEdge

            this.designerPointer = {
                mode: isResize ? 'resize' : 'move',
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startStyle: { ...this.defaultTextStyle(key), ...this.textDraft },
            }

            document.body.classList.add('label-designer-dragging')
            window.addEventListener('pointermove', this.moveDesignerPointer, { passive: false })
            window.addEventListener('pointerup', this.endDesignerPointer)
            window.addEventListener('pointercancel', this.endDesignerPointer)
        },
        moveDesignerPointer(event) {
            if (!this.designerPointer) return
            event.preventDefault()

            const deltaX = event.clientX - this.designerPointer.startX
            const deltaY = event.clientY - this.designerPointer.startY
            const start = this.designerPointer.startStyle

            if (this.designerPointer.mode === 'resize') {
                const nextScale = Math.round(Number(start.scale || 100) + (deltaX + deltaY) / 2)
                this.textDraft.scale = Math.min(300, Math.max(30, nextScale))
                return
            }

            const nextX = Math.round(Number(start.x || 0) + deltaX)
            const nextY = Math.round(Number(start.y || 0) + deltaY)
            this.textDraft.x = Math.min(280, Math.max(-280, nextX))
            this.textDraft.y = Math.min(180, Math.max(-180, nextY))
        },
        endDesignerPointer() {
            window.removeEventListener('pointermove', this.moveDesignerPointer)
            window.removeEventListener('pointerup', this.endDesignerPointer)
            window.removeEventListener('pointercancel', this.endDesignerPointer)
            document.body.classList.remove('label-designer-dragging')
            this.designerPointer = null
        },
        normaliseFontSize() {
            const value = Number(this.textDraft.size) || 10
            this.textDraft.size = Math.min(200, Math.max(7, value))
        },
        saveLabelText() {
            this.commitDesignerDraft()
            this.labelEditsByProduct[this.productId] = {
                ...this.designerEdits,
            }
            localStorage.setItem('ims_label_text_styles', JSON.stringify(this.labelEditsByProduct))
            this.labelDesignerOpen = false
            this.store.addToast('Label saved.')
        },
        resetAllLabelElements() {
            if (!window.confirm('Reset the entire label to its default layout?')) return
            this.designerEdits = {}
            const key = this.selectedTextKey || 'name'
            const fallback = key === 'name' ? this.product.name : this.selectedFallback
            this.selectedTextKey = ''
            this.selectLabelText(key, fallback)
        },
        requestCloseDesigner() {
            if (!window.confirm('Close without saving these label changes?')) return
            this.endDesignerPointer()
            this.labelDesignerOpen = false
        },
        onProductChange() {
            this.batchId = ''
            this.generateBarcode()
        },
        generateBarcode() {
            if (!this.codeContent) {
                this.barcodeDataUrl = ''
                return
            }
            this.barcodeDataUrl = createBarcodeDataUrl(this.codeContent, {
                margin: 0,
                width: 1.6,
                height: 54,
                fontSize: 11,
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
