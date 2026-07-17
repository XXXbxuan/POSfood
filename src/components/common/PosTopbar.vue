<template>
    <header class="restro-topbar pos-topbar">
        <h1
            role="button"
            tabindex="0"
            aria-label="Go to home"
            @click="goHome"
            @keydown.enter="goHome"
        >
            Restro <span>POS</span>
        </h1>
        <div class="header-center"><slot name="center"></slot></div>
        <div class="header-actions">
            <slot name="actions">
                <button
                    v-if="showOrderActions"
                    type="button"
                    class="order-action dine-in-button"
                    @click="startDineIn"
                >
                    <i class="fa-solid fa-utensils"></i>Dine In
                </button>
                <button
                    v-if="showOrderActions"
                    type="button"
                    class="order-action takeaway-button"
                    @click="startTakeaway"
                >
                    <i class="fa-solid fa-bag-shopping"></i>Takeaway
                </button>
            </slot>
        </div>
    </header>
</template>
<script>
export default {
    name: 'PosTopbar',
    props: {
        showOrderActions: { type: Boolean, default: false },
        showNewOrderButton: { type: Boolean, default: void 0 },
    },
    emits: ['dine-in', 'new-takeaway'],
    methods: {
        goHome() {
            if (this.$route.path !== '/pos/start')
                this.$router.push('/pos/start')
        },
        clearOrderDraft() {
            localStorage.removeItem('posfood_order_draft')
        },
        startTakeaway() {
            const setup = {
                orderType: 'Takeaway',
                tableNumber: '',
                pax: 1,
                orderNo: `#${String(Date.now()).slice(-5)}`,
            }
            this.clearOrderDraft()
            localStorage.setItem('posfood_order_setup', JSON.stringify(setup))
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            this.$emit('new-takeaway', setup)
            if (this.$route.path !== '/pos/order')
                this.$router.push(`/pos/order?takeaway=${Date.now()}`)
        },
        startDineIn() {
            this.clearOrderDraft()
            localStorage.removeItem('posfood_order_setup')
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            if (this.$route.path === '/pos/start') this.$emit('dine-in')
            else this.$router.push(`/pos/start?new=dine-in&t=${Date.now()}`)
        },
    },
}
</script>
