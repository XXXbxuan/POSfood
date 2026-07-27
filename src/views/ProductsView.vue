<template>
    <div class="page-stack">
        <section class="page-heading">
            <div>
                <span class="eyebrow">PRODUCT MANAGEMENT</span>
                <h1>Products</h1>
                <p>Create products and control their inventory setup.</p>
            </div>
            <button class="button primary" type="button" @click="openProductForm()">
                <i class="fa-solid fa-plus"></i>Add Product
            </button>
        </section>

        <section class="filter-bar">
            <label class="search-field">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input v-model.trim="search" type="search" placeholder="Search name, SKU or barcode" />
            </label>
            <select v-model="category">
                <option value="">All categories</option>
                <option v-for="item in categories" :key="item">{{ item }}</option>
            </select>
            <select v-model="status">
                <option value="">All stock status</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
                <option>Inactive</option>
            </select>
            <span class="result-count">{{ filteredProducts.length }} items</span>
        </section>

        <section class="panel table-panel">
            <div class="table-scroll">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th aria-label="Actions"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="product in filteredProducts"
                            :key="product.id"
                            :class="{ 'low-row': store.productStatus(product) === 'Low Stock' }"
                        >
                            <td>
                                <button class="product-cell" type="button" @click="viewProduct(product)">
                                    <span>{{ product.name.slice(0, 2).toUpperCase() }}</span>
                                    <div><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }} · {{ product.barcode }}</small></div>
                                </button>
                            </td>
                            <td><span>{{ product.type }}</span><small>{{ product.category }}</small></td>
                            <td><span>{{ product.location || 'Not assigned' }}</span><small>{{ product.supplier || 'No supplier' }}</small></td>
                            <td><strong class="table-stock">{{ product.currentStock }}</strong> <small>{{ product.unit }}</small><small>Min. {{ product.minimumStock }}</small></td>
                            <td><span class="status-badge" :class="statusClass(product)">{{ store.productStatus(product) }}</span></td>
                            <td>
                                <div class="row-actions">
                                    <button type="button" aria-label="Edit product" @click="openProductForm(product)"><i class="fa-solid fa-pen"></i></button>
                                    <button type="button" aria-label="View product" @click="viewProduct(product)"><i class="fa-solid fa-chevron-right"></i></button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!filteredProducts.length" class="empty-state">
                <i class="fa-solid fa-box-open"></i><strong>No products found</strong><p>Change the filters or add a new product.</p>
            </div>
        </section>

        <div v-if="formOpen" class="modal-backdrop" @click.self="formOpen = false">
            <section class="form-modal product-form-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">{{ editingProduct ? 'EDIT PRODUCT' : 'NEW PRODUCT' }}</span>
                        <h2>{{ editingProduct ? editingProduct.name : 'Add Product' }}</h2>
                        <p>Product identity and stock rules.</p>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="formOpen = false"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <form class="form-grid two-column" @submit.prevent="save">
                    <label class="full"><span>Product Name <b>*</b></span><input v-model.trim="form.name" type="text" required placeholder="e.g. Fresh Milk" /></label>
                    <label><span>Product Code / SKU</span><input v-model.trim="form.sku" class="mono" type="text" :placeholder="suggestedSku" /></label>
                    <label><span>Barcode</span><input v-model.trim="form.barcode" class="mono" type="text" placeholder="Generated if empty" /></label>
                    <label><span>Category <b>*</b></span><input v-model.trim="form.category" type="text" required placeholder="Dairy" /></label>
                    <label><span>Product Type <b>*</b></span>
                        <select v-model="form.type">
                            <option>Retail Product</option><option>Ingredient</option><option>Prepared Product</option>
                        </select>
                    </label>
                    <label><span>Unit <b>*</b></span><input v-model.trim="form.unit" type="text" required placeholder="pcs, kg, cartons" /></label>
                    <label><span>Minimum Stock</span><input v-model.number="form.minimumStock" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label><span>Cost Price (RM)</span><input v-model.number="form.costPrice" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label><span>Selling Price (RM)</span><input v-model.number="form.sellingPrice" type="number" min="0" step="0.01" inputmode="decimal" /></label>
                    <label><span>Supplier</span><input v-model.trim="form.supplier" type="text" placeholder="Supplier name" /></label>
                    <label><span>Warehouse Location</span><input v-model.trim="form.location" type="text" placeholder="Rack A-01" /></label>
                    <label class="toggle-label full">
                        <input v-model="form.expiryTracking" type="checkbox" />
                        <span><strong>Track batches and expiry</strong><small>Required for perishable products.</small></span>
                    </label>
                    <p v-if="formError" class="form-error full"><i class="fa-solid fa-circle-exclamation"></i>{{ formError }}</p>
                    <footer class="form-actions full">
                        <button v-if="editingProduct" class="button text-danger" type="button" @click="toggleActive">
                            {{ editingProduct.active ? 'Disable Product' : 'Enable Product' }}
                        </button>
                        <span></span>
                        <button class="button secondary" type="button" @click="formOpen = false">Cancel</button>
                        <button class="button primary" type="submit"><i class="fa-solid fa-check"></i>Save Product</button>
                    </footer>
                </form>
            </section>
        </div>
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'

