<template>
    <div class="dashboard-page">
        <section class="page-heading dashboard-heading">
            <div><h1 class="inventory-page-title">Inventory Reports</h1></div>
            <div class="report-mode-switch" role="tablist" aria-label="Report mode">
                <button
                    type="button"
                    role="tab"
                    :aria-selected="reportMode === 'data'"
                    :class="{ active: reportMode === 'data' }"
                    @click="reportMode = 'data'"
                >
                    <i class="fa-solid fa-table-list"></i><span>Complete Data</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    :aria-selected="reportMode === 'charts'"
                    :class="{ active: reportMode === 'charts' }"
                    @click="reportMode = 'charts'"
                >
                    <i class="fa-solid fa-chart-column"></i><span>Visual Charts</span>
                </button>
            </div>
        </section>

        <section v-if="reportMode === 'data'" class="report-data-view" role="tabpanel">
            <section class="metric-grid">
                <button type="button" class="metric-card" :class="{ active: selectedMetric === 'products' }" :aria-pressed="selectedMetric === 'products'" @click="selectedMetric = 'products'">
                    <span class="metric-icon blue"><i class="fa-solid fa-box"></i></span>
                    <div><small>Total Products</small><strong>{{ stats.totalProducts }}</strong></div>
                </button>
                <button type="button" class="metric-card" :class="{ active: selectedMetric === 'stock' }" :aria-pressed="selectedMetric === 'stock'" @click="selectedMetric = 'stock'">
                    <span class="metric-icon charcoal"><i class="fa-solid fa-boxes-stacked"></i></span>
                    <div><small>Total Stock</small><strong>{{ compact(stats.totalQuantity) }}</strong></div>
                </button>
                <button type="button" class="metric-card" :class="{ active: selectedMetric === 'low' }" :aria-pressed="selectedMetric === 'low'" @click="selectedMetric = 'low'">
                    <span class="metric-icon amber"><i class="fa-solid fa-triangle-exclamation"></i></span>
                    <div><small>Low Stock</small><strong>{{ stats.lowStock.length }}</strong></div>
                </button>
                <button type="button" class="metric-card" :class="{ active: selectedMetric === 'out' }" :aria-pressed="selectedMetric === 'out'" @click="selectedMetric = 'out'">
                    <span class="metric-icon red"><i class="fa-solid fa-circle-xmark"></i></span>
                    <div><small>Out of Stock</small><strong>{{ stats.outOfStock.length }}</strong></div>
                </button>
            </section>

            <section class="dashboard-grid" :class="{ 'activity-collapsed': !activityOpen }">
                <article class="panel dashboard-list-panel stock-alert-panel">
                    <header class="panel-header"><h2>{{ metricTitle }}</h2></header>
                    <div class="dashboard-scroll dashboard-product-table-scroll">
                        <table class="dashboard-product-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Product code</th>
                                    <th>Location</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="product in metricProducts"
                                    :key="product.id"
                                    role="button"
                                    tabindex="0"
                                    @click="openProduct(product)"
                                    @keydown.enter="openProduct(product)"
                                    @keydown.space.prevent="openProduct(product)"
                                >
                                    <td>
                                        <span class="dashboard-product-identity">
                                            <span class="product-symbol">{{ product.name.slice(0, 2).toUpperCase() }}</span>
                                            <strong>{{ product.name }}</strong>
                                        </span>
                                    </td>
                                    <td class="mono">{{ product.sku }}</td>
                                    <td class="mono">{{ locationLabel(product) }}</td>
                                    <td><strong>{{ stock(product) }}</strong> <small>{{ product.unit }}</small></td>
                                    <td><span class="status-badge" :class="statusClass(product)">{{ store.productStatus(product) }}</span></td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="!metricProducts.length" class="empty-state compact">
                            <i class="fa-solid fa-circle-check"></i><strong>No products in this view</strong>
                        </div>
                    </div>
                    <footer class="dashboard-panel-footer">
                        <div class="today-in"><strong><span>Today In</span>+{{ stats.todayIn }}</strong></div>
                        <div class="today-out"><strong><span>Today Out</span>-{{ stats.todayOut }}</strong></div>
                    </footer>
                </article>

                <div class="activity-divider-rail" :class="{ collapsed: !activityOpen }">
                    <button class="activity-divider-toggle" type="button" :aria-label="activityOpen ? 'Collapse recent activity' : 'Open recent activity'" @click="activityOpen = !activityOpen">
                        <i class="fa-solid" :class="activityOpen ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
                    </button>
                </div>

                <article class="panel dashboard-list-panel activity-panel" :class="{ collapsed: !activityOpen }">
                    <header class="panel-header">
                        <h2 v-if="activityOpen">Recent activity</h2>
                        <span v-if="activityOpen" class="dashboard-list-count">{{ store.state.movements.length }} records</span>
                    </header>
                    <div v-if="activityOpen" class="dashboard-scroll activity-list">
                        <button
                            v-for="movement in store.state.movements"
                            :key="movement.id"
                            type="button"
                            @click="openProduct(store.findProduct(movement.productId))"
                        >
                            <span :class="movementTone(movement)">
                                <i class="fa-solid" :class="movementIcon(movement)"></i>
                            </span>
                            <strong>{{ movement.productName }}</strong>
                            <span class="activity-quantity" :class="movementQuantityClass(movement)">
                                {{ movementQuantityLabel(movement) }}
                            </span>
                            <i class="fa-solid fa-chevron-right activity-row-chevron"></i>
                        </button>
                    </div>
                    <footer v-if="activityOpen" class="dashboard-panel-footer">
                        <div><small>Expiring Soon</small><strong class="expiry-value">{{ stats.expiring.length }}</strong></div>
                        <div><small>Stock Value</small><strong class="primary-value">RM {{ money(stats.stockValue) }}</strong></div>
                    </footer>
                </article>
            </section>
        </section>

        <section v-else class="report-chart-grid" role="tabpanel" aria-label="Visual inventory charts">
            <article class="panel report-chart-card" role="button" tabindex="0" @click="openChartModal('category')" @keydown.enter.prevent="openChartModal('category')" @keydown.space.prevent="openChartModal('category')">
                <header>
                    <span class="report-chart-heading"><i class="fa-solid fa-table-cells-large"></i><h2>Products by category</h2></span>
                    <strong>{{ stats.totalProducts }}</strong>
                </header>
                <canvas ref="categoryChart" role="img" aria-label="Horizontal bar chart showing product count by category"></canvas>
            </article>

            <article class="panel report-chart-card" role="button" tabindex="0" @click="openChartModal('warehouseValue')" @keydown.enter.prevent="openChartModal('warehouseValue')" @keydown.space.prevent="openChartModal('warehouseValue')">
                <header>
                    <span class="report-chart-heading"><i class="fa-solid fa-warehouse"></i><h2>Inventory value by warehouse</h2></span>
                    <strong>RM {{ money(warehouseInventoryValue) }}</strong>
                </header>
                <canvas ref="warehouseValueChart" role="img" aria-label="Horizontal bar chart showing inventory value by warehouse"></canvas>
            </article>

            <article class="panel report-chart-card" role="button" tabindex="0" @click="openChartModal('status')" @keydown.enter.prevent="openChartModal('status')" @keydown.space.prevent="openChartModal('status')">
                <header>
                    <span class="report-chart-heading"><i class="fa-solid fa-chart-pie"></i><h2>Product stock status</h2></span>
                    <strong>{{ stats.totalProducts }}</strong>
                </header>
                <div class="chart-with-legend">
                    <canvas ref="statusChart" role="img" aria-label="Donut chart showing in stock, low stock and out of stock products"></canvas>
                    <ul class="chart-legend">
                        <li v-for="item in stockHealthData" :key="item.label">
                            <i class="fa-solid fa-circle" :style="{ color: item.color }"></i>
                            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
                        </li>
                    </ul>
                </div>
            </article>

            <article class="panel report-chart-card" role="button" tabindex="0" @click="openChartModal('topValue')" @keydown.enter.prevent="openChartModal('topValue')" @keydown.space.prevent="openChartModal('topValue')">
                <header>
                    <span class="report-chart-heading"><i class="fa-solid fa-coins"></i><h2>Top products by stock value</h2></span>
                    <strong>RM {{ money(stats.stockValue) }}</strong>
                </header>
                <canvas ref="topValueChart" role="img" aria-label="Horizontal bar chart showing products with the highest stock value"></canvas>
            </article>

            <article class="panel report-chart-card" role="button" tabindex="0" @click="openChartModal('movement')" @keydown.enter.prevent="openChartModal('movement')" @keydown.space.prevent="openChartModal('movement')">
                <header>
                    <span class="report-chart-heading"><i class="fa-solid fa-right-left"></i><h2>Movement records by day</h2></span>
                    <strong>{{ movementRecordTotal }}</strong>
                </header>
                <div class="chart-with-legend chart-with-legend-wide">
                    <canvas ref="movementChart" role="img" aria-label="Multi-line chart showing daily stock in, stock out and transfer records"></canvas>
                    <ul class="chart-legend">
                        <li v-for="item in movementLegend" :key="item.label">
                            <i class="fa-solid fa-circle" :style="{ color: item.color }"></i>
                            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
                        </li>
                    </ul>
                </div>
            </article>

            <article class="panel report-chart-card" role="button" tabindex="0" @click="openChartModal('accuracy')" @keydown.enter.prevent="openChartModal('accuracy')" @keydown.space.prevent="openChartModal('accuracy')">
                <header>
                    <span class="report-chart-heading"><i class="fa-solid fa-list-check"></i><h2>Stock-count accuracy</h2></span>
                    <strong>{{ stockCountAccuracyPercent }}%</strong>
                </header>
                <div class="chart-with-legend chart-with-legend-wide">
                    <canvas ref="accuracyChart" role="img" aria-label="Stacked horizontal bar showing matched, extra and missing stock"></canvas>
                    <ul class="chart-legend">
                        <li v-for="item in stockCountAccuracyData" :key="item.label">
                            <i class="fa-solid fa-circle" :style="{ color: item.color }"></i>
                            <span>{{ item.label }}</span><strong>{{ compact(item.value) }}</strong>
                        </li>
                    </ul>
                </div>
            </article>
        </section>



        <div v-if="chartModal.open" class="modal-backdrop" @click.self="closeChartModal">
            <section class="form-modal report-chart-modal" role="dialog" aria-modal="true" :aria-label="chartModal.title">
                <header class="modal-header report-chart-modal-header">
                    <div>
                        <span class="eyebrow">VISUAL CHART</span>
                        <h2>{{ chartModal.title }}</h2>
                    </div>
                    <div class="report-chart-modal-tools">
                        <button class="icon-button" type="button" aria-label="Print chart" @click="printChartModal">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        <button class="icon-button" type="button" aria-label="Close chart" @click="closeChartModal">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </header>
                <div class="report-chart-modal-body" :class="{ 'has-legend': chartModalLegend.length }">
                    <img :src="chartModal.image" :alt="chartModal.title" />
                    <ul v-if="chartModalLegend.length" class="chart-legend report-chart-modal-legend">
                        <li v-for="item in chartModalLegend" :key="`modal-${item.label}`">
                            <i class="fa-solid fa-circle" :style="{ color: item.color }"></i>
                            <span>{{ item.label }}</span>
                            <strong>{{ item.displayValue || compact(item.value) }}</strong>
                        </li>
                    </ul>
                </div>
            </section>
        </div>

        <ProductDetailsModal
            v-if="selectedProduct"
            :product="selectedProduct"
            @close="selectedProduct = null"
            @edit="editOpen = true"
            @receive="startReceive"
            @view-product="openBatchProduct"
        />

        <ProductRegistrationModal
            v-if="editOpen && selectedProduct"
            :edit-product="selectedProduct"
            @close="editOpen = false"
            @registered="editOpen = false"
        />
    </div>
