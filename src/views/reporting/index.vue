<template>
    <main class="reporting-page">
        <section class="reporting-shell">
            <PosTopbar />
            <PosSidebar active="Reports" />

            <section
                class="reporting-workspace"
                :class="{ 'overview-workspace': activeView === 'overview' }"
            >
                <header class="reporting-header">
                    <div class="reporting-title">
                        <h2>Reporting</h2>
                        <nav
                            class="report-view-tabs"
                            aria-label="Report section"
                        >
                            <button
                                type="button"
                                :class="{ active: activeView === 'overview' }"
                                @click="activeView = 'overview'"
                            >
                                Overview</button
                            ><button
                                type="button"
                                :class="{ active: activeView === 'products' }"
                                @click="activeView = 'products'"
                            >
                                Product sales
                            </button>
                        </nav>
                    </div>
                    <nav class="period-tabs" aria-label="Report period">
                        <button
                            v-for="option in periodOptions"
                            :key="option.key"
                            type="button"
                            :class="{ active: period === option.key }"
                            @click="period = option.key"
                        >
                            {{ option.label }}
                        </button>
                    </nav>
                </header>

                <template v-if="activeView === 'overview'">
                    <section class="reporting-stats">
                        <article>
                            <i class="fa-solid fa-coins"></i
                            ><span>Net sales</span
                            ><strong>RM {{ money(summary.revenue) }}</strong>
                        </article>
                        <article>
                            <i class="fa-solid fa-receipt"></i
                            ><span>Orders</span
                            ><strong>{{ summary.orders }}</strong>
                        </article>
                        <article>
                            <i class="fa-solid fa-calculator"></i
                            ><span>Average order</span
                            ><strong>RM {{ money(summary.average) }}</strong>
                        </article>
                        <article>
                            <i class="fa-solid fa-bowl-food"></i
                            ><span>Items sold</span
                            ><strong>{{ summary.items }}</strong>
                        </article>
                    </section>

                    <section class="reporting-grid primary-grid">
                        <article class="report-card sales-card">
                            <header>
                                <div>
                                    <span>SALES</span>
                                    <h3>{{ chartTitle }}</h3>
                                </div>
                                <strong>RM {{ money(summary.revenue) }}</strong>
                            </header>
                            <div
                                v-if="filteredSales.length"
                                class="sales-chart"
                            >
                                <div
                                    v-for="point in chartData"
                                    :key="point.key"
                                    class="chart-column"
                                    :title="`${point.label}: RM ${money(point.value)}`"
                                >
                                    <div class="bar-track">
                                        <span
                                            :style="{
                                                height: barHeight(point.value),
                                            }"
                                        ></span>
                                    </div>
                                    <small>{{ point.label }}</small>
                                </div>
                            </div>
                            <div v-else class="report-empty">
                                <i class="fa-solid fa-chart-column"></i
                                ><span>No completed sales</span>
                            </div>
                        </article>

                        <article class="report-card service-card">
                            <header>
                                <div>
                                    <span>ORDERS</span>
                                    <h3>Service type</h3>
                                </div>
                            </header>
                            <div class="service-list">
                                <div
                                    v-for="service in serviceBreakdown"
                                    :key="service.name"
                                >
                                    <i
                                        class="fa-solid"
                                        :class="service.icon"
                                    ></i>
                                    <span>{{ service.name }}</span>
                                    <strong>{{ service.orders }}</strong>
                                    <small
                                        >RM {{ money(service.revenue) }}</small
                                    >
                                </div>
                            </div>
                        </article>
                    </section>

                    <section class="reporting-grid secondary-grid">
                        <article class="report-card payment-card">
                            <header>
                                <div>
                                    <span>PAYMENTS</span>
                                    <h3>Payment methods</h3>
                                </div>
                            </header>
                            <div
                                v-if="paymentBreakdown.length"
                                class="payment-list"
                            >
                                <div
                                    v-for="payment in paymentBreakdown"
                                    :key="payment.name"
                                >
                                    <div>
                                        <span>{{ payment.name }}</span
                                        ><strong
                                            >RM
                                            {{ money(payment.total) }}</strong
                                        >
                                    </div>
                                    <div class="progress">
                                        <span
                                            :style="{
                                                width: `${payment.percent}%`,
                                            }"
                                        ></span>
                                    </div>
                                    <small>{{ payment.percent }}%</small>
                                </div>
                            </div>
                            <div v-else class="report-empty compact">
                                <span>No payment data</span>
                            </div>
                        </article>

                        <article class="report-card items-card">
                            <header>
                                <div>
                                    <span>MENU</span>
                                    <h3>Top items</h3>
                                </div>
                                <small>Qty</small>
                            </header>
                            <ol v-if="topItems.length">
                                <li
                                    v-for="(item, index) in topItems"
                                    :key="item.name"
                                >
                                    <span>{{ index + 1 }}</span>
                                    <div>
                                        <strong>{{ item.name }}</strong
                                        ><small
                                            >RM {{ money(item.revenue) }}</small
                                        >
                                    </div>
                                    <b>{{ item.qty }}</b>
                                </li>
                            </ol>
                            <div v-else class="report-empty compact">
                                <span>No item data</span>
                            </div>
                        </article>
                    </section>
                </template>

                <template v-else>
                    <section class="product-report-toolbar">
                        <nav
                            class="product-category-tabs"
                            aria-label="Product category"
                        >
                            <button
                                type="button"
                                :class="{ active: selectedCategory === 'All' }"
                                @click="selectedCategory = 'All'"
                            >
                                All
                            </button>
                            <button
                                v-for="category in reportCategories"
                                :key="category"
                                type="button"
                                :class="{
                                    active: selectedCategory === category,
                                }"
                                @click="selectedCategory = category"
                            >
                                {{ category }}
                            </button>
                        </nav>
                        <select
                            v-model="productSort"
                            aria-label="Sort product performance"
                        >
                            <option value="revenue">Top sales</option>
                            <option value="orders">Most ordered</option>
                            <option value="quantity">Quantity sold</option>
                        </select>
                    </section>

                    <section
                        v-if="sortedProductPerformance.length"
                        class="product-performance-grid"
                    >
                        <button
                            v-for="(product, index) in sortedProductPerformance"
                            :key="product.name"
                            type="button"
                            class="performance-card"
                            @click="selectedProductName = product.name"
                        >
                            <span class="product-rank">{{ index + 1 }}</span>
                            <img
                                v-if="product.image"
                                :src="product.image"
                                :alt="product.name"
                            /><span v-else class="product-image-empty"
                                ><i class="fa-regular fa-image"></i
                            ></span>
                            <div class="performance-copy">
                                <small>{{ product.category }}</small>
                                <h3>{{ product.name }}</h3>
                                <p>
                                    {{ product.qty }} sold ·
                                    {{ product.orders }} orders
                                </p>
                            </div>
                            <div class="performance-total">
                                <strong>RM {{ money(product.revenue) }}</strong
                                ><small>{{ product.share }}% of sales</small>
                            </div>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </section>
                    <div v-else class="product-report-empty">
                        <i class="fa-solid fa-bowl-food"></i>
                        <h3>No product sales</h3>
                        <p>Try another category or period.</p>
                    </div>
                </template>
            </section>
        </section>

        <div
            v-if="selectedProductDetail"
            class="product-detail-backdrop"
            @click.self="selectedProductName = ''"
        >
            <section class="product-detail-modal">
                <header>
                    <div>
                        <span>{{ selectedProductDetail.category }}</span>
                        <h2>{{ selectedProductDetail.name }}</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close product report"
                        @click="selectedProductName = ''"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="product-detail-body">
                    <aside class="product-detail-summary">
                        <img
                            v-if="selectedProductDetail.image"
                            :src="selectedProductDetail.image"
                            :alt="selectedProductDetail.name"
                        /><span v-else
                            ><i class="fa-regular fa-image"></i
                        ></span>
                        <div>
                            <small>Total sales</small
                            ><strong
                                >RM
                                {{
                                    money(selectedProductDetail.revenue)
                                }}</strong
                            >
                        </div>
                    </aside>
                    <section class="product-detail-content">
                        <div class="product-detail-stats">
                            <article>
                                <span>Items sold</span
                                ><strong>{{
                                    selectedProductDetail.qty
                                }}</strong>
                            </article>
                            <article>
                                <span>Orders</span
                                ><strong>{{
                                    selectedProductDetail.orders
                                }}</strong>
                            </article>
                            <article>
                                <span>Average price</span
                                ><strong
                                    >RM
                                    {{
                                        money(
                                            selectedProductDetail.averagePrice,
                                        )
                                    }}</strong
                                >
                            </article>
                        </div>
                        <article class="product-trend-card">
                            <header>
                                <h3>Sales trend</h3>
                                <strong
                                    >RM
                                    {{
                                        money(selectedProductDetail.revenue)
                                    }}</strong
                                >
                            </header>
                            <div class="product-trend">
                                <div
                                    v-for="point in selectedProductTrend"
                                    :key="point.key"
                                >
                                    <span
                                        ><i
                                            :style="{
                                                height: productBarHeight(
                                                    point.value,
                                                ),
                                            }"
                                        ></i></span
                                    ><small>{{ point.label }}</small>
                                </div>
                            </div>
                        </article>
                        <section class="product-detail-lists">
                            <article>
                                <h3>Service type</h3>
                                <div
                                    v-for="service in selectedProductServices"
                                    :key="service.name"
                                >
                                    <span>{{ service.name }}</span
                                    ><strong>{{ service.qty }}</strong>
                                </div>
                            </article>
                            <article>
                                <h3>Popular options</h3>
                                <div
                                    v-for="option in selectedProductOptions"
                                    :key="option.name"
                                >
                                    <span>{{ option.name }}</span
                                    ><strong>{{ option.count }}</strong>
                                </div>
                                <p v-if="!selectedProductOptions.length">
                                    No option data
                                </p>
                            </article>
                        </section>
                    </section>
                </div>
            </section>
        </div>
    </main>