const emptyForm = () => ({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    type: 'Retail Product',
    unit: 'pcs',
    minimumStock: 5,
    costPrice: 0,
    sellingPrice: 0,
    supplier: '',
    location: '',
    expiryTracking: false,
    active: true,
})

export default {
    name: 'ProductsView',
    data() {
        return {
            store: inventoryStore,
            search: '',
            category: '',
            status: '',
            formOpen: false,
            editingProduct: null,
            form: emptyForm(),
            formError: '',
        }
    },
    computed: {
        categories() {
            return [...new Set(this.store.state.products.map((product) => product.category))].sort()
        },
        filteredProducts() {
            const search = this.search.toLowerCase()
            return this.store.state.products.filter((product) => {
                const matchesSearch =
                    !search ||
                    [product.name, product.sku, product.barcode].some((value) =>
                        String(value).toLowerCase().includes(search),
                    )
                return (
                    matchesSearch &&
                    (!this.category || product.category === this.category) &&
                    (!this.status || this.store.productStatus(product) === this.status)
                )
            })
        },
        suggestedSku() {
            return this.form.category ? this.store.nextSku(this.form.category) : 'Generated when saved'
        },
    },
    methods: {
        statusClass(product) {
            return `status-${this.store.productStatus(product).toLowerCase().replaceAll(' ', '-')}`
        },
        viewProduct(product) {
            this.$router.push({ path: '/inventory/scan', query: { code: product.sku } })
        },
        openProductForm(product = null) {
            this.editingProduct = product
            this.formError = ''
            this.form = product
                ? {
                      name: product.name,
                      sku: product.sku,
                      barcode: product.barcode,
                      category: product.category,
                      type: product.type,
                      unit: product.unit,
                      minimumStock: product.minimumStock,
                      costPrice: product.costPrice,
                      sellingPrice: product.sellingPrice,
                      supplier: product.supplier,
                      location: product.location,
                      expiryTracking: product.expiryTracking,
                      active: product.active,
                  }
                : emptyForm()
            this.formOpen = true
        },
        save() {
            this.formError = ''
            try {
                const product = this.store.saveProduct(this.form, this.editingProduct?.id)
                this.formOpen = false
                this.store.addToast(`${product.name} saved.`)
            } catch (error) {
                this.formError = error.message
            }
        },
        toggleActive() {
            const product = this.store.setProductActive(
                this.editingProduct.id,
                !this.editingProduct.active,
            )
            this.formOpen = false
            this.store.addToast(`${product.name} ${product.active ? 'enabled' : 'disabled'}.`)
        },
    },
}
</script>
