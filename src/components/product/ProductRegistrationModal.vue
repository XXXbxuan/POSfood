<template>
    <div class="modal-backdrop" @click.self="close">
        <section class="form-modal registration-modal" :class="{ 'registration-modal-compact': stage !== 'form' }">
            <header class="modal-header">
                <div>
                    <span class="eyebrow">{{ stage === 'form' ? (editing ? 'EDIT PRODUCT' : 'NEW ITEM') : 'PRODUCT REGISTERED' }}</span>
                    <h2>{{ stage === 'form' ? (editing ? editProduct.name : 'Register Product') : product.name }}</h2>
                    <p v-if="stage !== 'form'" class="mono">{{ product.sku }}</p>
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
                    <LocalizedNameField
                        wide
                        required
                        label="Product Name"
                        editor-title="Enter product name"
                        placeholder="Click to enter product name"
                        example="e.g. Fresh Milk"
                        :mode="form.nameMode"
                        :translations="form.nameTranslations"
                        @save="applyProductName"
                    />
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
                        <ScrollableSelect v-model="form.category" required>
                            <option disabled value="">Select category</option>
                            <option v-for="category in store.state.productCategories" :key="category" :value="category">{{ category }}</option>
                        </ScrollableSelect>
                    </label>
                    <label><span>Product Type <b>*</b></span>
                        <ScrollableSelect v-model="form.type">
                            <option>Retail Product</option>
                            <option>Ingredient</option>
                            <option>Prepared Product</option>
                        </ScrollableSelect>
                    </label>
                    <label><span>Unit <b>*</b></span><input v-model.trim="form.unit" type="text" required placeholder="pcs, kg, cartons" /></label>
                    <label><span>Product Code / SKU</span>
                        <input :value="displayedSku" class="mono product-sku-readonly" type="text" readonly aria-readonly="true" />
                    </label>
                    <label class="full"><span>BAR</span><input v-model.trim="form.bar" class="mono" type="text" placeholder="Generated automatically when empty" /></label>
                </section>

                <section v-else class="registration-step-panel form-grid two-column">
                    <label><span>Minimum Stock</span><input v-model.number="form.minimumStock" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label><span>Cost Price (RM)</span><input v-model.number="form.costPrice" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label><span>Selling Price (RM)</span><input v-model.number="form.sellingPrice" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label v-if="!editing"><span>Initial Quantity</span><input v-model.number="form.initialQuantity" type="number" min="0" :step="form.trackingMode === 'unit' ? 1 : 0.01" inputmode="decimal" /></label>
                    <label v-if="!editing && Number(form.initialQuantity) > 0"><span>Initial Location <b>*</b></span>
                        <ScrollableSelect v-model="form.initialLocationId" required>
                            <option value="" disabled>Select location</option>
                            <option v-for="location in initialLocations" :key="location.id" :value="location.id">{{ location.name }}</option>
                        </ScrollableSelect>
                    </label>
                    <label class="full"><span>Supplier</span>
                        <ScrollableSelect v-model="form.supplierId">
                            <option value="">Not assigned</option>
                            <option
                                v-for="supplier in availableSuppliers"
                                :key="supplier.id"
                                :value="supplier.id"
                                :disabled="supplier.status !== 'active'"
                            >
                                {{ supplier.code }} — {{ supplier.name }}{{ supplier.status === 'active' ? '' : ' (Unavailable)' }}
                            </option>
                        </ScrollableSelect>
                    </label>
                    <label class="toggle-label full">
                        <input v-model="form.expiryTracking" type="checkbox" />
                        <span><strong>Track batches and expiry</strong></span>
                    </label>
                    <label class="full"><span>Tracking Mode <b>*</b></span>
                        <ScrollableSelect v-model="form.trackingMode">
                            <option value="none">Quantity</option>
                            <option value="batch">Expiry / lot</option>
                            <option value="unit">Individual units</option>
                        </ScrollableSelect>
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
                <div class="registration-summary">
                    <div><small>Product</small><strong>{{ product.name }}</strong></div>
                    <div><small>SKU</small><strong class="mono">{{ product.sku }}</strong></div>
                    <div><small>Stock</small><strong>{{ store.productStock(product.id) }} {{ product.unit }}</strong></div>
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
import { localizedFields, registerLocalizedFields } from '@/system/language'
import LocalizedNameField from '@/components/common/LocalizedNameField.vue'

const emptyForm = (supplierId = '') => ({
    name: '',
    nameMode: 'single',
    nameTranslations: { en: '', cn: '', bm: '' },
    sku: '',
    bar: '',
    category: '',
    type: 'Retail Product',
    unit: 'pcs',
    minimumStock: 5,
    costPrice: 0,
    sellingPrice: 0,
    supplierId,
    supplier: '',
    location: '',
    photo: '',
    expiryTracking: false,
    trackingMode: 'none',
    warehouseId: 'wh-main',
    initialQuantity: 0,
    initialLocationId: '',
    active: true,
})

