<template>
    <main class="canonical-products">
        <header class="cp-heading">
            <div class="page-title-row">
                <button v-if="$route.query.from === 'dashboard'" class="page-back-link" type="button" @click="goBack">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Back</span>
                </button>
                <h1 class="inventory-page-title">Products</h1>
            </div>
        </header>

        <section class="cp-toolbar" aria-label="Product filters">
            <label class="cp-search">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input v-model.trim="search" type="search" placeholder="Search product, code or barcode" />
            </label>
            <button class="button secondary cp-filter-button" type="button" @click="openFilters">
                <i class="fa-solid fa-sliders"></i>
                Filter
                <span v-if="secondaryFilterCount">{{ secondaryFilterCount }}</span>
            </button>
            <button class="button primary cp-register-button" type="button" @click="registerPickerOpen = true">
                <i class="fa-solid fa-plus"></i>
                Register
            </button>
        </section>

        <section class="cp-shell">
            <div class="cp-category-bar">
                <nav
                    ref="categoryScroller"
                    class="cp-categories"
                    aria-label="Product categories"
                    @pointerdown="startCategoryDrag"
                    @pointermove="onCategoryDrag"
                    @pointerup="endCategoryDrag"
                    @pointerleave="endCategoryDrag"
                    @pointercancel="endCategoryDrag"
                >
                    <button type="button" :class="{ active: viewMode === 'products' && category === '' }" @click="selectAllProducts">All</button>
                    <button type="button" :class="{ active: viewMode === 'batches' }" @click="selectBatchView">Batch</button>
                    <button
                        v-for="item in categories"
                        :key="item"
                        type="button"
                        :class="{ active: viewMode === 'products' && category === item }"
                        @click="selectCategory(item)"
                    >
                        {{ item }}
                    </button>
                </nav>
                <button class="cp-category-add" type="button" aria-label="Add product category" @click="openCategoryCreate">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>

            <div v-if="viewMode === 'products'" class="cp-table-scroll">
                <table class="cp-table">
                    <colgroup>
                        <col class="cp-col-product" />
                        <col class="cp-col-code" />
                        <col class="cp-col-warehouse" />
                        <col class="cp-col-location" />
                        <col class="cp-col-stock" />
                        <col class="cp-col-status" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Code</th>
                            <th>Warehouse</th>
                            <th>Location</th>
                            <th class="cp-align-right">Stock</th>
                            <th class="cp-align-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="row in pagedFilteredRows"
                            :key="row.product.id"
                            role="button"
                            tabindex="0"
                            @click="openDetails(row.product)"
                            @keydown.enter="openDetails(row.product)"
                            @keydown.space.prevent="openDetails(row.product)"
                        >
                            <td>
                                <div class="cp-product-cell">
                                    <span class="cp-photo">
                                        <img v-if="row.product.photo" :src="row.product.photo" :alt="row.product.name" />
                                        <template v-else>{{ initials(row.product.name) }}</template>
                                    </span>
                                    <strong>{{ row.product.name }}</strong>
                                </div>
                            </td>
                            <td class="mono">{{ row.product.sku }}</td>
                            <td>{{ row.warehouse }}</td>
                            <td>{{ row.location }}</td>
                            <td class="cp-stock">
                                <strong>{{ formatQuantity(row.stock) }}</strong>
                                <span>{{ row.product.unit }}</span>
                            </td>
                            <td class="cp-status-cell">
                                <span class="status-badge" :class="statusClass(row.status)">{{ row.status }}</span>
                                <i class="fa-solid fa-chevron-right cp-row-chevron" aria-hidden="true"></i>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-else class="cp-table-scroll">
                <table class="cp-table cp-batch-table">
                    <colgroup>
                        <col class="cp-col-batch-code" />
                        <col class="cp-col-batch-product" />
                        <col class="cp-col-batch-parts" />
                        <col class="cp-col-batch-status" />
                        <col class="cp-col-batch-arrow" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Batch</th>
                            <th>Products</th>
                            <th class="cp-align-right">Parts</th>
                            <th class="cp-align-center">Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="row in pagedFilteredBatchRows"
                            :key="row.batch.id"
                            role="button"
                            tabindex="0"
                            @click="openBatchDetails(row.batch)"
                            @keydown.enter="openBatchDetails(row.batch)"
                            @keydown.space.prevent="openBatchDetails(row.batch)"
                        >
                            <td class="mono">{{ row.batch.id }}</td>
                            <td>
                                <div class="cp-batch-cell">
                                    <span class="cp-photo"><i class="fa-solid fa-layer-group"></i></span>
                                    <div class="cp-batch-meta">
                                        <strong>{{ row.primaryProduct }}</strong>
                                        <small>{{ row.productCountLabel }}<template v-if="row.locationLabel !== '—'"> · {{ row.locationLabel }}</template></small>
                                    </div>
                                </div>
                            </td>
                            <td class="cp-stock">
                                <strong>{{ formatQuantity(row.batch.availableQuantity) }}</strong>
                                <span>parts</span>
                            </td>
                            <td class="cp-status-cell cp-status-cell-no-arrow">
                                <span class="status-badge" :class="statusClass(row.status)">{{ row.status }}</span>
                            </td>
                            <td class="cp-open-cell">
                                <i class="fa-solid fa-chevron-right cp-row-chevron" aria-hidden="true"></i>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="viewMode === 'products' && !filteredRows.length" class="cp-empty">
                <i class="fa-solid fa-box-open"></i>
                <strong>No products found</strong>
            </div>
            <div v-else-if="viewMode === 'batches' && !filteredBatchRows.length" class="cp-empty">
                <i class="fa-solid fa-layer-group"></i>
                <strong>No batches found</strong>
            </div>

            <footer v-if="viewMode === 'products' ? filteredRows.length : filteredBatchRows.length" class="cp-pagination">
                <button type="button" class="cp-pagination-nav" aria-label="Previous page" :disabled="activePage <= 1" @click="activePage = activePage - 1">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button
                    v-for="page in activePaginationItems"
                    :key="`product-page-${viewMode}-${page}`"
                    type="button"
                    class="cp-pagination-page"
                    :class="{ active: page === activePage, ellipsis: typeof page !== 'number' }"
                    @click="typeof page === 'number' && (activePage = page)"
                >
                    {{ paginationLabel(page) }}
                </button>
                <button type="button" class="cp-pagination-nav" aria-label="Next page" :disabled="activePage >= activePageCount" @click="activePage = activePage + 1">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </footer>
        </section>

        <ProductDetailsModal
            v-if="selectedProduct"
            :product="selectedProduct"
            @close="closeDetails"
            @edit="editOpen = true"
            @receive="startReceive"
            @updated="refreshSelected"
            @view-product="openBatchProduct"
        />

        <ProductRegistrationModal
            v-if="editOpen && selectedProduct"
            :edit-product="selectedProduct"
            @close="editOpen = false"
            @registered="handleEdited"
        />

        <div v-if="categoryCreateOpen" class="modal-backdrop" @click.self="closeCategoryCreate">
            <section class="form-modal cp-category-modal" role="dialog" aria-modal="true" aria-label="Add product category">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">CATEGORY</span>
                        <h2>Add product category</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeCategoryCreate">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <form class="cp-category-form" @submit.prevent="saveCategory">
                    <label>
                        <span>Category name <b>*</b></span>
                        <input ref="categoryNameInput" v-model.trim="newCategoryName" type="text" maxlength="40" required placeholder="e.g. Beverages" />
                    </label>
                    <p v-if="categoryError" class="form-error"><i class="fa-solid fa-circle-exclamation"></i>{{ categoryError }}</p>
                    <footer>
                        <button class="button secondary" type="button" @click="closeCategoryCreate">Cancel</button>
                        <button class="button primary" type="submit"><i class="fa-solid fa-plus"></i>Add category</button>
                    </footer>
                </form>
            </section>
        </div>

        <NewInventoryItemPicker
            v-if="registerPickerOpen"
            @close="registerPickerOpen = false"
            @product="openRegisterProduct"
            @batch="openRegisterBatch"
        />

        <ProductRegistrationModal
            v-if="registerOpen"
            @close="registerOpen = false"
            @registered="handleRegisteredProduct"
        />

        <BatchDetailsModal
            v-if="selectedBatch"
            :batch="selectedBatch"
            @close="selectedBatch = null"
            @product="openBatchProduct"
            @ship="shipBatch"
        />

        <div v-if="filterOpen" class="modal-backdrop" @click.self="filterOpen = false">
            <section class="form-modal cp-filter-modal">
                <header class="modal-header">
                    <div>
                        <span class="eyebrow">PRODUCTS</span>
                        <h2>Filter</h2>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="filterOpen = false">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <form class="cp-filter-form" @submit.prevent="applyFilters">
                    <label>
                        <span>Warehouse</span>
                        <ScrollableSelect v-model="filterDraft.warehouseId">
                            <option value="">All Warehouses</option>
                            <option v-for="warehouse in activeWarehouses" :key="warehouse.id" :value="warehouse.id">
                                {{ warehouse.name }}
                            </option>
                        </ScrollableSelect>
                    </label>
                    <label>
                        <span>Category</span>
                        <ScrollableSelect v-model="filterDraft.category">
                            <option value="">All Categories</option>
                            <option v-for="item in categories" :key="item">{{ item }}</option>
                        </ScrollableSelect>
                    </label>
                    <label>
                        <span>Status</span>
                        <ScrollableSelect v-model="filterDraft.status">
                            <option value="">All Statuses</option>
                            <option>In Stock</option>
                            <option>Low Stock</option>
                            <option>Out of Stock</option>
                            <option>Inactive</option>
                        </ScrollableSelect>
                    </label>
                    <footer>
                        <button class="button secondary" type="button" @click="clearFilters">Clear</button>
                        <button class="button primary" type="submit">Apply</button>
                    </footer>
                </form>
            </section>
        </div>
    </main>
