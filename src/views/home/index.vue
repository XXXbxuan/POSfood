<template>
    <main class="home-dashboard">
        <header class="home-dashboard__head">
            <div><h1 class="inventory-page-title">What do you need to do?</h1></div>
            <span class="home-dashboard__date">{{ todayLabel }}</span>
        </header>
        <section class="home-action-grid" aria-label="Daily inventory actions">
            <button v-for="action in actions" :key="action.id" type="button" :class="action.tone" @click="run(action)">
                <span><i class="fa-solid" :class="action.icon"></i></span>
                <strong>{{ action.label }}</strong>
                <i class="fa-solid fa-arrow-right"></i>
            </button>
        </section>

        <div v-if="internalStockInOpen" class="modal-backdrop home-operation-backdrop" @click.self="closeInternalStockIn">
            <section class="home-operation-picker" role="dialog" aria-modal="true" aria-label="Choose stock in type">
                <header>
                    <div class="home-operation-title">
                        <button class="icon-button" type="button" aria-label="Back" @click="closeInternalStockIn">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        <div><span class="eyebrow">STOCK IN</span><h2>Choose stock in type</h2></div>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close" @click="closeInternalStockIn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="home-operation-grid">
                    <button type="button" @click="openInternalStockIn('product')">
                        <i class="fa-solid fa-box"></i><strong>Product Stock In</strong>
                    </button>
                    <button type="button" @click="openInternalStockIn('batch')">
                        <i class="fa-solid fa-layer-group"></i><strong>Batch Stock In</strong>
                    </button>
                </div>
            </section>
        </div>
    </main>
</template>

<script>
import { languageState } from '@/system/language'

export default {
    name: 'HomeDashboardView',
    data() {
        return {
            internalStockInOpen: false,
            actions: [
                { id: 'scan', label: 'Scan', icon: 'fa-barcode', tone: 'primary', route: { name: 'scan' } },
                { id: 'ship', label: 'Ship', icon: 'fa-truck-arrow-right', tone: 'coral', route: { name: 'dispatch', query: { mode: 'ship' } } },
                { id: 'labels', label: 'Print Labels', icon: 'fa-print', tone: 'amber', route: { name: 'labels' } },
                { id: 'internal-in', label: 'Internal Stock In', icon: 'fa-arrow-down', tone: 'teal', route: { name: 'receive', query: { choose: '1', stockInStage: 'target', from: 'dashboard' } } },
                { id: 'supplier-in', label: 'Supplier Stock In', icon: 'fa-arrow-down', tone: 'green', route: { name: 'receive', query: { type: 'supplier', supplierFlow: '1' } } },
                { id: 'movement', label: 'Stock Movement', icon: 'fa-right-left', tone: 'mint', route: { name: 'dispatch', query: { mode: 'move' } } },
                { id: 'stockout', label: 'Stock Out', icon: 'fa-arrow-up', tone: 'rose', route: { name: 'dispatch', query: { mode: 'remove' } } },
            ],
        }
    },
    computed: {
        todayLabel() {
            const locale = { en: 'en-MY', cn: 'zh-CN', bm: 'ms-MY' }[languageState.code]
            return new Intl.DateTimeFormat(locale, { weekday: 'long', day: '2-digit', month: 'short' }).format(new Date())
        },
    },
    methods: {
        run(action) {
            if (action.id === 'internal-in') {
                this.internalStockInOpen = true
                return
            }
            if (action.route) this.$router.push({ ...action.route, query: { ...(action.route.query || {}), from: 'dashboard' } })
        },
        closeInternalStockIn() {
            this.internalStockInOpen = false
        },
        openInternalStockIn(target) {
            this.internalStockInOpen = false
            this.$router.push({
                name: 'receive',
                query: {
                    type: 'standard',
                    ...(target === 'batch' ? { stockTarget: 'batch' } : {}),
                    from: 'dashboard',
                },
            })
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/home-dashboard.css"></style>
