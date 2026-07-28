<template>
    <header class="inv-topbar">
        <button class="icon-button mobile-menu" type="button" aria-label="Open menu" @click="$emit('menu')">
            <i class="fa-solid fa-bars"></i>
        </button>
        <RouterLink class="topbar-context topbar-home-link" to="/inventory/dashboard" aria-label="Return to Dashboard">
            <strong>MAIN WAREHOUSE</strong>
        </RouterLink>
        <div class="topbar-quick-tools" aria-label="Quick inventory tools">
            <button
                v-for="tool in tools"
                :key="tool.id"
                type="button"
                :class="tool.tone"
                :aria-label="tool.label"
                :title="tool.label"
                @click="$emit('action', tool.id)"
            >
                <i class="fa-solid" :class="tool.icon"></i>
            </button>
        </div>
    </header>
</template>

<script>
export default {
    name: 'AppTopbar',
    emits: ['menu', 'action'],
    data() {
        return {
            tools: [
                { id: 'register', label: 'Register Product', icon: 'fa-plus', tone: 'register' },
                { id: 'scan', label: 'Scan Product', icon: 'fa-qrcode', tone: 'scan' },
                { id: 'in', label: 'Stock In', icon: 'fa-arrow-down', tone: 'stock-in' },
                { id: 'out', label: 'Stock Out', icon: 'fa-arrow-up', tone: 'stock-out' },
            ],
        }
    },
}
</script>
