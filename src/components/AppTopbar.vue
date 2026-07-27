<template>
    <header class="inv-topbar">
        <button class="icon-button mobile-menu" type="button" aria-label="Open menu" @click="$emit('menu')">
            <i class="fa-solid fa-bars"></i>
        </button>
        <div class="topbar-context">
            <span>MAIN WAREHOUSE</span>
            <strong>{{ title }}</strong>
        </div>
        <div class="topbar-actions">
            <RouterLink class="button primary scan-topbar" to="/inventory/scan">
                <i class="fa-solid fa-qrcode"></i><span>Scan</span>
            </RouterLink>
            <button class="icon-button notification-button" type="button" aria-label="Notifications" @click="$emit('notifications')">
                <i class="fa-regular fa-bell"></i>
                <span v-if="alertCount">{{ alertCount }}</span>
            </button>
            <button class="profile-button" type="button" @click="$emit('profile')">
                <span>{{ initials }}</span>
                <div><strong>{{ account.name }}</strong><small>{{ account.role }}</small></div>
                <i class="fa-solid fa-chevron-down"></i>
            </button>
        </div>
    </header>
</template>

<script>
export default {
    name: 'AppTopbar',
    props: {
        title: { type: String, default: 'Dashboard' },
        account: { type: Object, required: true },
        alertCount: { type: Number, default: 0 },
    },
    emits: ['menu', 'notifications', 'profile'],
    computed: {
        initials() {
            return this.account.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
    },
}
</script>
