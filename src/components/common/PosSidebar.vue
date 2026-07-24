<template>
    <div class="sidebar-controller">
        <button
            v-if="isOpen"
            type="button"
            class="sidebar-scrim"
            aria-label="Close navigation"
            @click="isOpen = false"
        ></button>
        <aside class="app-sidebar pos-sidebar" :class="{ open: isOpen }">
            <button type="button" class="sidebar-brand" @click="goHome">
                Restro <span>POS</span>
            </button>
            <nav>
                <button
                    v-for="item in visibleItems"
                    :key="item.label"
                    type="button"
                    :class="{ active: active === item.label }"
                    @click="navigate(item)"
                >
                    <i class="fa-solid" :class="item.icon"></i
                    ><span>{{ item.label }}</span>
                </button>
            </nav>
            <div class="sidebar-spacer"></div>
            <button
                type="button"
                class="profile-card"
                :class="{ active: active === 'Profile' }"
                @click="openProfile"
            >
                <div class="avatar">
                    <img
                        v-if="profileImage"
                        :src="profileImage"
                        :alt="accountName"
                    />
                    <span v-else>{{ initials }}</span>
                </div>
                <div>
                    <strong>{{ accountName }}</strong
                    ><small>{{ accountRole }}</small>
                </div>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button type="button" class="lock-button" @click="lockSession">
                <i class="fa-solid fa-lock"></i><span>Lock</span>
            </button>
            <button type="button" class="logout-button" @click="logout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i
                ><span>Logout</span>
            </button>
        </aside>
    </div>
</template>

<script>
import {
    PERMISSIONS,
    hasPermission,
    normalizePermissionRole,
    readActiveAccount,
    roleHome,
} from '@/services/pos/permissions.js'
import { findStaffAccount } from '@/services/pos/staff.js'

export default {
    name: 'PosSidebar',
    props: { active: { type: String, default: '' } },
    data() {
        return {
            isOpen: false,
            accountVersion: 0,
            items: [
                {
                    label: 'Home',
                    icon: 'fa-house',
                    route: '/pos/start',
                    permission: PERMISSIONS.VIEW_POS,
                },
                {
                    label: 'History',
                    icon: 'fa-clock-rotate-left',
                    route: '/pos/transactions',
                    permission: PERMISSIONS.VIEW_TRANSACTIONS,
                },
                {
                    label: 'Menu',
                    icon: 'fa-utensils',
                    route: '/pos/menu',
                    permission: PERMISSIONS.MANAGE_MENU,
                },
                {
                    label: 'Membership',
                    icon: 'fa-address-card',
                    route: '/pos/memberships',
                    permission: PERMISSIONS.MANAGE_MEMBERS,
                },
                {
                    label: 'Vouchers',
                    icon: 'fa-ticket',
                    route: '/pos/vouchers',
                    permission: PERMISSIONS.MANAGE_VOUCHERS,
                },
                {
                    label: 'Reports',
                    icon: 'fa-chart-simple',
                    route: '/pos/reports',
                    permission: PERMISSIONS.VIEW_REPORTS,
                },
                {
                    label: 'Staff',
                    icon: 'fa-users-gear',
                    route: '/pos/staff',
                    permission: PERMISSIONS.MANAGE_STAFF,
                },
                {
                    label: 'Kitchen',
                    icon: 'fa-kitchen-set',
                    route: '/pos/kitchen',
                    permission: PERMISSIONS.VIEW_KITCHEN,
                },
            ],
        }
    },
    computed: {
        activeAccount() {
            this.accountVersion
            const activeAccount = readActiveAccount() || {}
            return (
                findStaffAccount(activeAccount.employeeId) ||
                activeAccount
            )
        },
        accountName() {
            return this.activeAccount.name || 'Staff'
        },
        accountRole() {
            return normalizePermissionRole(this.activeAccount.role)
        },
        profileImage() {
            return this.activeAccount.profileImage || ''
        },
        visibleItems() {
            return this.items.filter((item) =>
                hasPermission(this.accountRole, item.permission),
            )
        },
        initials() {
            return (
                this.accountName
                    .split(' ')
                    .map((value) => value[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'ST'
            )
        },
    },
    mounted() {
        window.addEventListener('pos-sidebar:open', this.openSidebar)
        window.addEventListener('pos-profile:changed', this.refreshAccount)
        window.addEventListener('pos-staff:changed', this.refreshAccount)
        window.addEventListener('storage', this.refreshAccount)
    },
    beforeUnmount() {
        window.removeEventListener('pos-sidebar:open', this.openSidebar)
        window.removeEventListener('pos-profile:changed', this.refreshAccount)
        window.removeEventListener('pos-staff:changed', this.refreshAccount)
        window.removeEventListener('storage', this.refreshAccount)
    },
    methods: {
        openSidebar() {
            this.isOpen = true
        },
        refreshAccount() {
            this.accountVersion += 1
        },
        openProfile() {
            this.isOpen = false
            if (this.$route.path !== '/pos/profile')
                this.$router.push('/pos/profile')
        },
        goHome() {
            this.isOpen = false
            const home = roleHome(this.accountRole)
            if (this.$route.path !== home) this.$router.push(home)
        },
        navigate(item) {
            this.isOpen = false
            if (this.$route.path !== item.route) this.$router.push(item.route)
        },
        lockSession() {
            this.isOpen = false
            localStorage.setItem('posfood_session_locked', '1')
            this.$router.push({ path: '/', query: { locked: '1' } })
        },
        logout() {
            localStorage.removeItem('posfood_active_account')
            localStorage.removeItem('posfood_order_setup')
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            localStorage.removeItem('posfood_session_locked')
            this.$router.push('/')
        },
    },
}
</script>