</template>

<script>
import ProductRegistrationModal from '@/components/product/ProductRegistrationModal.vue'
import ProductDetailsModal from '@/components/product/ProductDetailsModal.vue'
import BatchDetailsModal from '@/components/stock/BatchDetailsModal.vue'
import NewInventoryItemPicker from '@/components/common/NewInventoryItemPicker.vue'
import { inventoryStore } from '@/services/inventoryStore'
import { paginationItems, paginationLabel } from '@/utils/pagination'

export default {
    name: 'ProductsView',
    components: { ProductDetailsModal, ProductRegistrationModal, BatchDetailsModal, NewInventoryItemPicker },
    data() {
        return {
            store: inventoryStore,
            search: '',
            category: '',
            viewMode: 'products',
            status: '',
            warehouseId: '',
            selectedProduct: null,
            selectedBatch: null,
            editOpen: false,
            registerOpen: false,
            registerPickerOpen: false,
            filterOpen: false,
            filterDraft: { warehouseId: '', category: '', status: '' },
            productsPage: 1,
            batchPage: 1,
            categoryDragActive: false,
            categoryDragStartX: 0,
            categoryDragScrollLeft: 0,
            categoryDragMoved: false,
            categoryCreateOpen: false,
            newCategoryName: '',
            categoryError: '',
        }
    },
    computed: {
        categories() {
            return this.store.state.productCategories
        },
        activeWarehouses() {
            return this.store.state.warehouses.filter((warehouse) => warehouse.active)
        },
        secondaryFilterCount() {
            return Number(Boolean(this.warehouseId)) + Number(Boolean(this.category)) + Number(Boolean(this.status))
        },
        productRows() {
            return this.store.state.products.map((product) => {
                const positions = this.store.stockPositionsFor(product.id, {
                    warehouseId: this.warehouseId || undefined,
                    stockSource: 'standalone',
                })
                const allBreakdown = this.store.productStockBreakdown(product.id, { stockSource: 'standalone' })
                const breakdown = this.warehouseId
                    ? allBreakdown.filter((row) => row.warehouseId === this.warehouseId)
                    : allBreakdown
                const stock = this.store.productStock(product.id, {
                    warehouseId: this.warehouseId || undefined,
                    stockSource: 'standalone',
                })
                const warehouses = [...new Set(breakdown.map((row) => row.warehouseName))]
                const locations = [...new Set(
                    positions
                        .filter((position) => Number(position.availableQuantity) > 0)
                        .map((position) => position.location)
                        .filter(Boolean),
                )]
                return {
                    product,
                    positions,
                    stock,
                    warehouse: this.summaryLabel(
                        warehouses,
                        this.warehouseId ? 'No stock' : '—',
                        'warehouses',
                    ),
                    location: this.summaryLabel(locations, '—', 'locations'),
                    status: this.inventoryStatus(product, stock),
                }
            })
        },
        filteredRows() {
            const term = this.search.toLowerCase()
            return this.productRows.filter((row) => {
                const product = row.product
                const matchesSearch =
                    !term ||
                    [product.name, product.sku, product.bar].some((value) =>
                        String(value || '').toLowerCase().includes(term),
                    )
                const matchesActiveInventory = this.status === 'Inactive'
                    ? !product.active
                    : product.active
                return (
                    matchesSearch &&
                    matchesActiveInventory &&
                    (!this.category || product.category === this.category) &&
                    (!this.status || row.status === this.status) &&
                    (!this.warehouseId || row.positions.length > 0)
                )
            })
        },
        productPageCount() {
            return Math.max(1, Math.ceil(this.filteredRows.length / 5))
        },
        pagedFilteredRows() {
            const start = (this.productsPage - 1) * 5
            return this.filteredRows.slice(start, start + 5)
        },
        batchRows() {
            return this.store.batchGroups({ availableOnly: false }).map((batch) => {
                const locationNames = [...new Set(batch.locations.map((location) => location.locationName).filter(Boolean))]
                const warehouseIds = [...new Set(batch.locations.map((location) => location.warehouseId).filter(Boolean))]
                const primaryProduct = batch.items[0]?.productName || batch.name || batch.id
                const statuses = batch.items
                    .map((item) => this.store.productStatus(this.store.findProduct(item.productId)))
                    .filter(Boolean)
                return {
                    batch,
                    primaryProduct,
                    productCountLabel: `${batch.productCount} ${batch.productCount === 1 ? 'product' : 'products'}`,
                    locationLabel: locationNames.length ? locationNames.join(', ') : '—',
                    warehouseIds,
                    status: batch.availableQuantity <= 0 ? 'Out of Stock' : statuses.includes('Low Stock') ? 'Low Stock' : 'In Stock',
                }
            })
        },
        filteredBatchRows() {
            const term = this.search.toLowerCase()
            return this.batchRows.filter((row) => {
                const matchesSearch =
                    !term ||
                    [
                        row.batch.id,
                        row.batch.name,
                        row.primaryProduct,
                        row.locationLabel,
                        ...(row.batch.items || []).map((item) => item.sku),
                        ...(row.batch.items || []).map((item) => item.productName),
                    ].some((value) => String(value || '').toLowerCase().includes(term))
                const matchesWarehouse = !this.warehouseId || row.warehouseIds.includes(this.warehouseId)
                const matchesStatus = !this.status || row.status === this.status
                return matchesSearch && matchesWarehouse && matchesStatus
            })
        },
        batchPageCount() {
            return Math.max(1, Math.ceil(this.filteredBatchRows.length / 5))
        },
        pagedFilteredBatchRows() {
            const start = (this.batchPage - 1) * 5
            return this.filteredBatchRows.slice(start, start + 5)
        },
        activePage: {
            get() {
                return this.viewMode === 'products' ? this.productsPage : this.batchPage
            },
            set(value) {
                const page = Math.max(1, Number(value) || 1)
                if (this.viewMode === 'products') this.productsPage = Math.min(page, this.productPageCount)
                else this.batchPage = Math.min(page, this.batchPageCount)
            },
        },
        activePageCount() {
            return this.viewMode === 'products' ? this.productPageCount : this.batchPageCount
        },
        activePaginationItems() {
            return paginationItems(this.activePage, this.activePageCount)
        },
    },
    watch: {
        search() { this.productsPage = 1; this.batchPage = 1 },
        category() { this.productsPage = 1 },
        status() { this.productsPage = 1; this.batchPage = 1 },
        warehouseId() { this.productsPage = 1; this.batchPage = 1 },
        viewMode() {
            if (this.productsPage > this.productPageCount) this.productsPage = this.productPageCount
            if (this.batchPage > this.batchPageCount) this.batchPage = this.batchPageCount
        },
        filteredRows() { if (this.productsPage > this.productPageCount) this.productsPage = this.productPageCount },
        filteredBatchRows() { if (this.batchPage > this.batchPageCount) this.batchPage = this.batchPageCount },
    },
    methods: {
        paginationLabel,
        initials(name) {
            return String(name || '').slice(0, 2).toUpperCase()
        },
        formatQuantity(value) {
            return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(Number(value) || 0)
        },
        summaryLabel(values, empty, plural) {
            if (!values.length) return empty
            if (values.length === 1) return values[0]
            return `${values.length} ${plural}`
        },
        inventoryStatus(product, stock) {
            if (!product.active) return 'Inactive'
            if (Number(stock) <= 0) return 'Out of Stock'
            if (Number(stock) <= Number(product.minimumStock || 0)) return 'Low Stock'
            return 'In Stock'
        },
        statusClass(status) {
            return `status-${status.toLowerCase().replaceAll(' ', '-')}`
        },
        selectAllProducts() {
            this.viewMode = 'products'
            this.category = ''
            this.productsPage = 1
        },
        selectBatchView() {
            this.viewMode = 'batches'
            this.selectedProduct = null
            this.batchPage = 1
        },
        selectCategory(item) {
            this.viewMode = 'products'
            this.category = item
            this.productsPage = 1
        },
        openCategoryCreate() {
            if (this.categoryDragMoved) return
            this.newCategoryName = ''
            this.categoryError = ''
            this.categoryCreateOpen = true
            this.$nextTick(() => this.$refs.categoryNameInput?.focus())
        },
        closeCategoryCreate() {
            this.categoryCreateOpen = false
            this.newCategoryName = ''
            this.categoryError = ''
        },
        saveCategory() {
            try {
                const category = this.store.addProductCategory(this.newCategoryName)
                this.closeCategoryCreate()
                this.$nextTick(() => {
                    const scroller = this.$refs.categoryScroller
                    if (scroller) scroller.scrollTo({ left: scroller.scrollWidth, behavior: 'smooth' })
                })
                this.store.addToast(`${category} ${this.$t('category added.')}`)
            } catch (error) {
                this.categoryError = error.message
            }
        },
        openRegisterProduct() {
            this.registerPickerOpen = false
            this.registerOpen = true
        },
        openRegisterBatch() {
            this.registerPickerOpen = false
            this.$router.push({ name: 'receive', query: { registerBatch: '1', source: 'products' } })
        },
        handleRegisteredProduct(product) {
            this.registerOpen = false
            this.viewMode = 'products'
            this.category = ''
            this.productsPage = 1
            this.selectedProduct = product
        },
        openFilters() {
            this.filterDraft = { warehouseId: this.warehouseId, category: this.category, status: this.status }
            this.filterOpen = true
        },
        applyFilters() {
            this.warehouseId = this.filterDraft.warehouseId
            this.category = this.filterDraft.category
            this.status = this.filterDraft.status
            this.filterOpen = false
        },
        clearFilters() {
            this.warehouseId = ''
            this.category = ''
            this.status = ''
            this.filterDraft = { warehouseId: '', category: '', status: '' }
            this.filterOpen = false
        },
        goBack() {
            this.$router.push({ name: 'dashboard' })
        },
        startCategoryDrag(event) {
            const scroller = this.$refs.categoryScroller
            if (!scroller) return
            this.categoryDragActive = true
            this.categoryDragMoved = false
            this.categoryDragStartX = event.clientX
            this.categoryDragScrollLeft = scroller.scrollLeft
            scroller.setPointerCapture?.(event.pointerId)
        },
        onCategoryDrag(event) {
            if (!this.categoryDragActive) return
            const scroller = this.$refs.categoryScroller
            if (!scroller) return
            const delta = event.clientX - this.categoryDragStartX
            if (Math.abs(delta) > 6) this.categoryDragMoved = true
            scroller.scrollLeft = this.categoryDragScrollLeft - delta
        },
        endCategoryDrag(event) {
            if (!this.categoryDragActive) return
            const scroller = this.$refs.categoryScroller
            this.categoryDragActive = false
            window.setTimeout(() => { this.categoryDragMoved = false }, 0)
            scroller?.releasePointerCapture?.(event.pointerId)
        },
        openDetails(product) {
            this.selectedProduct = product
        },
        openBatchProduct(productId) {
            this.selectedBatch = null
            this.viewMode = 'products'
            this.selectedProduct = this.store.findProduct(productId) || this.selectedProduct
        },
        openBatchDetails(batch) {
            this.selectedBatch = batch
        },
        shipBatch(batchOrId) {
            const batchId = typeof batchOrId === 'object' ? batchOrId?.id : batchOrId
            this.selectedBatch = null
            this.$router.push({ name: 'dispatch', query: { mode: 'ship', source: 'batch', batch: batchId } })
        },
        closeDetails() {
            if (!this.editOpen) this.selectedProduct = null
            if (this.$route.query.from === 'warehouses') {
                const warehouseId = String(this.$route.query.warehouse || this.warehouseId || '')
                const locationId = String(this.$route.query.location || '')
                if (warehouseId) localStorage.setItem('ims_selected_warehouse', warehouseId)
                this.$router.replace({
                    name: 'warehouses',
                    query: {
                        warehouse: warehouseId || undefined,
                        location: locationId || undefined,
                    },
                })
                return
            }
            if (this.$route.query.open === '1' || this.$route.query.product) {
                this.$router.replace({ name: 'products', query: { warehouse: this.warehouseId || undefined } })
            }
        },
        refreshSelected() {
            this.selectedProduct = this.store.findProduct(this.selectedProduct?.id) || null
        },
        handleEdited(product) {
            this.selectedProduct = product
            this.editOpen = false
        },
        startReceive(product) {
            this.$router.push({
                name: 'receive',
                query: { product: product.id, source: 'products', choose: '1' },
            })
        },
    },
    created() {
        this.warehouseId = String(this.$route.query.warehouse || '')
        if (this.$route.query.tab === 'batch') this.viewMode = 'batches'
        if (this.$route.query.open === '1') {
            const product = this.store.findProduct(this.$route.query.product)
            if (product) {
                this.selectedProduct = product
                return
            }
            const batch = this.store.findBatch(this.$route.query.batch)
            if (batch) {
                this.viewMode = 'batches'
                this.selectedBatch = batch
            }
        }
    },
}
</script>

<style scoped src="@/assets/css/pages/products.css"></style>
