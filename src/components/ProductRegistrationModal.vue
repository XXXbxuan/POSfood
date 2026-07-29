<template>
    <div class="modal-backdrop" @click.self="close">
        <section class="form-modal registration-modal" :class="{ 'registration-modal-compact': stage !== 'form' }">
            <header class="modal-header">
                <div>
                    <span class="eyebrow">{{ stage === 'form' ? (editing ? 'EDIT PRODUCT' : 'NEW ITEM') : 'PRODUCT REGISTERED' }}</span>
                    <h2>{{ stage === 'form' ? (editing ? editProduct.name : 'Register Product') : product.name }}</h2>
                    <p v-if="stage === 'form'">{{ formStep === 1 ? 'Start with the product identity.' : 'Add stock rules and supply details.' }}</p>
                    <p v-else class="mono">{{ product.sku }}</p>
                </div>
                <button class="icon-button" type="button" aria-label="Close" @click="close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>

            <form v-if="stage === 'form'" class="registration-form" @submit.prevent="formStep === 1 ? nextStep() : save()">
                <nav class="registration-steps" aria-label="Registration progress">
                    <button type="button" :class="{ active: formStep === 1, complete: formStep > 1 }" @click="formStep = 1"><span>1</span><strong>Product</strong></button>
                    <i></i>
                    <button type="button" :class="{ active: formStep === 2 }" :disabled="formStep === 1" @click="formStep = 2"><span>2</span><strong>Stock Setup</strong></button>
                </nav>

                <section v-if="formStep === 1" class="registration-step-panel form-grid two-column">
                    <label class="full"><span>Product Name <b>*</b></span><input v-model.trim="form.name" type="text" required autofocus placeholder="e.g. Fresh Milk" /></label>
                    <label class="full product-photo-input"><span>Product Photo</span>
                        <span class="product-photo-picker">
                            <span>
                                <img v-if="form.photo" :src="form.photo" alt="Product preview" />
                                <i v-else class="fa-solid fa-image"></i>
                            </span>
                            <input type="file" accept="image/*" @change="loadProductPhoto" />
                        </span>
                    </label>
                    <label><span>Category <b>*</b></span>
                        <select v-model="form.category" required>
                            <option disabled value="">Select category</option>
                            <option>Dairy</option>
                            <option>Dry Goods</option>
                            <option>Packaging</option>
                            <option>Prepared Food</option>
                        </select>
                    </label>
                    <label><span>Product Type <b>*</b></span>
                        <select v-model="form.type">
                            <option>Retail Product</option>
                            <option>Ingredient</option>
                            <option>Prepared Product</option>
                        </select>
                    </label>
                    <label><span>Unit <b>*</b></span><input v-model.trim="form.unit" type="text" required placeholder="pcs, kg, cartons" /></label>
                    <label><span>Product Code / SKU</span>
                        <input :value="displayedSku" class="mono product-sku-readonly" type="text" readonly aria-readonly="true" />
                        <small class="product-sku-hint">Generated automatically from the selected category.</small>
                    </label>
                    <label class="full"><span>BAR</span><input v-model.trim="form.bar" class="mono" type="text" placeholder="Generated automatically when empty" /></label>
                </section>

                <section v-else class="registration-step-panel form-grid two-column">
                    <div class="location-select-pair full">
                        <label><span>Warehouse Section</span>
                            <select v-model="locationSection">
                                <option value="">Not assigned</option>
                                <option v-for="section in locationSections" :key="section" :value="section">{{ section }}</option>
                            </select>
                        </label>
                        <label><span>Position Number</span>
                            <select v-model="locationNumber" :disabled="!locationSection">
                                <option value="">Select number</option>
                                <option v-for="number in locationNumbers" :key="number" :value="number">{{ number }}</option>
                            </select>
                        </label>
                    </div>
                    <label><span>Minimum Stock</span><input v-model.number="form.minimumStock" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label><span>Cost Price (RM)</span><input v-model.number="form.costPrice" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label><span>Selling Price (RM)</span><input v-model.number="form.sellingPrice" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label class="full"><span>Supplier</span><input v-model.trim="form.supplier" type="text" placeholder="Supplier name" /></label>
                    <label class="toggle-label full">
                        <input v-model="form.expiryTracking" type="checkbox" />
                        <span><strong>Track batches and expiry</strong><small>Use for perishable products.</small></span>
                    </label>
                </section>
                <p v-if="formError" class="form-error full"><i class="fa-solid fa-circle-exclamation"></i>{{ formError }}</p>
                <footer class="registration-step-actions">
                    <button class="button secondary" type="button" @click="formStep === 1 ? close() : formStep--">{{ formStep === 1 ? 'Cancel' : 'Back' }}</button>
                    <button class="button primary" type="submit">
                        {{ formStep === 1 ? 'Next' : (editing ? 'Save Changes' : 'Register Product') }}
                        <i class="fa-solid" :class="formStep === 1 ? 'fa-arrow-right' : 'fa-check'"></i>
                    </button>
                </footer>
            </form>

            <div v-else-if="stage === 'choice'" class="registration-result">
                <span class="registration-success"><i class="fa-solid fa-check"></i></span>
                <h3>Product is in the list</h3>
                <p>You can close now or show its barcode label.</p>
                <div class="registration-summary">
                    <div><small>Product</small><strong>{{ product.name }}</strong></div>
                    <div><small>SKU</small><strong class="mono">{{ product.sku }}</strong></div>
                    <div><small>Stock</small><strong>0 {{ product.unit }}</strong></div>
                </div>
                <div class="registration-choice-actions">
                    <button class="button secondary" type="button" @click="close">Cancel</button>
                    <button class="button primary" type="button" @click="showBarcode"><i class="fa-solid fa-barcode"></i>Show Barcode</button>
                </div>
            </div>

            <div v-else class="registration-result barcode-result">
                <div class="registration-qr-card registration-barcode-card">
                    <img :src="barcodeDataUrl" :alt="`${product.name} barcode`" />
                    <h3>{{ product.name }}</h3>
                    <p class="mono">{{ product.sku }}</p>
                    <small>{{ product.bar }}</small>
                    <span>{{ product.location || 'Location not assigned' }}</span>
                </div>
                <div class="registration-choice-actions">
                    <button class="button secondary" type="button" @click="close">Close</button>
                    <button class="button primary" type="button" @click="printBarcode"><i class="fa-solid fa-print"></i>Print</button>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'
