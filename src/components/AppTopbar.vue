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
            <button class="icon-button topbar-qr-button" type="button" aria-label="Scan product QR" @click="$emit('scan')">
                <i class="fa-solid fa-qrcode"></i>
            </button>
            <button class="profile-button compact-profile" type="button" aria-label="Open account menu" @click="$emit('profile')">
                <span>{{ initials }}</span>
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
    },
    emits: ['menu', 'scan', 'profile'],
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