</template>

<script>
import PosTopbar from '@/components/common/PosTopbar.vue'
import PosSidebar from '@/components/common/PosSidebar.vue'
import { readList } from '@/services/pos/storage.js'
import { loadMenuCatalog } from '@/services/pos/menuCatalog.js'
export default {
    name: 'POSReporting',
    components: { PosTopbar, PosSidebar },
    data() {
        const catalog = loadMenuCatalog()
        return {
            activeView: 'overview',
            period: 'today',
            sales: [],
            menuCategories: catalog.categories,
            menuProducts: catalog.products,
            selectedCategory: 'All',
            productSort: 'revenue',
            selectedProductName: '',
            periodOptions: [
                { key: 'today', label: 'Today' },
                { key: 'week', label: '7 days' },
                { key: 'month', label: '30 days' },
            ],
        }
    },
    computed: {
        periodStart() {
            const date = this.startOfDay(new Date())
            if (this.period === 'week') date.setDate(date.getDate() - 6)
            if (this.period === 'month') date.setDate(date.getDate() - 29)
            return date
        },
        filteredSales() {
            const start = this.periodStart.getTime()
            return this.sales.filter((sale) => {
                const date = this.saleDate(sale)
                return date && date.getTime() >= start
            })
        },
        summary() {
            const revenue = this.filteredSales.reduce(
                (sum, sale) => sum + Number(sale.total || 0),
                0,
            )
            const orderKeys = new Set(
                this.filteredSales.map(
                    (sale) =>
                        sale.splitSessionId ||
                        sale.sourceOrderId ||
                        sale.orderNumber ||
                        sale.id,
                ),
            )
            const items = this.filteredSales
                .flatMap((sale) => sale.items || [])
                .reduce((sum, item) => sum + Number(item.qty || 0), 0)
            const orders = orderKeys.size
            return {
                revenue,
                orders,
                items,
                average: orders ? revenue / orders : 0,
            }
        },
        serviceBreakdown() {
            return [
                { name: 'Dine In', icon: 'fa-utensils' },
                { name: 'Takeaway', icon: 'fa-bag-shopping' },
            ].map((service) => {
                const sales = this.filteredSales.filter(
                    (sale) =>
                        (sale.orderSetup?.orderType ||
                            sale.orderType ||
                            'Dine In') === service.name,
                )
                const keys = new Set(
                    sales.map(
                        (sale) =>
                            sale.splitSessionId ||
                            sale.sourceOrderId ||
                            sale.orderNumber ||
                            sale.id,
                    ),
                )
                return {
                    ...service,
                    orders: keys.size,
                    revenue: sales.reduce(
                        (sum, sale) => sum + Number(sale.total || 0),
                        0,
                    ),
                }
            })
        },
        paymentBreakdown() {
            const groups = new Map()
            this.filteredSales.forEach((sale) => {
                const name = sale.paymentMethod || 'Other'
                groups.set(
                    name,
                    (groups.get(name) || 0) + Number(sale.total || 0),
                )
            })
            const total = this.summary.revenue
            return [...groups.entries()]
                .map(([name, value]) => ({
                    name,
                    total: value,
                    percent: total ? Math.round((value / total) * 100) : 0,
                }))
                .sort((a, b) => b.total - a.total)
        },
        topItems() {
            const groups = new Map()
            this.filteredSales.forEach((sale) =>
                (sale.items || []).forEach((item) => {
                    const current = groups.get(item.name) || {
                        name: item.name,
                        qty: 0,
                        revenue: 0,
                    }
                    current.qty += Number(item.qty || 0)
                    current.revenue += Number(
                        item.total ||
                            Number(item.price || 0) * Number(item.qty || 0),
                    )
                    groups.set(item.name, current)
                }),
            )
            return [...groups.values()]
                .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
                .slice(0, 5)
        },
        productPerformance() {
            const productsByName = new Map(
                this.menuProducts.map((product) => [
                    String(product.name).toLowerCase(),
                    product,
                ]),
            )
            const groups = new Map()
            this.filteredSales.forEach((sale) => {
                const orderKey =
                    sale.splitSessionId ||
                    sale.sourceOrderId ||
                    sale.orderNumber ||
                    sale.id
                ;(sale.items || []).forEach((item) => {
                    const menuProduct = productsByName.get(
                        String(item.name).toLowerCase(),
                    )
                    const current = groups.get(item.name) || {
                        name: item.name,
                        category:
                            item.category ||
                            menuProduct?.category ||
                            'Uncategorised',
                        image: item.image || menuProduct?.image || '',
                        qty: 0,
                        revenue: 0,
                        orderKeys: new Set(),
                    }
                    current.qty += Number(item.qty || 0)
                    current.revenue += Number(
                        item.total ||
                            Number(item.price || 0) * Number(item.qty || 0),
                    )
                    current.orderKeys.add(orderKey)
                    groups.set(item.name, current)
                })
            })
            return [...groups.values()].map((product) => ({
                ...product,
                orders: product.orderKeys.size,
                averagePrice: product.qty ? product.revenue / product.qty : 0,
                share: this.summary.revenue
                    ? Math.round((product.revenue / this.summary.revenue) * 100)
                    : 0,
            }))
        },
        reportCategories() {
            return [
                ...new Set([
                    ...this.menuCategories,
                    ...this.productPerformance.map(
                        (product) => product.category,
                    ),
                ]),
            ].filter(Boolean)
        },
        sortedProductPerformance() {
            const products = this.productPerformance.filter(
                (product) =>
                    this.selectedCategory === 'All' ||
                    product.category === this.selectedCategory,
            )
            const key =
                this.productSort === 'orders'
                    ? 'orders'
                    : this.productSort === 'quantity'
                      ? 'qty'
                      : 'revenue'
            return products.sort(
                (a, b) => b[key] - a[key] || b.revenue - a.revenue,
            )
        },
        selectedProductDetail() {
            return (
                this.productPerformance.find(
                    (product) => product.name === this.selectedProductName,
                ) || null
            )
        },
        selectedProductTrend() {
            if (!this.selectedProductDetail) return []
            if (this.period === 'today') return this.productHourlyChart()
            if (this.period === 'week') return this.productDailyChart(7)
            return this.productMonthChart()
        },
        selectedProductTrendMax() {
            return Math.max(
                0,
                ...this.selectedProductTrend.map((point) => point.value),
            )
        },
        selectedProductServices() {
            if (!this.selectedProductDetail) return []
            return ['Dine In', 'Takeaway'].map((name) => {
                const qty = this.filteredSales
                    .filter(
                        (sale) =>
                            (sale.orderSetup?.orderType ||
                                sale.orderType ||
                                'Dine In') === name,
                    )
                    .flatMap((sale) => sale.items || [])
                    .filter((item) => item.name === this.selectedProductName)
                    .reduce((sum, item) => sum + Number(item.qty || 0), 0)
                return { name, qty }
            })
        },
        selectedProductOptions() {
            if (!this.selectedProductDetail) return []
            const groups = new Map()
            this.filteredSales
                .flatMap((sale) => sale.items || [])
                .filter((item) => item.name === this.selectedProductName)
                .forEach((item) => {
                    const options = item.optionLines?.length
                        ? item.optionLines
                        : [item.size].filter(Boolean)
                    options.forEach((option) =>
                        groups.set(
                            option,
                            (groups.get(option) || 0) + Number(item.qty || 0),
                        ),
                    )
                })
            return [...groups.entries()]
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
        },
        chartTitle() {
            return this.period === 'today'
                ? 'Sales by hour'
                : this.period === 'week'
                  ? 'Sales by day'
                  : 'Sales by 5-day period'
        },
        chartData() {
            if (this.period === 'today') return this.hourlyChart()
            if (this.period === 'week') return this.dailyChart(7)
            return this.monthChart()
        },
        chartMax() {
            return Math.max(0, ...this.chartData.map((point) => point.value))
        },
    },
    mounted() {
        if (!localStorage.getItem('posfood_active_account'))
            return this.$router.push('/')
        this.loadSales()
        window.addEventListener('storage', this.loadSales)
        window.addEventListener('focus', this.loadSales)
    },
    beforeUnmount() {
        window.removeEventListener('storage', this.loadSales)
        window.removeEventListener('focus', this.loadSales)
    },
    methods: {
        loadSales() {
            this.sales = readList('posfood_sales').filter(
                (sale) => sale.status !== 'cancelled',
            )
            const catalog = loadMenuCatalog()
            this.menuCategories = catalog.categories
            this.menuProducts = catalog.products
        },
        money(value) {
            return Number(value || 0).toFixed(2)
        },
        startOfDay(value) {
            const date = new Date(value)
            date.setHours(0, 0, 0, 0)
            return date
        },
        saleDate(sale) {
            const value = sale.paidAt || sale.completedAt || sale.createdAt
            if (!value) return null
            const date = new Date(value)
            return Number.isNaN(date.getTime()) ? null : date
        },
        barHeight(value) {
            return value && this.chartMax
                ? `${Math.max(7, Math.round((value / this.chartMax) * 100))}%`
                : '0%'
        },
        productBarHeight(value) {
            return value && this.selectedProductTrendMax
                ? `${Math.max(7, Math.round((value / this.selectedProductTrendMax) * 100))}%`
                : '0%'
        },
        productRevenue(sales) {
            return sales
                .flatMap((sale) => sale.items || [])
                .filter((item) => item.name === this.selectedProductName)
                .reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.total ||
                                Number(item.price || 0) * Number(item.qty || 0),
                        ),
                    0,
                )
        },
        hourlyChart() {
            const hours = [8, 10, 12, 14, 16, 18, 20, 22]
            return hours.map((hour, index) => {
                const next = hours[index + 1] ?? 24
                const value = this.filteredSales
                    .filter((sale) => {
                        const date = this.saleDate(sale)
                        return (
                            date &&
                            date.getHours() >= hour &&
                            date.getHours() < next
                        )
                    })
                    .reduce((sum, sale) => sum + Number(sale.total || 0), 0)
                return {
                    key: hour,
                    label: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`,
                    value,
                }
            })
        },
        dailyChart(days) {
            const today = this.startOfDay(new Date())
            return Array.from({ length: days }, (_, index) => {
                const date = new Date(today)
                date.setDate(today.getDate() - (days - 1 - index))
                const end = new Date(date)
                end.setDate(end.getDate() + 1)
                const value = this.filteredSales
                    .filter((sale) => {
                        const paid = this.saleDate(sale)
                        return paid && paid >= date && paid < end
                    })
                    .reduce((sum, sale) => sum + Number(sale.total || 0), 0)
                return {
                    key: date.toISOString(),
                    label: new Intl.DateTimeFormat('en-MY', {
                        weekday: 'short',
                    }).format(date),
                    value,
                }
            })
        },
        monthChart() {
            const start = this.periodStart
            return Array.from({ length: 6 }, (_, index) => {
                const from = new Date(start)
                from.setDate(start.getDate() + index * 5)
                const to = new Date(from)
                to.setDate(from.getDate() + 5)
                const value = this.filteredSales
                    .filter((sale) => {
                        const paid = this.saleDate(sale)
                        return paid && paid >= from && paid < to
                    })
                    .reduce((sum, sale) => sum + Number(sale.total || 0), 0)
                return {
                    key: from.toISOString(),
                    label: new Intl.DateTimeFormat('en-MY', {
                        day: 'numeric',
                        month: 'short',
                    }).format(from),
                    value,
                }
            })
        },
        productHourlyChart() {
            const hours = [8, 10, 12, 14, 16, 18, 20, 22]
            return hours.map((hour, index) => {
                const next = hours[index + 1] ?? 24
                const sales = this.filteredSales.filter((sale) => {
                    const date = this.saleDate(sale)
                    return (
                        date &&
                        date.getHours() >= hour &&
                        date.getHours() < next
                    )
                })
                return {
                    key: hour,
                    label: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`,
                    value: this.productRevenue(sales),
                }
            })
        },
        productDailyChart(days) {
            const today = this.startOfDay(new Date())
            return Array.from({ length: days }, (_, index) => {
                const date = new Date(today)
                date.setDate(today.getDate() - (days - 1 - index))
                const end = new Date(date)
                end.setDate(end.getDate() + 1)
                const sales = this.filteredSales.filter((sale) => {
                    const paid = this.saleDate(sale)
                    return paid && paid >= date && paid < end
                })
                return {
                    key: date.toISOString(),
                    label: new Intl.DateTimeFormat('en-MY', {
                        weekday: 'short',
                    }).format(date),
                    value: this.productRevenue(sales),
                }
            })
        },
        productMonthChart() {
            const start = this.periodStart
            return Array.from({ length: 6 }, (_, index) => {
                const from = new Date(start)
                from.setDate(start.getDate() + index * 5)
                const to = new Date(from)
                to.setDate(from.getDate() + 5)
                const sales = this.filteredSales.filter((sale) => {
                    const paid = this.saleDate(sale)
                    return paid && paid >= from && paid < to
                })
                return {
                    key: from.toISOString(),
                    label: new Intl.DateTimeFormat('en-MY', {
                        day: 'numeric',
                        month: 'short',
                    }).format(from),
                    value: this.productRevenue(sales),
                }
            })
        },
    },
}
</script>
