<template>
    <div class="page-stack products-page">
        <section class="page-heading">
            <div><h1>Products</h1></div>
        </section>

        <section class="filter-bar">
            <label class="search-field">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input v-model.trim="search" type="search" placeholder="Search name, SKU or BAR" />
            </label>
            <button class="button secondary product-filter-button" type="button" @click="openFilters">
                <i class="fa-solid fa-sliders"></i>Filter
                <span v-if="activeFilterCount">{{ activeFilterCount }}</span>
            </button>
        </section>

        <section class="products-list-shell">
            <nav class="product-category-bar" aria-label="Product categories">
                <button type="button" :class="{ active: category === '' }" :aria-pressed="category === ''" @click="category = ''">All</button>
                <button
                    v-for="item in categories"
                    :key="item"
                    type="button"
                    :class="{ active: category === item }"
                    :aria-pressed="category === item"
                    @click="category = item"
                >
                    {{ item }}
                </button>
            </nav>

            <section class="panel table-panel">
            <div class="table-scroll">
                <table class="inventory-table products-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Product Code</th>
                            <th>Location</th>
                            <th>Stock</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="product in filteredProducts"
                            :key="product.id"
                            class="clickable-product-row"
                            :class="{ 'low-row': store.productStatus(product) === 'Low Stock' }"
                            tabindex="0"
                            @click="openDetails(product)"
                            @keydown.enter="openDetails(product)"
                        >
                            <td>
                                <div class="product-cell">
                                    <span class="product-list-photo">
                                        <img v-if="product.photo" :src="product.photo" :alt="product.name" />
                                        <template v-else>{{ product.name.slice(0, 2).toUpperCase() }}</template>
                                    </span>
                                    <div><strong>{{ product.name }}</strong></div>
                                </div>
                            </td>
                            <td>
                                <div class="product-category-cell">
                                    <strong class="mono">{{ product.sku }}</strong>
                                </div>
                            </td>
                            <td><strong>{{ product.location || 'Not assigned' }}</strong></td>
                            <td><strong class="table-stock">{{ product.currentStock }}</strong> <small>{{ product.unit }}</small></td>
                            <td>
                                <span class="status-badge" :class="statusClass(product)">{{ store.productStatus(product) }}</span>
                                <i class="fa-solid fa-chevron-right product-row-chevron"></i>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!filteredProducts.length" class="empty-state">
                <i class="fa-solid fa-box-open"></i><strong>No products found</strong><p>Change the filters or register a product.</p>
            </div>
            </section>
        </section>

        <div v-if="selectedProduct" class="modal-backdrop" @click.self="closeDetails">
            <section class="form-modal product-details-modal" :class="{ 'with-operation': operation }">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">PRODUCT DETAILS</span>
                    </div>
                    <div class="product-detail-header-actions">
                        <button class="icon-button" type="button" aria-label="Print barcode" title="Print barcode" @click="printBarcode"><i class="fa-solid fa-print"></i></button>
                        <button class="icon-button" type="button" aria-label="Edit product" title="Edit product" @click="editOpen = true"><i class="fa-solid fa-pen"></i></button>
                        <button class="icon-button" type="button" aria-label="Close" @click="closeDetails"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </header>
                <div class="product-details-workspace">
                    <div class="product-details-body">
                    <section class="product-details-left">
                        <div class="product-detail-photo">
                            <img v-if="selectedProduct.photo" :src="selectedProduct.photo" :alt="selectedProduct.name" />
                            <strong v-else>{{ selectedProduct.name.slice(0, 2).toUpperCase() }}</strong>
                        </div>
                        <div class="product-details-copy">
                            <h2>{{ selectedProduct.name }}</h2>
                            <p class="mono">{{ selectedProduct.sku }}</p>
                            <span class="status-badge" :class="statusClass(selectedProduct)">{{ store.productStatus(selectedProduct) }}</span>
                        </div>
                    </section>
                    <section class="product-details-right">
                        <div class="product-details-barcode">
                            <span>BARCODE</span>
                            <img v-if="detailBarcode" :src="detailBarcode" :alt="`${selectedProduct.name} barcode`" />
                            <i v-else class="fa-solid fa-barcode"></i>
                        </div>
                        <div class="details-stock">
                            <small>Current Stock</small>
                            <strong>{{ selectedProduct.currentStock }}</strong>
                            <span>{{ selectedProduct.unit }}</span>
                        </div>
                        <dl class="product-details-grid">
                            <div><dt>Category</dt><dd>{{ selectedProduct.category }}</dd></div>
                            <div><dt>Type</dt><dd>{{ selectedProduct.type }}</dd></div>
                            <div><dt>Location</dt><dd>{{ selectedProduct.location || 'Not assigned' }}</dd></div>
                            <div><dt>Minimum Stock</dt><dd>{{ selectedProduct.minimumStock }} {{ selectedProduct.unit }}</dd></div>
                            <div><dt>Supplier</dt><dd>{{ selectedProduct.supplier || 'Not assigned' }}</dd></div>
                            <div><dt>Batches</dt><dd>{{ selectedProduct.batches.length }}</dd></div>
                        </dl>
                        <footer class="product-details-actions">
                            <button class="button stock-in" :class="{ active: operation === 'in' }" type="button" @click="startOperation('in')"><i class="fa-solid fa-arrow-down"></i>Stock In</button>
                            <button class="button stock-out" :class="{ active: operation === 'out' }" type="button" @click="startOperation('out')"><i class="fa-solid fa-arrow-up"></i>Stock Out</button>
                        </footer>
                        <StockOperationForm
                            v-if="operation"
                            :product="selectedProduct"
                            :direction="operation"
                            @close="operation = ''"
                            @completed="completeOperation"
                        />
                    </section>
                    </div>
                </div>
            </section>
        </div>

        <ProductRegistrationModal
            v-if="editOpen && selectedProduct"
            :edit-product="selectedProduct"
            @close="editOpen = false"
            @registered="handleEdited"
        />

        <div v-if="filterOpen" class="modal-backdrop" @click.self="filterOpen = false">
            <section class="form-modal product-filter-modal">
                <header class="modal-header">
                    <div><span class="eyebrow">PRODUCTS</span><h2>Filter products</h2><p>Choose category and stock status.</p></div>
                    <button class="icon-button" type="button" aria-label="Close" @click="filterOpen = false"><i class="fa-solid fa-xmark"></i></button>
                </header>
                <form class="form-grid" @submit.prevent="applyFilters">
                    <label><span>Category</span>
                        <select v-model="filterDraft.category">
                            <option value="">All categories</option>
                            <option v-for="item in categories" :key="item">{{ item }}</option>
                        </select>
                    </label>
                    <label><span>Stock Status</span>
                        <select v-model="filterDraft.status">
                            <option value="">All stock status</option>
                            <option>In Stock</option>
                            <option>Low Stock</option>
                            <option>Out of Stock</option>
                            <option>Inactive</option>
                        </select>
                    </label>
                    <footer class="product-filter-actions">
                        <button class="button secondary" type="button" @click="clearFilters">Clear</button>
                        <button class="button primary" type="submit">Apply Filter</button>
                    </footer>
                </form>
            </section>
        </div>
    </div>
