<template>
    <main class="login-page login-page-simple">
        <section class="login-form-panel simple-login-panel">
            <div class="login-form-wrap login-form-card">
                <div class="login-card-brand">
                    <span><i class="fa-solid fa-boxes-stacked"></i></span>
                    <div><strong>INVENTORY</strong><small>MANAGEMENT SYSTEM</small></div>
                </div>
                <transition name="form-swap" mode="out-in">
                    <div v-if="step === 'credentials'" key="credentials">
                        <h2>{{ isUnlocking ? 'Session locked' : 'Sign in' }}</h2>

                        <div v-if="!isUnlocking" class="login-tabs">
                            <button :class="{ active: mode === 'qr' }" type="button" @click="setMode('qr')">
                                <i class="fa-solid fa-qrcode"></i>Staff QR
                            </button>
                            <button :class="{ active: mode === 'password' }" type="button" @click="setMode('password')">
                                <i class="fa-solid fa-key"></i>ID & Password
                            </button>
                        </div>

                        <button v-if="mode === 'qr' && !isUnlocking" class="staff-card-scan" type="button" @click="scannerOpen = true">
                            <span><i class="fa-solid fa-camera"></i></span>
                            <strong>Scan staff QR code</strong>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>

                        <form v-else-if="!isUnlocking" class="login-fields" @submit.prevent="verifyPassword">
                            <label>
                                <span>Staff ID</span>
                                <div><i class="fa-regular fa-id-badge"></i><input v-model.trim="credentials.employeeId" type="text" autocomplete="username" /></div>
                            </label>
                            <label>
                                <span>Password</span>
                                <div><i class="fa-solid fa-lock"></i><input v-model="credentials.password" type="password" autocomplete="current-password" /></div>
                            </label>
                            <button class="button primary full-width" type="submit">Continue<i class="fa-solid fa-arrow-right"></i></button>
                        </form>

                        <button v-else class="button primary full-width" type="button" @click="prepareLockedAccount">
                            Continue to PIN<i class="fa-solid fa-arrow-right"></i>
                        </button>

                        <p v-if="message" class="form-error"><i class="fa-solid fa-circle-exclamation"></i>{{ message }}</p>
                    </div>

                    <div v-else key="pin" class="pin-login">
                        <button v-if="!isUnlocking" class="back-link" type="button" @click="back">
                            <i class="fa-solid fa-arrow-left"></i>Back
                        </button>
                        <div class="staff-identity">
                            <span>{{ initials }}</span>
                            <div><strong>{{ pendingAccount.name }}</strong><small>{{ pendingAccount.employeeId }} · {{ pendingAccount.role }}</small></div>
                        </div>
                        <h2>Enter PIN</h2>
                        <div class="pin-dots" aria-label="Four digit PIN">
                            <span v-for="index in 4" :key="index" :class="{ filled: pin.length >= index }"></span>
                        </div>
                        <div class="pin-pad">
                            <button v-for="number in [1,2,3,4,5,6,7,8,9]" :key="number" type="button" @click="pressPin(number)">{{ number }}</button>
                            <button class="pin-command" type="button" @click="pin = ''">CLEAR</button>
                            <button type="button" @click="pressPin(0)">0</button>
                            <button class="pin-command" type="button" aria-label="Delete digit" @click="pin = pin.slice(0, -1)"><i class="fa-solid fa-delete-left"></i></button>
                        </div>
                        <p v-if="message" class="form-error"><i class="fa-solid fa-circle-exclamation"></i>{{ message }}</p>
                    </div>
                </transition>
            </div>
            <p class="login-device-status"><span></span>Main Warehouse</p>
        </section>

        <ScannerModal
            v-if="scannerOpen"
            mode="staff"
            title="Scan staff QR code"
            @close="scannerOpen = false"
            @scanned="handleStaffScan"
        />
    </main>
</template>

<script>
import ScannerModal from '@/components/common/ScannerModal.vue'
import { inventoryStore } from '@/services/inventoryStore'

export default {
    name: 'LoginView',
    components: { ScannerModal },
    data() {
        return {
            store: inventoryStore,
            step: 'credentials',
            mode: 'qr',
            scannerOpen: false,
            pendingAccount: null,
            pin: '',
            message: '',
            credentials: {
                employeeId: 'INV001',
                password: 'inventory123',
            },
        }
    },
    computed: {
        isUnlocking() {
            return this.$route.query.locked === '1' && Boolean(this.store.state.activeAccount)
        },
        initials() {
            return (this.pendingAccount?.name || '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
    },
    mounted() {
        if (this.isUnlocking) this.prepareLockedAccount()
    },
    methods: {
        setMode(mode) {
            this.mode = mode
            this.message = ''
        },
        prepareLockedAccount() {
            const account = this.store.findStaff(this.store.state.activeAccount?.employeeId)
            if (!account) {
                this.store.logout()
                this.message = 'This staff account is no longer active.'
                return
            }
            this.pendingAccount = account
            this.step = 'pin'
        },
        verifyPassword() {
            const account = this.store.findStaff(this.credentials.employeeId)
            if (!account || account.password !== this.credentials.password) {
                this.message = 'Staff ID or password is incorrect.'
                return
            }
            this.pendingAccount = account
            this.pin = ''
            this.message = ''
            this.step = 'pin'
        },
        handleStaffScan(value) {
            this.scannerOpen = false
            const account = this.store.findStaff(value)
            if (!account) {
                this.message = 'Staff QR code was not recognised.'
                return
            }
            this.pendingAccount = account
            this.pin = ''
            this.message = ''
            this.step = 'pin'
        },
        pressPin(number) {
            if (this.pin.length >= 4) return
            this.pin += String(number)
            this.message = ''
            if (this.pin.length === 4) window.setTimeout(this.verifyPin, 120)
        },
        verifyPin() {
            if (this.pin !== this.pendingAccount.pin) {
                this.message = 'PIN is incorrect.'
                this.pin = ''
                return
            }
            if (this.isUnlocking) this.store.unlockSession()
            else this.store.startSession(this.pendingAccount)
            this.$router.replace('/inventory/dashboard')
        },
        back() {
            this.step = 'credentials'
            this.pendingAccount = null
            this.pin = ''
            this.message = ''
        },
    },
}
</script>

<style scoped src="@/assets/css/pages/login.css"></style>
