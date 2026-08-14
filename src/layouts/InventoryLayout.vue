<template>
    <div class="inv-shell">
        <AppSidebar
            :active="activeSidebarItem"
            :open="menuOpen"
            :account="store.state.activeAccount"
            @close="menuOpen = false"
        />
        <div class="inv-workspace">
            <AppTopbar
                :account="store.state.activeAccount"
                :profile-open="profileOpen"
                @menu="openMenu"
                @profile="toggleProfile"
                @action="handleSidebarAction"
            />
            <main class="inv-page">
                <RouterView />
            </main>
        </div>

        <ProductRegistrationModal
            v-if="registerOpen"
            @close="registerOpen = false"
        />
        <NewInventoryItemPicker
            v-if="newItemPickerOpen"
            @close="newItemPickerOpen = false"
            @product="openProductRegistration"
            @batch="openBatchRegistration"
        />
        <SidebarActionPicker
            v-if="pickerDirection"
            :direction="pickerDirection"
            @close="pickerDirection = ''"
        />
        <BatchDetailsModal
            v-if="selectedBatch"
            :batch="selectedBatch"
            @close="selectedBatch = null"
            @product="openBatchProduct"
            @ship="shipBatch"
        />

        <section v-if="profileOpen" class="profile-popover sidebar-profile-menu" role="dialog" aria-label="Account menu">
            <header>
                <span>{{ accountInitials }}</span>
                <div>
                    <strong>{{ store.state.activeAccount?.name }}</strong>
                    <small>{{ store.state.activeAccount?.role }}</small>
                </div>
            </header>
            <button type="button" @click="goProfile">
                <i class="fa-solid fa-user"></i>My account
            </button>
            <button type="button" @click="lock">
                <i class="fa-solid fa-lock"></i>Lock session
            </button>
            <button type="button" class="danger-text" @click="logout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>Sign out
            </button>
        </section>

        <div v-if="accountEditorOpen" class="modal-backdrop account-editor-backdrop" @click.self="closeAccountEditor">
            <form class="account-editor-modal" @submit.prevent="saveAccount">
                <header class="modal-header">
                    <div>
                        <h2>My Account</h2>
                        <p class="mono">{{ accountForm.employeeId }}</p>
                    </div>
                    <button class="icon-button" type="button" aria-label="Close account form" @click="closeAccountEditor">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>
                <div class="account-editor-body">
                    <label>
                        <span>Name *</span>
                        <input v-model.trim="accountForm.name" type="text" required />
                    </label>
                    <label>
                        <span>Staff ID</span>
                        <input :value="accountForm.employeeId" class="mono" type="text" readonly />
                    </label>
                    <label>
                        <span>Gmail / Email</span>
                        <input v-model.trim="accountForm.email" type="email" placeholder="name@gmail.com" />
                    </label>
                    <label>
                        <span>Phone</span>
                        <input v-model.trim="accountForm.phone" type="tel" placeholder="Optional" />
                    </label>
                    <label>
                        <span>Date of birth</span>
                        <input v-model="accountForm.birthDate" type="date" />
                    </label>
                    <label>
                        <span>4-digit PIN</span>
                        <input v-model="accountForm.pin" type="password" inputmode="numeric" maxlength="4" placeholder="Leave blank to keep current PIN" />
                    </label>
                    <label>
                        <span>New password</span>
                        <input v-model="accountForm.password" type="password" autocomplete="new-password" placeholder="Leave blank to keep current password" />
                    </label>
                    <label>
                        <span>Confirm password</span>
                        <input v-model="accountForm.confirmPassword" type="password" autocomplete="new-password" />
                    </label>
                    <p v-if="accountError" class="account-editor-error">
                        <i class="fa-solid fa-circle-exclamation"></i>{{ accountError }}
                    </p>
                </div>
                <footer>
                    <button class="button secondary" type="button" @click="closeAccountEditor">Cancel</button>
                    <button class="button primary" type="submit"><i class="fa-solid fa-check"></i>Save</button>
                </footer>
            </form>
        </div>

        <button
            v-if="profileOpen"
            class="popover-scrim"
            type="button"
            aria-label="Close account menu"
            @click="profileOpen = false"
        ></button>
    </div>
