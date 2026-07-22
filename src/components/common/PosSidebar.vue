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
            <div class="profile-card">
                <div class="avatar">{{ initials }}</div>
                <div>
                    <strong>{{ accountName }}</strong
                    ><small>{{ accountRole }}</small>
                </div>
            </div>
            <button type="button" class="lock-button" @click="lockSession">
                <i class="fa-solid fa-lock"></i><span>Lock</span>
            </button>
            <button type="button" class="logout-button" @click="logout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i
                ><span>Logout</span>
            </button>
        </aside>

        <section v-if="showStaffManagement" class="staff-management-layer">
            <header class="staff-management-layer-header">
                <div>
                    <span>ADMIN MANAGEMENT</span>
                    <h1>Staff management</h1>
                </div>
                <div>
                    <button type="button" class="staff-add-button" @click="openStaffCreate">
                        <i class="fa-solid fa-user-plus"></i>Add staff
                    </button>
                    <button
                        type="button"
                        class="staff-management-close"
                        aria-label="Close staff management"
                        @click="closeStaffManagement"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <div class="staff-management-content">
                <nav class="staff-role-filters">
                    <button
                        v-for="role in ['All', ...staffRoles]"
                        :key="role"
                        type="button"
                        :class="{ active: staffRoleFilter === role }"
                        @click="staffRoleFilter = role"
                    >
                        {{ role }}
                    </button>
                </nav>

                <section class="staff-list">
                    <article
                        v-for="staff in filteredStaffAccounts"
                        :key="staff.employeeId"
                    >
                        <span class="staff-list-avatar">{{ staffInitials(staff.name) }}</span>
                        <div class="staff-list-identity">
                            <strong>{{ staff.name }}</strong>
                            <small>{{ staff.employeeId }}</small>
                        </div>
                        <span class="staff-role-badge" :class="staff.role.toLowerCase()">
                            {{ staff.role }}
                        </span>
                        <span class="staff-status" :class="staff.status">
                            {{ staff.status }}
                        </span>
                        <button
                            type="button"
                            class="staff-edit-button"
                            :disabled="!canEditStaff(staff)"
                            @click="openStaffEdit(staff)"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </article>
                </section>
            </div>

            <div
                v-if="showStaffEditor"
                class="module-modal-backdrop staff-editor-backdrop"
                @click.self="closeStaffEditor"
            >
                <section class="staff-editor-modal" role="dialog" aria-modal="true">
                    <header>
                        <div>
                            <span>STAFF ACCOUNT</span>
                            <h2>{{ editingStaffId ? 'Edit staff' : 'Add staff' }}</h2>
                        </div>
                        <button type="button" aria-label="Close" @click="closeStaffEditor">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>
                    <form @submit.prevent="saveStaffAccount">
                        <label>
                            <span>Staff name</span>
                            <input v-model.trim="staffForm.name" type="text" placeholder="Full name" />
                        </label>
                        <label>
                            <span>Staff ID</span>
                            <input :value="staffForm.employeeId" type="text" readonly />
                        </label>
                        <label>
                            <span>Role</span>
                            <select v-model="staffForm.role">
                                <option v-for="role in availableStaffRoles" :key="role">{{ role }}</option>
                            </select>
                        </label>
                        <label>
                            <span>Status</span>
                            <select v-model="staffForm.status">
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </label>
                        <label>
                            <span>Password</span>
                            <input v-model="staffForm.password" type="password" placeholder="At least 6 characters" />
                        </label>
                        <label>
                            <span>4-digit PIN</span>
                            <input
                                v-model="staffForm.pin"
                                type="password"
                                inputmode="numeric"
                                maxlength="4"
                                placeholder="0000"
                            />
                        </label>
                        <p v-if="staffFormError" class="staff-form-error">{{ staffFormError }}</p>
                        <footer>
                            <button type="button" @click="closeStaffEditor">Cancel</button>
                            <button type="submit">Save staff</button>
                        </footer>
                    </form>
                </section>
            </div>
        </section>
    </div>
</template>
<script>
import {
    STAFF_ROLES,
    loadStaffAccounts,
    nextEmployeeId,
    saveStaffAccounts,
} from '@/services/pos/staff.js'