</template>

<script>
import ProductRegistrationModal from '@/components/product/ProductRegistrationModal.vue'
import ProductDetailsModal from '@/components/product/ProductDetailsModal.vue'
import { inventoryStore } from '@/services/inventoryStore'

const CHART_COLORS = Object.freeze({
    teal: '#0c9f98',
    navy: '#17353a',
    green: '#159467',
    amber: '#c88719',
    coral: '#eb5a55',
    blue: '#2389aa',
    muted: '#7a9096',
    grid: '#dbe7e5',
})

export default {
    name: 'DashboardView',
    components: { ProductDetailsModal, ProductRegistrationModal },
    data() {
        return {
            store: inventoryStore,
            selectedProduct: null,
            selectedMetric: 'products',
            editOpen: false,
            activityOpen: true,
            reportMode: 'data',
            chartModal: {
                open: false,
                type: '',
                title: '',
                image: '',
            },
        }
    },
    computed: {
        stats() { return this.store.dashboardStats() },
        activeProducts() { return this.store.state.products.filter((product) => product.active) },
        metricProducts() {
            if (this.selectedMetric === 'stock') {
                return this.activeProducts
                    .filter((product) => this.stock(product) > 0)
                    .sort((a, b) => this.stock(b) - this.stock(a))
            }
            if (this.selectedMetric === 'low') return this.stats.lowStock
            if (this.selectedMetric === 'out') return this.stats.outOfStock
            return this.activeProducts
        },
        metricTitle() {
            if (this.selectedMetric === 'stock') return 'Products with stock'
            if (this.selectedMetric === 'low') return 'Needs reorder'
            if (this.selectedMetric === 'out') return 'Unavailable products'
            return 'All products'
        },
        categoryChartData() {
            const totals = new Map()
            this.activeProducts.forEach((product) => {
                const category = product.category || 'Other'
                totals.set(category, (totals.get(category) || 0) + 1)
            })
            return [...totals.entries()]
                .map(([label, value]) => ({ label, value }))
                .sort((left, right) => right.value - left.value)
                .slice(0, 6)
        },
        warehouseValueChartData() {
            const activeProductIds = new Set(this.activeProducts.map((product) => product.id))
            const productMap = new Map(this.activeProducts.map((product) => [product.id, product]))
            const totals = new Map()
            this.store.state.stockPositions
                .filter((position) => activeProductIds.has(position.productId) && Number(position.availableQuantity) > 0)
                .forEach((position) => {
                    const product = productMap.get(position.productId)
                    const warehouse = this.store.findWarehouse(position.warehouseId)
                    const label = warehouse?.name || position.warehouseName || 'Unassigned'
                    const value = Number(position.availableQuantity || 0) * Number(product?.costPrice || 0)
                    totals.set(label, (totals.get(label) || 0) + value)
                })
            return [...totals.entries()]
                .map(([label, value]) => ({ label, value }))
                .sort((left, right) => right.value - left.value)
                .slice(0, 6)
        },
        warehouseInventoryValue() {
            const activeProductIds = new Set(this.activeProducts.map((product) => product.id))
            const productMap = new Map(this.activeProducts.map((product) => [product.id, product]))
            return this.store.state.stockPositions
                .filter((position) => activeProductIds.has(position.productId) && Number(position.availableQuantity) > 0)
                .reduce((sum, position) => {
                    const product = productMap.get(position.productId)
                    return sum + Number(position.availableQuantity || 0) * Number(product?.costPrice || 0)
                }, 0)
        },
        topProductValueData() {
            return this.activeProducts
                .map((product) => ({
                    label: product.name,
                    value: this.stock(product) * Number(product.costPrice || 0),
                }))
                .filter((item) => item.value > 0)
                .sort((left, right) => right.value - left.value)
                .slice(0, 6)
        },
        stockHealthData() {
            const outIds = new Set(this.stats.outOfStock.map((product) => product.id))
            const lowIds = new Set(this.stats.lowStock.map((product) => product.id))
            const inStock = this.activeProducts.filter((product) => !outIds.has(product.id) && !lowIds.has(product.id)).length
            return [
                { label: 'In Stock', value: inStock, color: CHART_COLORS.green },
                { label: 'Low Stock', value: this.stats.lowStock.length, color: CHART_COLORS.amber },
                { label: 'Out of Stock', value: this.stats.outOfStock.length, color: CHART_COLORS.coral },
            ]
        },
        movementDailyData() {
            const dated = this.store.state.movements
                .map((movement) => ({ ...movement, date: new Date(movement.createdAt) }))
                .filter((movement) => !Number.isNaN(movement.date.getTime()))
            const end = dated.length
                ? new Date(Math.max(...dated.map((movement) => movement.date.getTime())))
                : new Date()
            end.setUTCHours(0, 0, 0, 0)
            return Array.from({ length: 7 }, (_, index) => {
                const day = new Date(end)
                day.setUTCDate(end.getUTCDate() - (6 - index))
                const key = day.toISOString().slice(0, 10)
                const row = {
                    label: new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short' }).format(day),
                    stockIn: 0,
                    stockOut: 0,
                    transfer: 0,
                }
                dated
                    .filter((movement) => movement.createdAt.slice(0, 10) === key)
                    .forEach((movement) => {
                        if (this.store.isTransferMovement(movement)) row.transfer += 1
                        else if (Number(movement.changedQuantity) > 0) row.stockIn += 1
                        else if (Number(movement.changedQuantity) < 0) row.stockOut += 1
                    })
                return row
            })
        },
        movementLegend() {
            return [
                {
                    label: 'Stock In',
                    value: this.movementDailyData.reduce((sum, item) => sum + item.stockIn, 0),
                    color: CHART_COLORS.green,
                    key: 'stockIn',
                },
                {
                    label: 'Stock Out',
                    value: this.movementDailyData.reduce((sum, item) => sum + item.stockOut, 0),
                    color: CHART_COLORS.coral,
                    key: 'stockOut',
                },
                {
                    label: 'Stock Movement',
                    value: this.movementDailyData.reduce((sum, item) => sum + item.transfer, 0),
                    color: CHART_COLORS.blue,
                    key: 'transfer',
                },
            ]
        },
        movementRecordTotal() {
            return this.movementLegend.reduce((sum, item) => sum + item.value, 0)
        },
        stockCountAccuracyData() {
            const activeProductIds = new Set(this.activeProducts.map((product) => product.id))
            const productMap = new Map(this.activeProducts.map((product) => [product.id, product]))
            const positions = this.store.state.stockPositions.filter((position) => activeProductIds.has(position.productId))
            const availableUnitsByPosition = new Map()
            this.store.state.stockUnits
                .filter((unit) => unit.status === 'available' && activeProductIds.has(unit.productId))
                .forEach((unit) => {
                    if (!unit.positionId) return
                    availableUnitsByPosition.set(unit.positionId, (availableUnitsByPosition.get(unit.positionId) || 0) + 1)
                })

            let matched = 0
            let extra = 0
            let missing = 0
            const knownPositionIds = new Set(positions.map((position) => position.id))
            positions.forEach((position) => {
                const expected = Math.max(0, Number(position.availableQuantity || 0))
                const product = productMap.get(position.productId)
                if (product?.trackingMode !== 'unit') {
                    matched += expected
                    return
                }
                const actual = availableUnitsByPosition.get(position.id) || 0
                matched += Math.min(expected, actual)
                if (actual > expected) extra += actual - expected
                if (expected > actual) missing += expected - actual
            })
            this.store.state.stockUnits
                .filter((unit) => unit.status === 'available' && activeProductIds.has(unit.productId) && !knownPositionIds.has(unit.positionId))
                .forEach(() => { extra += 1 })

            return [
                { label: 'Matched', value: matched, color: CHART_COLORS.green },
                { label: 'Extra Stock', value: extra, color: CHART_COLORS.blue },
                { label: 'Missing Stock', value: missing, color: CHART_COLORS.coral },
            ]
        },
        stockCountAccuracyPercent() {
            const matched = this.stockCountAccuracyData[0]?.value || 0
            const total = this.stockCountAccuracyData.reduce((sum, item) => sum + item.value, 0)
            return total > 0 ? Math.round((matched / total) * 1000) / 10 : 100
        },
        chartModalLegend() {
            if (this.chartModal.type === 'status') return this.stockHealthData
            if (this.chartModal.type === 'movement') return this.movementLegend
            if (this.chartModal.type === 'accuracy') return this.stockCountAccuracyData
            return []
        },
        chartSignature() {
            return JSON.stringify([
                this.categoryChartData,
                this.warehouseValueChartData,
                this.stockHealthData,
                this.topProductValueData,
                this.movementDailyData,
                this.stockCountAccuracyData,
            ])
        },

    },
    watch: {
        reportMode(value) { if (value === 'charts') this.$nextTick(this.renderCharts) },
        chartSignature() { if (this.reportMode === 'charts') this.$nextTick(this.renderCharts) },
    },
    mounted() { window.addEventListener('resize', this.renderCharts) },
    beforeUnmount() { window.removeEventListener('resize', this.renderCharts) },
    methods: {
        compact(value) { return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value) },
        money(value) { return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) },
        statusClass(product) { return `status-${this.store.productStatus(product).toLowerCase().replaceAll(' ', '-')}` },
        stock(product) { return this.store.productStock(product.id) },
        locationLabel(product) {
            const rows = this.store.productStockBreakdown(product.id)
            if (!rows.length) return '—'
            const warehouses = [...new Set(rows.map((row) => row.warehouseId).filter(Boolean))]
            if (warehouses.length > 1) return `${warehouses.length} warehouses`
            const locations = [...new Set(rows.map((row) => row.location).filter(Boolean))]
            return locations.length > 1 ? `${locations.length} locations` : locations[0] || '—'
        },
        movementTone(movement) {
            if (this.store.isTransferMovement(movement)) return 'transfer'
            return movement.changedQuantity > 0 ? 'in' : 'out'
        },
        movementIcon(movement) {
            if (this.store.isTransferMovement(movement)) return 'fa-right-left'
            return movement.changedQuantity > 0 ? 'fa-arrow-down' : 'fa-arrow-up'
        },
        movementQuantityClass(movement) {
            if (this.store.isTransferMovement(movement)) return ''
            if (movement?.changedQuantity > 0) return 'positive'
            if (movement?.changedQuantity < 0) return 'negative'
            return ''
        },
        movementQuantityLabel(movement) {
            const quantity = this.store.movementQuantity(movement)
            const formatted = new Intl.NumberFormat('en-MY', {
                maximumFractionDigits: 2,
            }).format(quantity)
            if (this.store.isTransferMovement(movement)) return `${formatted} moved`
            return `${quantity > 0 ? '+' : ''}${formatted}`
        },
        openProduct(product) { if (product) this.selectedProduct = product },
        openBatchProduct(productId) { this.selectedProduct = this.store.findProduct(productId) || this.selectedProduct },
        startReceive(product) {
            this.$router.push({ name: 'receive', query: { product: product.id, source: 'products' } })
        },
        canvasContext(reference) {
            const canvas = this.$refs[reference]
            if (!canvas) return null
            const rect = canvas.getBoundingClientRect()
            if (!rect.width || !rect.height) return null
            const ratio = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.round(rect.width * ratio)
            canvas.height = Math.round(rect.height * ratio)
            const context = canvas.getContext('2d')
            context.setTransform(ratio, 0, 0, ratio, 0, 0)
            context.clearRect(0, 0, rect.width, rect.height)
            return { context, width: rect.width, height: rect.height }
        },
        renderCharts() {
            if (this.reportMode !== 'charts') return
            this.drawCategoryChart()
            this.drawWarehouseValueChart()
            this.drawStatusChart()
            this.drawTopValueChart()
            this.drawMovementChart()
            this.drawAccuracyChart()
        },
        openChartModal(type) {
            if (this.reportMode !== 'charts') return
            const titleMap = {
                category: 'Products by category',
                warehouseValue: 'Inventory value by warehouse',
                status: 'Product stock status',
                topValue: 'Top products by stock value',
                movement: 'Movement records by day',
                accuracy: 'Stock-count accuracy',
            }
            const refMap = {
                category: 'categoryChart',
                warehouseValue: 'warehouseValueChart',
                status: 'statusChart',
                topValue: 'topValueChart',
                movement: 'movementChart',
                accuracy: 'accuracyChart',
            }
            const canvas = this.$refs[refMap[type]]
            if (!canvas) return
            this.chartModal = {
                open: true,
                type,
                title: titleMap[type],
                image: canvas.toDataURL('image/png'),
            }
        },
        closeChartModal() {
            this.chartModal = { open: false, type: '', title: '', image: '' }
        },
        printChartModal() {
            if (!this.chartModal.image) return
            const legendItems = this.chartModalLegend
            const legend = legendItems.length
                ? `<ul>${legendItems.map((item) => `<li><i style="background:${item.color}"></i><span>${item.label}</span><strong>${item.displayValue || this.compact(item.value)}</strong></li>`).join('')}</ul>`
                : ''
            const printWindow = window.open('', '_blank', 'width=960,height=760')
            if (!printWindow) return
            printWindow.addEventListener('load', () => {
                printWindow.focus()
                printWindow.print()
            }, { once: true })
            printWindow.document.write(`<!doctype html><html><head><title>${this.chartModal.title}</title><style>body{margin:0;padding:28px;font-family:Arial,sans-serif;color:#17353a;background:#fff}h1{margin:0 0 20px;font-size:28px}.wrap{max-width:980px;margin:0 auto}.figure{display:${legendItems.length ? 'grid' : 'block'};grid-template-columns:minmax(0,1fr) 180px;align-items:center;justify-content:center;gap:28px}img{width:100%;max-width:100%;display:block}ul{margin:0;padding:0;list-style:none}li{display:grid;grid-template-columns:10px 1fr auto;align-items:center;gap:9px;padding:7px 0;color:#6b858b;font-size:13px}li i{width:9px;height:9px;border-radius:50%}li strong{color:#17353a}@media(max-width:700px){.figure{grid-template-columns:1fr}}</style></head><body><div class="wrap"><h1>${this.chartModal.title}</h1><div class="figure"><img src="${this.chartModal.image}" alt="${this.chartModal.title}" />${legend}</div></div></body></html>`)
            printWindow.document.close()
        },
        drawEmptyChart(context, width, height) {
            context.fillStyle = CHART_COLORS.muted
            context.font = '700 11px sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText('No data available', width / 2, height / 2)
        },
        chartLabel(value, maximum = 16) {
            const label = String(value || 'Unassigned')
            return label.length > maximum ? `${label.slice(0, maximum - 1)}…` : label
        },
        chartValue(value, currency = false) {
            const formatted = this.compact(value)
            return currency ? `RM ${formatted}` : formatted
        },
        drawHorizontalBarChart(reference, data, options = {}) {
            const canvas = this.canvasContext(reference)
            if (!canvas) return
            const { context, width, height } = canvas
            if (!data.length) {
                this.drawEmptyChart(context, width, height)
                return
            }
            const left = Math.min(132, Math.max(92, width * 0.3))
            const right = options.currency ? 70 : 48
            const top = 8
            const bottom = 8
            const chartWidth = Math.max(1, width - left - right)
            const chartHeight = Math.max(1, height - top - bottom)
            const max = Math.max(1, ...data.map((item) => Number(item.value || 0)))
            const slot = chartHeight / Math.max(data.length, 1)
            const barHeight = Math.max(7, Math.min(15, slot * 0.52))
            const palette = options.palette || [CHART_COLORS.teal, CHART_COLORS.blue]

            context.strokeStyle = CHART_COLORS.grid
            context.lineWidth = 1
            for (let line = 0; line <= 3; line += 1) {
                const x = left + (chartWidth / 3) * line
                context.beginPath()
                context.moveTo(x, top)
                context.lineTo(x, height - bottom)
                context.stroke()
            }

            data.forEach((item, index) => {
                const y = top + slot * index + slot / 2
                const value = Number(item.value || 0)
                const barWidth = (value / max) * chartWidth
                context.fillStyle = palette[index % palette.length]
                context.fillRect(left, y - barHeight / 2, Math.max(value > 0 ? 2 : 0, barWidth), barHeight)

                context.fillStyle = CHART_COLORS.navy
                context.font = '800 10px sans-serif'
                context.textAlign = 'right'
                context.textBaseline = 'middle'
                context.fillText(this.chartLabel(item.label, 18), left - 8, y)

                context.textAlign = 'left'
                context.fillText(this.chartValue(value, options.currency), Math.min(width - right + 6, left + barWidth + 6), y)
            })
        },
        drawDonutChart(reference, data, centerValue) {
            const canvas = this.canvasContext(reference)
            if (!canvas) return
            const { context, width, height } = canvas
            const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0)
            if (!total) {
                this.drawEmptyChart(context, width, height)
                return
            }
            const radius = Math.min(width, height) * 0.31
            const lineWidth = Math.max(13, radius * 0.38)
            const x = width / 2
            const y = height / 2
            let angle = -Math.PI / 2
            context.lineCap = 'butt'
            data.forEach((item) => {
                const slice = (Number(item.value || 0) / total) * Math.PI * 2
                if (slice <= 0) return
                context.beginPath()
                context.arc(x, y, radius, angle, angle + slice)
                context.strokeStyle = item.color
                context.lineWidth = lineWidth
                context.stroke()
                angle += slice
            })
            context.fillStyle = CHART_COLORS.navy
            context.font = '800 22px sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText(String(centerValue), x, y)
        },
        drawMultiLineChart(reference, rows, series) {
            const canvas = this.canvasContext(reference)
            if (!canvas) return
            const { context, width, height } = canvas
            if (!rows.length) {
                this.drawEmptyChart(context, width, height)
                return
            }
            const left = 28
            const right = 10
            const top = 12
            const bottom = 30
            const chartWidth = Math.max(1, width - left - right)
            const chartHeight = Math.max(1, height - top - bottom)
            const max = Math.max(1, ...rows.flatMap((row) => series.map((item) => Number(row[item.key] || 0))))

            context.strokeStyle = CHART_COLORS.grid
            context.lineWidth = 1
            for (let line = 0; line <= 3; line += 1) {
                const y = top + (chartHeight / 3) * line
                context.beginPath()
                context.moveTo(left, y)
                context.lineTo(width - right, y)
                context.stroke()
            }

            const xFor = (index) => left + (chartWidth / Math.max(rows.length - 1, 1)) * index
            const yFor = (value) => top + chartHeight - (Number(value || 0) / max) * chartHeight
            series.forEach((item) => {
                context.beginPath()
                rows.forEach((row, index) => {
                    const x = xFor(index)
                    const y = yFor(row[item.key])
                    if (index === 0) context.moveTo(x, y)
                    else context.lineTo(x, y)
                })
                context.strokeStyle = item.color
                context.lineWidth = 2.2
                context.lineJoin = 'round'
                context.stroke()
                rows.forEach((row, index) => {
                    context.beginPath()
                    context.arc(xFor(index), yFor(row[item.key]), 3, 0, Math.PI * 2)
                    context.fillStyle = item.color
                    context.fill()
                })
            })

            context.fillStyle = CHART_COLORS.muted
            context.font = '700 9px sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'top'
            rows.forEach((row, index) => {
                context.fillText(row.label, xFor(index), top + chartHeight + 8)
            })
        },
        drawStackedHorizontalChart(reference, data) {
            const canvas = this.canvasContext(reference)
            if (!canvas) return
            const { context, width, height } = canvas
            const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0)
            if (!total) {
                this.drawEmptyChart(context, width, height)
                return
            }
            const left = 18
            const right = 18
            const chartWidth = Math.max(1, width - left - right)
            const barHeight = Math.min(30, Math.max(20, height * 0.24))
            const y = height / 2 - barHeight / 2
            let x = left
            context.fillStyle = '#edf4f2'
            context.fillRect(left, y, chartWidth, barHeight)
            data.forEach((item) => {
                const segmentWidth = (Number(item.value || 0) / total) * chartWidth
                if (segmentWidth <= 0) return
                context.fillStyle = item.color
                context.fillRect(x, y, segmentWidth, barHeight)
                if (segmentWidth > 42) {
                    context.fillStyle = '#fff'
                    context.font = '800 10px sans-serif'
                    context.textAlign = 'center'
                    context.textBaseline = 'middle'
                    context.fillText(`${Math.round((item.value / total) * 100)}%`, x + segmentWidth / 2, y + barHeight / 2)
                }
                x += segmentWidth
            })
            context.fillStyle = CHART_COLORS.navy
            context.font = '800 11px sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'bottom'
            context.fillText(`${this.compact(total)} stock units checked`, width / 2, y - 8)
        },
        drawCategoryChart() {
            this.drawHorizontalBarChart('categoryChart', this.categoryChartData, {
                palette: [CHART_COLORS.teal, CHART_COLORS.blue],
            })
        },
        drawWarehouseValueChart() {
            this.drawHorizontalBarChart('warehouseValueChart', this.warehouseValueChartData, {
                currency: true,
                palette: [CHART_COLORS.navy, CHART_COLORS.teal, CHART_COLORS.green],
            })
        },
        drawStatusChart() {
            this.drawDonutChart('statusChart', this.stockHealthData, this.stats.totalProducts)
        },
        drawTopValueChart() {
            this.drawHorizontalBarChart('topValueChart', this.topProductValueData, {
                currency: true,
                palette: [CHART_COLORS.green, CHART_COLORS.teal, CHART_COLORS.blue],
            })
        },
        drawMovementChart() {
            this.drawMultiLineChart('movementChart', this.movementDailyData, this.movementLegend)
        },
        drawAccuracyChart() {
            this.drawStackedHorizontalChart('accuracyChart', this.stockCountAccuracyData)
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/dashboard.css"></style>
