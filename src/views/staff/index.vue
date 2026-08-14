<template>
    <div class="staff-page">
        <section class="staff-heading">
            <div><h1 class="inventory-page-title">Staff Management</h1></div>
            <button
                v-if="canManage"
                class="staff-primary"
                type="button"
                @click="openCreate"
            >
                <i class="fa-solid fa-user-plus"></i>
                Add Staff
            </button>
        </section>

        <section class="staff-summary">
            <article>
                <span class="summary-icon teal"><i class="fa-solid fa-users"></i></span>
                <div><small>Total Staff</small><strong>{{ summary.total }}</strong></div>
            </article>
            <article>
                <span class="summary-icon green"><i class="fa-solid fa-user-check"></i></span>
                <div><small>Active</small><strong>{{ summary.active }}</strong></div>
            </article>
            <article>
                <span class="summary-icon amber"><i class="fa-solid fa-user-shield"></i></span>
                <div><small>Managers</small><strong>{{ summary.managers }}</strong></div>
            </article>
            <article>
                <span class="summary-icon red"><i class="fa-solid fa-user-lock"></i></span>
                <div><small>Unavailable</small><strong>{{ summary.disabled }}</strong></div>
            </article>
        </section>

        <section class="staff-panel">
            <header class="staff-toolbar">
                <label class="staff-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input
                        v-model.trim="query"
                        type="search"
                        placeholder="Search staff name or ID"
                    />
                </label>
                <label>
                    <ScrollableSelect v-model="roleFilter" aria-label="Filter by role">
                        <option value="">All roles</option>
                        <option v-for="role in roles" :key="role" :value="role">
                            {{ role }}
                        </option>
                    </ScrollableSelect>
                </label>
                <label>
                    <ScrollableSelect v-model="statusFilter" aria-label="Filter by status">
                        <option value="">All status</option>
                        <option value="active">Active</option>
                        <option value="disabled">Unavailable</option>
                    </ScrollableSelect>
                </label>
            </header>

            <div class="staff-table" role="table" aria-label="Staff accounts">
                <div class="staff-table-head" role="row">
                    <span>Staff</span>
                    <span>Role</span>
                    <span>Last Login</span>
                    <span>Last Inventory Activity</span>
                    <span>Status</span>
                    <span></span>
                </div>
                <button
                    v-for="staff in pagedStaff"
                    :key="staff.employeeId"
                    class="staff-row"
                    type="button"
                    role="row"
                    @click="openEdit(staff)"
                >
                    <span class="staff-list-identity">
                        <span class="staff-avatar">{{ initials(staff.name) }}</span>
                        <span>
                            <strong>{{ staff.name }}</strong>
                            <small class="mono">{{ staff.employeeId }}</small>
                        </span>
                    </span>
                    <span>
                        <span class="role-chip" :class="roleClass(staff.role)">
                            {{ staff.role }}
                        </span>
                    </span>
                    <span class="staff-date">{{ formatDate(staff.lastLoginAt) }}</span>
                    <span class="staff-activity">
                        <strong>{{ lastActivity(staff).label }}</strong>
                        <small>{{ lastActivity(staff).time }}</small>
                    </span>
                    <span>
                        <span class="status-chip" :class="staff.status">
                            {{ staff.status === 'active' ? 'Active' : 'Unavailable' }}
                        </span>
                    </span>
                    <i class="fa-solid fa-chevron-right staff-row-chevron" aria-hidden="true"></i>
                </button>
                <div v-if="!filteredStaff.length" class="staff-empty">
                    <i class="fa-solid fa-user-slash"></i>
                    <strong>No matching staff</strong>
                </div>
            </div>
            <footer v-if="filteredStaff.length" class="staff-pagination">
                <button type="button" class="staff-pagination-nav" aria-label="Previous page" :disabled="staffPage <= 1" @click="staffPage -= 1"><i class="fa-solid fa-chevron-left"></i></button>
                <button
                    v-for="page in staffPaginationItems"
                    :key="`staff-page-${page}`"
                    type="button"
                    class="staff-pagination-page"
                    :class="{ active: page === staffPage, ellipsis: typeof page !== 'number' }"
                    @click="typeof page === 'number' && (staffPage = page)"
                >{{ paginationLabel(page) }}</button>
                <button type="button" class="staff-pagination-nav" aria-label="Next page" :disabled="staffPage >= staffPageCount" @click="staffPage += 1"><i class="fa-solid fa-chevron-right"></i></button>
            </footer>
        </section>

        <div
            v-if="editorOpen"
            class="staff-modal-backdrop"
            @mousedown.self="closeEditor"
        >
            <section
                class="staff-modal"
                role="dialog"
                aria-modal="true"
                :aria-label="editingId ? 'Edit staff' : 'Add staff'"
            >
                <header>
                    <div>
                        <span class="eyebrow">STAFF ACCOUNT</span>
                        <h2>{{ editingId ? 'Edit Staff' : 'Add Staff' }}</h2>
                    </div>
                    <button type="button" aria-label="Close" @click="closeEditor">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <form @submit.prevent="save">
                    <div class="staff-form-body">
                        <section class="account-section">
                            <div class="form-grid">
                                <label>
                                    <span>Staff Name *</span>
                                    <input
                                        v-model.trim="form.name"
                                        type="text"
                                        placeholder="Full name"
                                        autocomplete="off"
                                    />
                                </label>
                                <label>
                                    <span>Staff ID</span>
                                    <input
                                        :value="form.employeeId"
                                        class="mono"
                                        type="text"
                                        readonly
                                    />
                                </label>
                                <label>
                                    <span>Role *</span>
                                    <ScrollableSelect
                                        v-model="form.role"
                                        :disabled="roleLocked"
                                        @change="applyRoleDefaults"
                                    >
                                        <option v-for="role in availableRoles" :key="role">
                                            {{ role }}
                                        </option>
                                    </ScrollableSelect>
                                </label>
                                <label>
                                    <span>Status *</span>
                                    <ScrollableSelect
                                        v-model="form.status"
                                        :disabled="statusLocked"
                                    >
                                        <option value="active">Active</option>
                                        <option value="disabled">Unavailable</option>
                                    </ScrollableSelect>
                                </label>
                                <label>
                                    <span>Phone</span>
                                    <input
                                        v-model.trim="form.phone"
                                        type="tel"
                                        placeholder="Optional"
                                    />
                                </label>
                                <label>
                                    <span>Email</span>
                                    <input
                                        v-model.trim="form.email"
                                        type="email"
                                        placeholder="Optional"
                                    />
                                </label>
                                <label>
                                    <span>Password *</span>
                                    <input
                                        v-model="form.password"
                                        type="password"
                                        placeholder="At least 6 characters"
                                        autocomplete="new-password"
                                    />
                                </label>
                                <label>
                                    <span>4-digit PIN *</span>
                                    <input
                                        v-model="form.pin"
                                        type="password"
                                        inputmode="numeric"
                                        maxlength="4"
                                        placeholder="0000"
                                        autocomplete="new-password"
                                    />
                                </label>
                            </div>

                            <div class="staff-qr-preview">
                                <span><i class="fa-solid fa-qrcode"></i></span>
                                <div>
                                    <small>STAFF QR CODE</small>
                                    <strong class="mono">{{ form.qrCode }}</strong>
                                </div>
                            </div>
                        </section>

                        <section class="permission-section">
                            <div class="permission-heading">
                                <div>
                                    <span class="eyebrow">MODULE ACCESS</span>
                                    <h3>Permissions</h3>
                                </div>
                                <small v-if="protectedAccount">Protected</small>
                            </div>

                            <div class="permission-list">
                                <article
                                    v-for="module in accessModules"
                                    :key="module.id"
                                >
                                    <span class="permission-icon">
                                        <i class="fa-solid" :class="module.icon"></i>
                                    </span>
                                    <div>
                                        <strong>{{ module.label }}</strong>
                                    </div>
                                    <label class="permission-toggle">
                                        <input
                                            type="checkbox"
                                            :checked="moduleEnabled(module)"
                                            :disabled="permissionLocked"
                                            @change="toggleModule(module, $event.target.checked)"
                                        />
                                        <span>Access</span>
                                    </label>
                                </article>
                            </div>
                        </section>
                    </div>

                    <p v-if="formError" class="staff-error">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        {{ formError }}
                    </p>

                    <footer>
                        <button type="button" @click="closeEditor">Cancel</button>
                        <button class="staff-primary" type="submit">
                            <i class="fa-solid fa-check"></i>
                            Save Staff
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    </div>
</template>