</template>

<script>
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppTopbar from '@/components/common/AppTopbar.vue'
import ProductRegistrationModal from '@/components/product/ProductRegistrationModal.vue'
import NewInventoryItemPicker from '@/components/common/NewInventoryItemPicker.vue'
import SidebarActionPicker from '@/components/common/SidebarActionPicker.vue'
import BatchDetailsModal from '@/components/stock/BatchDetailsModal.vue'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'InventoryLayout',
    components: {
        AppSidebar,
        AppTopbar,
        ProductRegistrationModal,
        NewInventoryItemPicker,
        SidebarActionPicker,
        BatchDetailsModal,
    },
    data() {
        return {
            store: inventoryStore,
            menuOpen: false,
            profileOpen: false,
            registerOpen: false,
            newItemPickerOpen: false,
            pickerDirection: '',
            selectedBatch: null,
            accountEditorOpen: false,
            accountError: '',
            accountForm: { employeeId: '', name: '', email: '', phone: '', birthDate: '', pin: '', password: '', confirmPassword: '' },
        }
    },
    computed: {
        activeSidebarItem() {
            if (this.$route.name === 'dispatch' && this.$route.query.mode === 'move') return 'stock-movement'
            return this.$route.meta.nav || ''
        },
        accountInitials() {
            return (this.store.state.activeAccount?.name || '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
    },
    watch: {
        '$route.fullPath'() {
            this.profileOpen = false
            this.menuOpen = false
        },
    },
    methods: {
        openMenu() {
            this.profileOpen = false
            this.menuOpen = true
        },
        toggleProfile() {
            this.menuOpen = false
            this.profileOpen = !this.profileOpen
        },
        handleSidebarAction(action) {
            this.menuOpen = false
            this.profileOpen = false
            if (action === 'register') this.registerOpen = true
            if (action === 'new') this.newItemPickerOpen = true
            if (action === 'scan') this.$router.push({ name: 'scan' })
            if (action === 'ship') this.$router.push({ name: 'dispatch', query: { mode: 'ship' } })
            if (action === 'in') this.$router.push({ name: 'receive', query: { choose: '1', from: 'dashboard' } })
            if (action === 'out') this.pickerDirection = action
        },
        openProductRegistration() {
            this.newItemPickerOpen = false
            this.registerOpen = true
        },
        openBatchRegistration() {
            this.newItemPickerOpen = false
            this.$router.push({ name: 'receive', query: { registerBatch: '1' } })
        },
        openBatchProduct(productId) {
            const product = this.store.findProduct(productId)
            this.selectedBatch = null
            if (product) this.$router.push({ name: 'products', query: { product: product.id, open: '1' } })
        },
        shipBatch(batchOrId) {
            const batchId = typeof batchOrId === 'object' ? batchOrId?.id : batchOrId
            this.selectedBatch = null
            this.$router.push({ name: 'dispatch', query: { mode: 'ship', source: 'batch', batch: batchId } })
        },
        goProfile() {
            this.profileOpen = false
            const account = this.store.currentStaff() || {}
            this.accountError = ''
            this.accountForm = {
                employeeId: account.employeeId || '',
                name: account.name || '',
                email: account.email || '',
                phone: account.phone || '',
                birthDate: account.birthDate || '',
                pin: '',
                password: '',
                confirmPassword: '',
            }
            this.accountEditorOpen = true
        },
        closeAccountEditor() {
            this.accountEditorOpen = false
            this.accountError = ''
        },
        saveAccount() {
            this.accountError = ''
            if (this.accountForm.password !== this.accountForm.confirmPassword) {
                this.accountError = 'The new passwords do not match.'
                return
            }
            try {
                this.store.updateMyAccount(this.accountForm)
                this.store.addToast('Account updated.')
                this.closeAccountEditor()
            } catch (error) {
                this.accountError = error.message
            }
        },
        lock() {
            this.store.lockSession()
            this.$router.replace({ path: '/', query: { locked: '1' } })
        },
        async logout() {
            this.profileOpen = false
            this.store.logout()
            try {
                await this.$router.replace({ name: 'login' })
            } catch (error) {
                window.location.replace('/')
            }
        },
    },
}
</script>