export default {
    name: 'ProductRegistrationModal',
    components: { LocalizedNameField },
    props: {
        editProduct: { type: Object, default: null },
        initialSupplierId: { type: String, default: '' },
    },
    emits: ['close', 'registered'],
    data() {
        const source = this.editProduct
        return {
            store: inventoryStore,
            stage: 'form',
            formStep: 1,
            form: source
                ? {
                      name: source.name,
                      nameMode: source.nameMode || (
                          ((source.nameTranslations?.cn || source.nameI18n?.cn) && (source.nameTranslations?.cn || source.nameI18n?.cn) !== source.name) ||
                          ((source.nameTranslations?.bm || source.nameI18n?.bm) && (source.nameTranslations?.bm || source.nameI18n?.bm) !== source.name)
                              ? 'multiple'
                              : 'single'
                      ),
                      nameTranslations: {
                          en: source.nameTranslations?.en || source.nameI18n?.en || source.name || '',
                          cn: (source.nameTranslations?.cn || source.nameI18n?.cn) === source.name ? '' : source.nameTranslations?.cn || source.nameI18n?.cn || '',
                          bm: (source.nameTranslations?.bm || source.nameI18n?.bm) === source.name ? '' : source.nameTranslations?.bm || source.nameI18n?.bm || '',
                      },
                      sku: source.sku,
                      bar: source.bar,
                      category: source.category,
                      type: source.type,
                      unit: source.unit,
                      minimumStock: source.minimumStock,
                      costPrice: source.costPrice,
                      sellingPrice: source.sellingPrice,
                      supplierId:
                          source.supplierId ||
                          inventoryStore.findSupplier(source.supplier)?.id ||
                          '',
                      supplier: source.supplier,
                      location: source.location,
                      photo: source.photo || '',
                      expiryTracking: source.expiryTracking,
                      trackingMode: source.trackingMode || (source.expiryTracking ? 'batch' : 'none'),
                      warehouseId: source.warehouseId || 'wh-main',
                      active: source.active,
                  }
                : emptyForm(this.initialSupplierId),
            formError: '',
            product: null,
            barcodeDataUrl: '',
        }
    },
    computed: {
        editing() {
            return Boolean(this.editProduct)
        },
        suggestedSku() {
            return this.form.category ? this.store.nextSku(this.form.category) : this.$t('Generated when saved')
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
        availableSuppliers() {
            return this.store.state.suppliers.filter(
                (supplier) =>
                    supplier.status === 'active' ||
                    supplier.id === this.form.supplierId,
            )
        },
        initialLocations() {
            return (this.store.findWarehouse(this.form.warehouseId)?.locations || []).filter(
                (location) => location.active && location.status !== 'unavailable',
            )
        },
    },
    methods: {
        applyProductName({ mode, translations }) {
            this.form.nameMode = mode
            this.form.nameTranslations = translations
            this.form.name = translations.en
            this.formError = ''
        },
        close() {
            this.$emit('close')
        },
        nextStep() {
            this.formError = ''
            this.form.name = this.form.nameTranslations.en
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
                this.form.name = this.form.nameTranslations.en
                this.form.nameTranslations = this.form.nameMode === 'multiple'
                    ? localizedFields(this.form.nameTranslations.en, this.form.nameTranslations.cn, this.form.nameTranslations.bm)
                    : localizedFields(this.form.nameTranslations.en)
                const initialQuantity = this.editing ? 0 : Number(this.form.initialQuantity) || 0
                if (initialQuantity < 0) throw new Error('Initial quantity cannot be negative.')
                if (this.form.trackingMode === 'unit' && !Number.isInteger(initialQuantity)) throw new Error('Unit-tracked products require a whole initial quantity.')
                if (initialQuantity > 0 && !this.form.initialLocationId) throw new Error('Select a location for the initial quantity.')
                this.product = this.store.saveProduct(this.form, this.editProduct?.id)
                registerLocalizedFields(this.product.nameTranslations)
                if (this.editing) {
                    this.$emit('registered', this.product)
                    this.store.addToast(`${this.product.name} updated.`)
                    this.close()
                    return
                }
                if (initialQuantity > 0) {
                    this.store.receiveStock({
                        productId: this.product.id,
                        quantity: initialQuantity,
                        stockInType: 'standard',
                        supplierId: '',
                        warehouseId: this.form.warehouseId,
                        locationId: this.form.initialLocationId,
                        receivingDate: new Date().toISOString().slice(0, 10),
                        remark: 'Initial stock',
                    })
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
                    fontSize: 20,
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
                @page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{min-height:273mm;margin:0;display:grid;place-items:center;font-family:Arial,sans-serif;color:#111}
                .label{width:150mm;height:100mm;border:.5mm solid #111;padding:8mm;display:grid;grid-template-rows:auto 1fr;gap:5mm}
                .info{display:grid;grid-template-columns:1fr auto;gap:3mm 8mm;align-items:end}.barcode{display:grid;place-items:center}
                img{max-width:136mm;width:100%;height:50mm;object-fit:contain}h1{font-size:27pt;margin:0;line-height:1.15}
                p{font-family:monospace;font-size:19pt;font-weight:700;margin:0}small{display:block;font-size:15pt}
            </style></head><body><div class="label"><div class="info"><h1>${safe(this.product.name)}</h1><p>${safe(this.product.sku)}</p>
                </div><div class="barcode"><img src="${this.barcodeDataUrl}" alt=""></div>
            </div><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
            printWindow.document.close()
        },
    },
}
</script>

<style scoped src="@/assets/css/components/product-registration-modal.css"></style>