<script>
import { inventoryStore } from '@/services/inventoryStore'
import { paginationItems, paginationLabel } from '@/utils/pagination'
import {
    ACCESS_MODULES,
    PERMISSIONS,
    ROLES,
    defaultPermissionsForRole,
} from '@/services/permissions'

export default {
    name: 'StaffView',
    data() {
        return {
            store: inventoryStore,
            roles: ROLES.filter((role) => role !== 'Developer'),
            accessModules: ACCESS_MODULES,
            query: '',
            roleFilter: '',
            statusFilter: '',
            editorOpen: false,
            editingId: '',
            formError: '',
            form: this.emptyForm(),
            staffPage: 1,
        }
    },
    computed: {
        canManage() {
            return this.store.can(PERMISSIONS.MANAGE_STAFF)
        },
        visibleStaff() {
            return this.store.state.staff.filter((staff) => staff.role !== 'Developer')
        },
        summary() {
            return {
                total: this.visibleStaff.length,
                active: this.visibleStaff.filter(
                    (staff) => staff.status === 'active',
                ).length,
                managers: this.visibleStaff.filter((staff) =>
                    ['Superadmin', 'Inventory Manager'].includes(staff.role),
                ).length,
                disabled: this.visibleStaff.filter(
                    (staff) => staff.status === 'disabled',
                ).length,
            }
        },
        filteredStaff() {
            const query = this.query.toLowerCase()
            return this.visibleStaff.filter(
                (staff) =>
                    (!this.roleFilter || staff.role === this.roleFilter) &&
                    (!this.statusFilter ||
                        staff.status === this.statusFilter) &&
                    (!query ||
                        staff.name.toLowerCase().includes(query) ||
                        staff.employeeId.toLowerCase().includes(query)),
            )
        },
        staffPageCount() {
            return Math.max(1, Math.ceil(this.filteredStaff.length / 5))
        },
        staffPaginationItems() {
            return paginationItems(this.staffPage, this.staffPageCount)
        },
        pagedStaff() {
            const start = (this.staffPage - 1) * 5
            return this.filteredStaff.slice(start, start + 5)
        },
        currentRole() {
            return this.store.currentStaff()?.role || ''
        },
        currentIsDeveloper() {
            return this.currentRole === 'Developer'
        },
        availableRoles() {
            return this.currentIsDeveloper
                ? this.roles
                : this.roles.filter((role) => role !== 'Developer')
        },
        editingStaff() {
            return this.editingId
                ? this.store.state.staff.find((staff) => staff.employeeId === this.editingId) || null
                : null
        },
        targetRole() {
            return this.editingStaff?.role || this.form.role
        },
        targetIsDeveloper() {
            return this.targetRole === 'Developer'
        },
        targetIsSuperadmin() {
            return this.targetRole === 'Superadmin'
        },
        roleLocked() {
            return this.targetIsDeveloper || this.targetIsSuperadmin
        },
        statusLocked() {
            return this.targetIsDeveloper || (this.targetIsSuperadmin && !this.currentIsDeveloper)
        },
        permissionLocked() {
            return this.targetIsDeveloper || (this.targetIsSuperadmin && !this.currentIsDeveloper)
        },
        protectedAccount() {
            return this.targetIsDeveloper || (this.targetIsSuperadmin && !this.currentIsDeveloper)
        },
    },
    watch: {
        query() { this.staffPage = 1 },
        roleFilter() { this.staffPage = 1 },
        statusFilter() { this.staffPage = 1 },
        filteredStaff() { if (this.staffPage > this.staffPageCount) this.staffPage = this.staffPageCount },
    },
    methods: {
        paginationLabel,
        emptyForm() {
            const role = 'Warehouse Staff'
            const employeeId = this?.store?.nextEmployeeId?.() || 'INV004'
            return {
                name: '',
                employeeId,
                role,
                status: 'active',
                phone: '',
                email: '',
                password: '',
                pin: '',
                barcode: `STAFF-${employeeId}`,
                qrCode: `IMS:STAFF:${employeeId}`,
                permissions: defaultPermissionsForRole(role),
            }
        },
        initials(name) {
            return String(name || '')
                .split(/\s+/)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
        roleClass(role) {
            return String(role).toLowerCase().replaceAll(' ', '-')
        },
        formatDate(value) {
            if (!value) return 'Never'
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return 'Never'
            return new Intl.DateTimeFormat('en-MY', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date)
        },
        lastActivity(staff) {
            const movement = this.store.state.movements.find(
                (item) => item.staffId === staff.employeeId,
            )
            if (!movement) return { label: 'No activity', time: '—' }
            const quantity = this.store.movementQuantity(movement)
            const formatted = new Intl.NumberFormat('en-MY', {
                maximumFractionDigits: 2,
            }).format(quantity)
            return {
                label: this.store.isTransferMovement(movement)
                    ? `${movement.type} ${formatted} moved`
                    : `${movement.type} ${quantity > 0 ? '+' : ''}${formatted}`,
                time: this.formatDate(movement.createdAt),
            }
        },
        openCreate() {
            this.editingId = ''
            this.formError = ''
            this.form = this.emptyForm()
            this.editorOpen = true
        },
        openEdit(staff) {
            if (!this.canManage) return
            if (staff.role === 'Developer' && !this.currentIsDeveloper) {
                this.store.addToast('Developer account can only be edited by Developer.', 'danger')
                return
            }
            this.editingId = staff.employeeId
            this.formError = ''
            this.form = {
                ...staff,
                permissions: [...staff.permissions],
            }
            this.editorOpen = true
        },
        closeEditor() {
            this.editorOpen = false
            this.editingId = ''
            this.formError = ''
        },
        applyRoleDefaults() {
            this.form.permissions = defaultPermissionsForRole(this.form.role)
        },
        modulePermissions(module) {
            return [
                module.view,
                module.action,
                ...(module.actions || []),
            ].filter(Boolean)
        },
        moduleEnabled(module) {
            return this.modulePermissions(module).some((permission) =>
                this.form.permissions.includes(permission),
            )
        },
        toggleModule(module, enabled) {
            const permissions = new Set(this.form.permissions)
            this.modulePermissions(module).forEach((permission) => {
                if (enabled) permissions.add(permission)
                else permissions.delete(permission)
            })
            this.form.permissions = [...permissions]
        },
        save() {
            this.formError = ''
            try {
                this.store.saveStaff(this.form, this.editingId)
                this.store.addToast(
                    this.editingId
                        ? 'Staff account updated.'
                        : 'Staff account created.',
                )
                this.closeEditor()
            } catch (error) {
                this.formError = error.message
            }
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/staff.css"></style>
