import PosTopbar from '@/components/common/PosTopbar.vue'
import {
    STAFF_ROLES,
    loadStaffAccounts,
    nextEmployeeId,
    saveStaffAccounts,
} from '@/services/pos/staff.js'
import {
    STAFF_ACCESS_PAGES,
    defaultPermissionsForRole,
    normalizeStaffPermissions,
} from '@/services/pos/permissions.js'
import { render } from './render.js'

export default {
    name: 'POSStaffManagement',
    components: { PosTopbar },
    render,
    data() {
        return {
            showStaffEditor: false,
            showPagePermissions: false,
            editingStaffId: '',
            staffAccounts: loadStaffAccounts(),
            staffRoles: STAFF_ROLES,
            staffAccessPages: STAFF_ACCESS_PAGES,
            staffRoleFilter: 'All',
            staffStatusFilter: 'All',
            staffQuery: '',
            staffFormError: '',
            staffForm: {
                name: '',
                employeeId: '',
                role: 'Kitchen',
                status: 'active',
                password: '',
                pin: '',
                permissions: defaultPermissionsForRole('Kitchen'),
            },
        }
    },
    computed: {
        staffSummary() {
            return {
                total: this.staffAccounts.length,
                active: this.staffAccounts.filter(
                    (staff) => staff.status === 'active',
                ).length,
                disabled: this.staffAccounts.filter(
                    (staff) => staff.status === 'disabled',
                ).length,
            }
        },
        filteredStaffAccounts() {
            const query = this.staffQuery.trim().toLowerCase()
            return this.staffAccounts.filter(
                (staff) =>
                    (this.staffRoleFilter === 'All' ||
                        staff.role === this.staffRoleFilter) &&
                    (this.staffStatusFilter === 'All' ||
                        staff.status ===
                            this.staffStatusFilter.toLowerCase()) &&
                    (!query ||
                        [staff.name, staff.employeeId].some((value) =>
                            String(value || '')
                                .toLowerCase()
                                .includes(query),
                        )),
            )
        },
        roleAccessText() {
            return {
                Superadmin:
                    'Full POS, management, reports, staff and kitchen access.',
                Admin:
                    'Orders, checkout, receipts, history and daily table status.',
                Kitchen:
                    'Kitchen orders and kitchen status updates only.',
            }[this.staffForm.role]
        },
    },
    mounted() {
        this.staffAccounts = loadStaffAccounts()
    },
    methods: {
        emptyStaffForm() {
            return {
                name: '',
                employeeId: '',
                role: 'Kitchen',
                status: 'active',
                password: '',
                pin: '',
                permissions: defaultPermissionsForRole('Kitchen'),
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
        formatLastLogin(value) {
            if (!value) return 'Never'
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return 'Never'
            return new Intl.DateTimeFormat('en-MY', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date)
        },
        openStaffCreate() {
            this.editingStaffId = ''
            this.staffFormError = ''
            this.staffForm = {
                ...this.emptyStaffForm(),
                employeeId: nextEmployeeId(this.staffAccounts),
            }
            this.showPagePermissions = false
            this.showStaffEditor = true
        },
        openStaffEdit(staff) {
            this.editingStaffId = staff.employeeId
            this.staffFormError = ''
            this.staffForm = {
                ...staff,
                permissions: normalizeStaffPermissions(
                    staff.role,
                    staff.permissions,
                ),
            }
            this.showPagePermissions = false
            this.showStaffEditor = true
        },
        setStaffRoleFilter(role) {
            this.staffRoleFilter = role
        },
        setStaffStatusFilter(status) {
            this.staffStatusFilter = status
        },
        changeStaffRole(role) {
            this.staffForm.role = role
            this.staffForm.permissions = defaultPermissionsForRole(role)
        },
        permissionEnabled(page, type) {
            const required =
                type === 'view'
                    ? page.viewPermissions
                    : page.actionPermissions
            return required.every((permission) =>
                this.staffForm.permissions.includes(permission),
            )
        },
        setPagePermission(page, type, enabled) {
            if (this.editingStaffId === 'EMP001') return
            const target =
                type === 'view'
                    ? page.viewPermissions
                    : page.actionPermissions
            const next = new Set(this.staffForm.permissions)
            target.forEach((permission) => {
                if (enabled) next.add(permission)
                else next.delete(permission)
            })

            if (type === 'view' && !enabled) {
                page.actionPermissions.forEach((permission) =>
                    next.delete(permission),
                )
            }
            if (type === 'action' && enabled) {
                page.viewPermissions.forEach((permission) =>
                    next.add(permission),
                )
            }
            this.staffForm.permissions = [...next]
        },
        openPagePermissions() {
            this.showPagePermissions = true
        },
        closePagePermissions() {
            this.showPagePermissions = false
        },
        closeStaffEditor() {
            this.showPagePermissions = false
            this.showStaffEditor = false
            this.editingStaffId = ''
            this.staffFormError = ''
        },
        saveStaffAccount() {
            if (
                !this.staffForm.name ||
                !this.staffForm.password ||
                !this.staffForm.pin
            ) {
                this.staffFormError = 'Please complete every field.'
                return
            }
            if (this.staffForm.password.length < 6) {
                this.staffFormError =
                    'Password must contain at least 6 characters.'
                return
            }
            if (!/^\d{4}$/.test(this.staffForm.pin)) {
                this.staffFormError = 'PIN must be exactly 4 digits.'
                return
            }
            if (!this.staffRoles.includes(this.staffForm.role)) {
                this.staffFormError = 'Please select a valid role.'
                return
            }

            const staff =
                this.editingStaffId === 'EMP001'
                    ? {
                          ...this.staffForm,
                          role: 'Superadmin',
                          status: 'active',
                          permissions: defaultPermissionsForRole('Superadmin'),
                          updatedAt: new Date().toISOString(),
                      }
                    : {
                          ...this.staffForm,
                          createdAt:
                              this.staffForm.createdAt ||
                              new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          permissions: normalizeStaffPermissions(
                              this.staffForm.role,
                              this.staffForm.permissions,
                          ),
                      }
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
    },
}