import { barcodeDataUrl as createBarcodeDataUrl } from '@/utils/barcode'

const locationSections = [
    'Rack A',
    'Rack B',
    'Rack C',
    'Rack D',
    'Chiller A',
    'Chiller B',
    'Freezer A',
    'Freezer B',
]

const locationNumbers = Array.from({ length: 20 }, (_, index) =>
    String(index + 1).padStart(2, '0'),
)

function parseLocation(value = '') {
    const match = String(value).trim().match(/^(.*\s[A-Z])-(\d{2})$/)
    return {
        section: match?.[1] && locationSections.includes(match[1]) ? match[1] : '',
        number: match?.[2] && locationNumbers.includes(match[2]) ? match[2] : '',
    }
}

const emptyForm = () => ({
    name: '',
    sku: '',
    bar: '',
    category: '',
    type: 'Retail Product',
    unit: 'pcs',
    minimumStock: 5,
    costPrice: 0,
    sellingPrice: 0,
    supplier: '',
    location: '',
    photo: '',
    expiryTracking: false,
    active: true,
})

export default {
    name: 'ProductRegistrationModal',
    props: {
        editProduct: { type: Object, default: null },
    },
    emits: ['close', 'registered'],
    data() {
        const source = this.editProduct
        const location = parseLocation(source?.location)
        return {
            store: inventoryStore,
            stage: 'form',
            formStep: 1,
            form: source
                ? {
                      name: source.name,
                      sku: source.sku,
                      bar: source.bar,
                      category: source.category,
                      type: source.type,
                      unit: source.unit,
                      minimumStock: source.minimumStock,
                      costPrice: source.costPrice,
                      sellingPrice: source.sellingPrice,
                      supplier: source.supplier,
                      location: source.location,
                      photo: source.photo || '',
                      expiryTracking: source.expiryTracking,
                      active: source.active,
                  }
                : emptyForm(),
            formError: '',
            product: null,
            barcodeDataUrl: '',
            locationSection: location.section,
            locationNumber: location.number,
            locationSections,
            locationNumbers,
        }
    },
    computed: {
        editing() {
            return Boolean(this.editProduct)
        },
        suggestedSku() {
            return this.form.category ? this.store.nextSku(this.form.category) : 'Generated when saved'
        },
        displayedSku() {
            if (
                this.editing &&
                this.form.category === this.editProduct.category
            ) {
                return this.form.sku
            }
            return this.suggestedSku
        },
    },
    methods: {
        close() {
            this.$emit('close')
        },
        nextStep() {
            this.formError = ''
            if (!this.form.name || !this.form.category || !this.form.unit) {
                this.formError = 'Complete the product name, category and unit first.'
                return
            }
            this.formStep = 2
        },
        loadProductPhoto(event) {
            const file = event.target.files?.[0]
            if (!file) return
            if (file.size > 1500000) {
                this.formError = 'Choose a photo smaller than 1.5 MB.'
                event.target.value = ''
                return
            }
            const reader = new FileReader()
            reader.onload = () => {
                this.form.photo = String(reader.result || '')
                this.formError = ''
            }
            reader.readAsDataURL(file)
        },
        save() {
            this.formError = ''
            try {
                this.form.location =
                    this.locationSection && this.locationNumber
                        ? `${this.locationSection}-${this.locationNumber}`
                        : ''
                this.product = this.store.saveProduct(this.form, this.editProduct?.id)
                if (this.editing) {
                    this.$emit('registered', this.product)
                    this.store.addToast(`${this.product.name} updated.`)
                    this.close()
                    return
                }
                this.stage = 'choice'
                this.$emit('registered', this.product)
                this.store.addToast(`${this.product.name} registered.`)
            } catch (error) {
                this.formError = error.message
            }
        },
        async showBarcode() {
            try {
                this.barcodeDataUrl = createBarcodeDataUrl(this.product.bar, {
                    width: 2.5,
                    height: 110,
                    fontSize: 18,
                })
                this.stage = 'barcode'
            } catch (error) {
                this.store.addToast('Unable to generate this barcode.', 'danger')
            }
        },
        async printBarcode() {
            if (!this.barcodeDataUrl) await this.showBarcode()
            const printWindow = window.open('', '_blank', 'width=520,height=640')
            if (!printWindow) {
                this.store.addToast('Allow pop-ups to print the barcode label.', 'danger')
                return
            }
            const safe = (value) =>
                String(value || '')
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
            printWindow.document.write(`<!doctype html><html><head><title>${safe(this.product.name)}</title><style>
                @page{size:60mm 45mm;margin:3mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111}
                .label{width:54mm;height:39mm;border:.0625rem solid #111;padding:3mm;display:grid;grid-template-rows:auto 1fr;gap:2mm}
                .info{display:grid;grid-template-columns:1fr auto;gap:1mm 3mm;align-items:end}.barcode{display:grid;place-items:center}
                img{max-width:48mm;width:100%;height:21mm;object-fit:contain}h1{font-size:11pt;margin:0;line-height:1.15}
                p{font-family:monospace;font-size:8pt;font-weight:700;margin:0}small{display:block;font-size:6.5pt}
            </style></head><body><div class="label"><div class="info"><h1>${safe(this.product.name)}</h1><p>${safe(this.product.sku)}</p>
                <small>${safe(this.product.location || 'No location')}</small></div><div class="barcode"><img src="${this.barcodeDataUrl}" alt=""></div>
            </div><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
            printWindow.document.close()
        },
    },
}
</script>