export default {
    name: 'PosSidebar',
    props: { active: { type: String, default: '' } },
    data() {
        return {
            isOpen: false,
            showStaffManagement: false,
            showStaffEditor: false,
            editingStaffId: '',
            staffAccounts: [],
            staffRoles: STAFF_ROLES,
            staffRoleFilter: 'All',
            staffFormError: '',
            staffForm: {
                name: '',
                employeeId: '',
                role: 'Kitchen',
                status: 'active',
                password: '',
                pin: '',
            },
            items: [
                { label: 'Home', icon: 'fa-house', route: '/pos/start' },
                {
                    label: 'History',
                    icon: 'fa-clock-rotate-left',
                    route: '/pos/transactions',
                },
                { label: 'Menu', icon: 'fa-utensils', route: '/pos/menu' },
                {
                    label: 'Membership',
                    icon: 'fa-address-card',
                    route: '/pos/memberships',
                },
                {
                    label: 'Vouchers',
                    icon: 'fa-ticket',
                    route: '/pos/vouchers',
                },
                {
                    label: 'Reports',
                    icon: 'fa-chart-simple',
                    route: '/pos/reports',
                },
                {
                    label: 'Staff',
                    icon: 'fa-users-gear',
                    action: 'staff',
                    roles: ['Superadmin', 'Admin'],
                },
            ],
        }
    },
    computed: {
        activeAccount() {
            try {
                return (
                    JSON.parse(localStorage.getItem('posfood_active_account'))
                        || {}
                )
            } catch (error) {
                return {}
            }
        },
        accountName() {
            return this.activeAccount.name || 'Admin'
        },
        accountRole() {
            if (this.activeAccount.employeeId === 'EMP001') return 'Superadmin'
            return this.activeAccount.role || 'Kitchen'
        },
        visibleItems() {
            return this.items.filter(
                (item) =>
                    !item.roles || item.roles.includes(this.accountRole),
            )
        },
        availableStaffRoles() {
            return this.accountRole === 'Superadmin'
                ? this.staffRoles
                : ['Kitchen']
        },
        filteredStaffAccounts() {
            return this.staffAccounts.filter(
                (staff) =>
                    this.staffRoleFilter === 'All' ||
                    staff.role === this.staffRoleFilter,
            )
        },
        initials() {
            return (
                this.accountName
                    .split(' ')
                    .map((v) => v[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'AT'
            )
        },
    },
    mounted() {
        window.addEventListener('pos-sidebar:open', this.openSidebar)
    },
    beforeUnmount() {
        window.removeEventListener('pos-sidebar:open', this.openSidebar)
    },
    methods: {
        openSidebar() {
            this.isOpen = true
        },
        goHome() {
            this.isOpen = false
            if (this.$route.path !== '/pos/start')
                this.$router.push('/pos/start')
        },
        navigate(item) {
            this.isOpen = false
            if (item.action === 'staff') {
                this.openStaffManagement()
                return
            }
            if (this.$route.path !== item.route) this.$router.push(item.route)
        },
        emptyStaffForm() {
            return {
                name: '',
                employeeId: '',
                role: 'Kitchen',
                status: 'active',
                password: '',
                pin: '',
            }
        },
        staffInitials(name) {
            return String(name || '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
        openStaffManagement() {
            if (!['Superadmin', 'Admin'].includes(this.accountRole)) return
            this.staffAccounts = loadStaffAccounts()
            this.staffRoleFilter = 'All'
            this.showStaffManagement = true
        },
        closeStaffManagement() {
            this.showStaffManagement = false
            this.closeStaffEditor()
        },
        canEditStaff(staff) {
            return this.accountRole === 'Superadmin' || staff.role === 'Kitchen'
        },
        openStaffCreate() {
            this.editingStaffId = ''
            this.staffFormError = ''
            this.staffForm = {
                ...this.emptyStaffForm(),
                employeeId: nextEmployeeId(this.staffAccounts),
                role: this.availableStaffRoles.includes('Kitchen')
                    ? 'Kitchen'
                    : this.availableStaffRoles[0],
            }
            this.showStaffEditor = true
        },
        openStaffEdit(staff) {
            if (!this.canEditStaff(staff)) return
            this.editingStaffId = staff.employeeId
            this.staffFormError = ''
            this.staffForm = { ...staff }
            this.showStaffEditor = true
        },
        closeStaffEditor() {
            this.showStaffEditor = false
            this.editingStaffId = ''
            this.staffFormError = ''
        },
        saveStaffAccount() {
            if (!this.staffForm.name || !this.staffForm.password || !this.staffForm.pin) {
                this.staffFormError = 'Please complete every field.'
                return
            }
            if (this.staffForm.password.length < 6) {
                this.staffFormError = 'Password must contain at least 6 characters.'
                return
            }
            if (!/^\d{4}$/.test(this.staffForm.pin)) {
                this.staffFormError = 'PIN must be exactly 4 digits.'
                return
            }
            if (!this.availableStaffRoles.includes(this.staffForm.role)) {
                this.staffFormError = 'You cannot assign this role.'
                return
            }
            const staff = { ...this.staffForm }
            const accounts = this.editingStaffId
                ? this.staffAccounts.map((account) =>
                      account.employeeId === this.editingStaffId
                          ? staff
                          : account,
                  )
                : [...this.staffAccounts, staff]
            try {
                this.staffAccounts = saveStaffAccounts(accounts)
            } catch (error) {
                this.staffFormError = 'Unable to save staff account.'
                return
            }
            this.closeStaffEditor()
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
