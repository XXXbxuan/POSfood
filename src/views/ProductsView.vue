<template>
    <div class="page-stack products-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">PRODUCT MANAGEMENT</span>
                <h1>Products</h1>
                <p>Tap any product to see its details.</p>
            </div>
            <button class="button primary" type="button" @click="registerOpen = true">
                <i class="fa-solid fa-plus"></i>Register Product
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
                <table class="inventory-table products-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Type</th>
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
                                    <span>{{ product.name.slice(0, 2).toUpperCase() }}</span>
                                    <div><strong>{{ product.name }}</strong><small class="mono">{{ product.sku }} &middot; {{ product.barcode }}</small></div>
                                </div>
                            </td>
                            <td><span>{{ product.type }}</span><small>{{ product.category }}</small></td>
                            <td><span>{{ product.location || 'Not assigned' }}</span><small>{{ product.supplier || 'No supplier' }}</small></td>
                            <td><strong class="table-stock">{{ product.currentStock }}</strong> <small>{{ product.unit }}</small><small>Min. {{ product.minimumStock }}</small></td>
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

        <ProductRegistrationModal
            v-if="registerOpen"
            @close="registerOpen = false"
            @registered="handleRegistered"
        />

        <div v-if="selectedProduct" class="modal-backdrop" @click.self="closeDetails">
            <section class="form-modal product-details-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">PRODUCT DETAILS</span>
                        <h2>{{ selectedProduct.name }}</h2>
                        <p class="mono">{{ selectedProduct.sku }}</p>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeDetails">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="product-details-body">
                    <section class="product-details-identity">
                        <div class="product-details-qr">
                            <img v-if="detailQr" :src="detailQr" :alt="`${selectedProduct.name} QR code`" />
                            <i v-else class="fa-solid fa-qrcode"></i>
                        </div>
                        <div>
                            <span class="status-badge" :class="statusClass(selectedProduct)">{{ store.productStatus(selectedProduct) }}</span>
                            <h3>{{ selectedProduct.name }}</h3>
                            <p class="mono">{{ selectedProduct.barcode }}</p>
                        </div>
                        <div class="details-stock">
                            <small>Current Stock</small>
                            <strong>{{ selectedProduct.currentStock }}</strong>
                            <span>{{ selectedProduct.unit }}</span>
                        </div>
                    </section>
                    <dl class="product-details-grid">
                        <div><dt>Category</dt><dd>{{ selectedProduct.category }}</dd></div>
                        <div><dt>Type</dt><dd>{{ selectedProduct.type }}</dd></div>
                        <div><dt>Location</dt><dd>{{ selectedProduct.location || 'Not assigned' }}</dd></div>
                        <div><dt>Minimum Stock</dt><dd>{{ selectedProduct.minimumStock }} {{ selectedProduct.unit }}</dd></div>
                        <div><dt>Supplier</dt><dd>{{ selectedProduct.supplier || 'Not assigned' }}</dd></div>
                        <div><dt>Batches</dt><dd>{{ selectedProduct.batches.length }}</dd></div>
                    </dl>
                </div>
                <footer class="product-details-actions">
                    <button class="button secondary" type="button" @click="printQr"><i class="fa-solid fa-print"></i>Print QR</button>
                    <span></span>
                    <button class="button stock-in" type="button" @click="startOperation('in')"><i class="fa-solid fa-arrow-down"></i>Stock In</button>
                    <button class="button stock-out" type="button" @click="startOperation('out')"><i class="fa-solid fa-arrow-up"></i>Stock Out</button>
                </footer>
            </section>
        </div>

        <StockOperationModal
            v-if="operation"
            :product="operationProduct"
            :direction="operation"
            @close="operation = ''"
            @completed="completeOperation"
        />
    </div>
</template>

<script>
import QRCode from 'qrcode'
import ProductRegistrationModal from '@/components/ProductRegistrationModal.vue'
import StockOperationModal from '@/components/StockOperationModal.vue'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'ProductsView',
    components: { ProductRegistrationModal, StockOperationModal },
    data() {
        return {
            store: inventoryStore,
            search: '',
            category: '',
            status: '',
            registerOpen: false,
            selectedProduct: null,
            detailQr: '',
            operation: '',
            operationProduct: null,
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
    },
    methods: {
        statusClass(product) {
            return `status-${this.store.productStatus(product).toLowerCase().replaceAll(' ', '-')}`
        },
        handleRegistered() {
            this.search = ''
            this.category = ''
            this.status = ''
        },
        async openDetails(product) {
            this.selectedProduct = product
            this.detailQr = ''
            try {
                this.detailQr = await QRCode.toDataURL(product.qrCode, {
                    width: 240,
                    margin: 1,
                    errorCorrectionLevel: 'M',
                })
            } catch (error) {
                this.store.addToast('Unable to generate this QR code.', 'danger')
            }
        },
        closeDetails() {
            this.selectedProduct = null
            this.detailQr = ''
        },
        startOperation(direction) {
            this.operationProduct = this.selectedProduct
            this.operation = direction
            this.closeDetails()
        },
        completeOperation() {
            this.operation = ''
            this.operationProduct = null
        },
        printQr() {
            if (!this.selectedProduct || !this.detailQr) return
            const product = this.selectedProduct
            const safe = (value) =>
                String(value || '')
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
            const printWindow = window.open('', '_blank', 'width=520,height=640')
            if (!printWindow) {
                this.store.addToast('Allow pop-ups to print the QR label.', 'danger')
                return
            }
            printWindow.document.write(`<!doctype html><html><head><title>${safe(product.name)}</title><style>
                @page{size:60mm 45mm;margin:3mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111}
                .label{width:54mm;height:39mm;border:1px solid #111;padding:3mm;display:grid;grid-template-columns:24mm 1fr;gap:3mm;align-items:center}
                img{width:24mm;height:24mm}.info{min-width:0}h1{font-size:11pt;margin:0 0 2mm;line-height:1.15}
                p{font-family:monospace;font-size:8pt;font-weight:700;margin:1mm 0;overflow-wrap:anywhere}small{display:block;font-size:6.5pt;margin-top:1mm}
            </style></head><body><div class="label"><img src="${this.detailQr}" alt=""><div class="info">
                <h1>${safe(product.name)}</h1><p>${safe(product.sku)}</p>
                <small>${safe(product.barcode)}</small><small>${safe(product.location || 'No location')}</small>
            </div></div><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
            printWindow.document.close()
        },
    },
}
</script>