</template>

<script>
import ProductRegistrationModal from '@/components/ProductRegistrationModal.vue'
import StockOperationForm from '@/components/StockOperationForm.vue'
import { inventoryStore } from '@/services/inventoryStore'
import { barcodeDataUrl } from '@/utils/barcode'

export default {
    name: 'ProductsView',
    components: { ProductRegistrationModal, StockOperationForm },
    data() {
        return {
            store: inventoryStore,
            search: '',
            category: '',
            status: '',
            selectedProduct: null,
            detailBarcode: '',
            operation: '',
            editOpen: false,
            filterOpen: false,
            filterDraft: { category: '', status: '' },
        }
    },
    computed: {
        categories() {
            return ['Dairy', 'Dry Goods', 'Packaging', 'Prepared Food']
        },
        activeFilterCount() {
            return Number(Boolean(this.category)) + Number(Boolean(this.status))
        },
        filteredProducts() {
            const search = this.search.toLowerCase()
            return this.store.state.products.filter((product) => {
                const matchesSearch =
                    !search ||
                    [product.name, product.sku, product.bar].some((value) =>
                        String(value).toLowerCase().includes(search),
                    )
                return (
                    matchesSearch &&
                    (!this.category || product.category === this.category) &&
                    (!this.status || this.store.productStatus(product) === this.status)
                )
            })
        },
    },
    methods: {
        statusClass(product) {
            return `status-${this.store.productStatus(product).toLowerCase().replaceAll(' ', '-')}`
        },
        openFilters() {
            this.filterDraft = { category: this.category, status: this.status }
            this.filterOpen = true
        },
        applyFilters() {
            this.category = this.filterDraft.category
            this.status = this.filterDraft.status
            this.filterOpen = false
        },
        clearFilters() {
            this.filterDraft = { category: '', status: '' }
            this.category = ''
            this.status = ''
            this.filterOpen = false
        },
        async openDetails(product) {
            this.selectedProduct = product
            this.detailBarcode = ''
            try {
                this.detailBarcode = barcodeDataUrl(product.bar, {
                    width: 2,
                    height: 68,
                    fontSize: 13,
                })
            } catch (error) {
                this.store.addToast('Unable to generate this barcode.', 'danger')
            }
        },
        closeDetails() {
            if (this.editOpen) return
            this.selectedProduct = null
            this.detailBarcode = ''
            this.operation = ''
        },
        startOperation(direction) {
            this.operation = this.operation === direction ? '' : direction
        },
        completeOperation() {
            this.operation = ''
        },
        handleEdited(product) {
            this.selectedProduct = product
            this.editOpen = false
            this.detailBarcode = barcodeDataUrl(product.bar, {
                width: 2,
                height: 68,
                fontSize: 13,
            })
        },
        printBarcode() {
            if (!this.selectedProduct || !this.detailBarcode) return
            const product = this.selectedProduct
            const safe = (value) =>
                String(value || '')
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
            const printWindow = window.open('', '_blank', 'width=520,height=640')
            if (!printWindow) {
                this.store.addToast('Allow pop-ups to print the barcode label.', 'danger')
                return
            }
            printWindow.document.write(`<!doctype html><html><head><title>${safe(product.name)}</title><style>
                @page{size:60mm 45mm;margin:3mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111}
                .label{width:54mm;height:39mm;border:.0625rem solid #111;padding:3mm;display:grid;grid-template-rows:auto 1fr;gap:2mm}
                .info{display:grid;grid-template-columns:1fr auto;gap:1mm 3mm;align-items:end}.barcode{display:grid;place-items:center}
                img{max-width:48mm;width:100%;height:21mm;object-fit:contain}h1{font-size:11pt;margin:0;line-height:1.15}
                p{font-family:monospace;font-size:8pt;font-weight:700;margin:0}small{display:block;font-size:6.5pt}
            </style></head><body><div class="label"><div class="info"><h1>${safe(product.name)}</h1><p>${safe(product.sku)}</p>
                <small>${safe(product.location || 'No location')}</small></div><div class="barcode"><img src="${this.detailBarcode}" alt=""></div>
            </div><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
            printWindow.document.close()
        },
    },
}
</script>
