<template>
    <main class="login-page" :style="{ '--login-bg': `url(${backgroundImg})` }">
        <div class="brand-mark">posfood</div>

        <section class="login-panel">
            <div class="panel-texture"></div>

            <transition name="form-swap" mode="out-in">
                <div
                    :key="loginStep"
                    class="login-form"
                    :class="{ 'login-pin-form': loginStep === 'pin' }"
                >
                    <p class="eyebrow">
                        {{ isUnlocking ? 'Session locked' : 'Welcome back' }}
                    </p>
                    <h1>{{ loginStep === 'pin' ? 'Enter PIN' : 'Login' }}</h1>

                    <div
                        v-if="loginStep === 'credentials'"
                        class="login-mode-tabs"
                    >
                        <button
                            type="button"
                            :class="{ active: loginMode === 'qr' }"
                            @click="setLoginMode('qr')"
                        >
                            <i class="fa-solid fa-qrcode"></i>Scan QR
                        </button>
                        <button
                            type="button"
                            :class="{ active: loginMode === 'password' }"
                            @click="setLoginMode('password')"
                        >
                            <i class="fa-solid fa-keyboard"></i>ID & Password
                        </button>
                    </div>

                    <form
                        v-if="
                            loginStep === 'credentials' &&
                            loginMode === 'password'
                        "
                        @submit.prevent="verifyCredentials"
                    >
                        <label class="input-row">
                            <i class="fa-solid fa-id-badge"></i>
                            <input
                                v-model.trim="loginForm.employeeId"
                                type="text"
                                autocomplete="username"
                                placeholder="Staff ID"
                            />
                        </label>

                        <label class="input-row">
                            <i class="fa-solid fa-key"></i>
                            <input
                                v-model="loginForm.password"
                                type="password"
                                autocomplete="current-password"
                                placeholder="Password"
                            />
                        </label>

                        <p v-if="formMessage" class="form-message">
                            {{ formMessage }}
                        </p>

                        <div class="form-bottom">
                            <span class="demo-hint"
                                >Demo: EMP001 / restro123</span
                            >
                            <button class="login-button" type="submit">
                                Continue <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </form>

                    <div
                        v-else-if="loginStep === 'credentials'"
                        class="staff-qr-login"
                    >
                        <button
                            type="button"
                            class="qr-scan-box"
                            @click="scanStaffQr"
                        >
                            <span class="staff-camera-icon">
                                <i class="fa-solid fa-camera"></i>
                            </span>
                            <strong>Scan staff card QR</strong>
                            <span>Scan identity, then enter your PIN</span>
                        </button>
                        <p v-if="formMessage" class="form-message">
                            {{ formMessage }}
                        </p>
                    </div>

                    <section v-else class="login-pin-lock">
                        <div class="login-pin-photo">
                            {{ accountInitials }}
                        </div>
                        <h2>{{ pendingAccount?.name }}</h2>
                        <p class="login-pin-role">
                            {{ pendingAccount?.employeeId }} &middot;
                            {{ pendingAccount?.role }}
                        </p>
                        <p class="login-pin-prompt">
                            Enter your PIN to continue
                        </p>

                        <div class="login-pin-boxes">
                            <span
                                v-for="index in 4"
                                :key="index"
                                :class="{
                                    filled: loginForm.pin.length >= index,
                                }"
                            >{{ loginForm.pin.length >= index ? '*' : '' }}</span>
                        </div>

                        <div class="login-pin-pad">
                            <button
                                v-for="number in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
                                :key="number"
                                type="button"
                                @click="pressLoginPin(number)"
                            >
                                {{ number }}
                            </button>
                            <button type="button" @click="clearLoginPin">
                                CLEAR
                            </button>
                            <button type="button" @click="pressLoginPin(0)">
                                0
                            </button>
                            <button
                                type="button"
                                aria-label="Backspace"
                                @click="backspaceLoginPin"
                            >
                                <i class="fa-solid fa-delete-left"></i>
                            </button>
                        </div>

                        <p v-if="formMessage" class="login-pin-error">
                            {{ formMessage }}
                        </p>
                        <button
                            v-if="!isUnlocking"
                            class="login-pin-back"
                            type="button"
                            @click="backToCredentials"
                        >
                            Back
                        </button>
                    </section>
                </div>
            </transition>
        </section>
        <CameraScannerModal
            v-if="showStaffScanner"
            title="Scan staff card"
            subtitle="Use this device camera to scan the worker ID card"
            action-label="Complete demo staff scan"
            hint="Position the staff card QR inside the frame"
            unavailable-message="Allow camera permission, or close this window and sign in manually."
            @close="showStaffScanner = false"
            @action="completeStaffScan"
            @scanned="completeStaffScan"
        />
    </main>
</template>

<script>
import backgroundImg from '@/assets/img/background/dark_background.jpg'
import CameraScannerModal from '@/components/common/CameraScannerModal.vue'
import { findStaffAccount } from '@/services/pos/staff.js'

export default {
    name: 'POSLogin',
    components: { CameraScannerModal },
    data() {
        return {
            backgroundImg,
            loginStep: 'credentials',
            loginMode: 'qr',
            showStaffScanner: false,
            isUnlocking: false,
            pendingAccount: null,
            formMessage: '',
            pinResetTimer: null,
            loginForm: {
                employeeId: 'EMP001',
                password: 'restro123',
                pin: '',
            },
        }
    },
    computed: {
        accountInitials() {
            return String(this.pendingAccount?.name || '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
    },
    mounted() {
        if (
            this.$route.query.locked === '1' ||
            localStorage.getItem('posfood_session_locked') === '1'
        ) {
            this.prepareLockedSession()
        }
    },
    beforeUnmount() {
        window.clearTimeout(this.pinResetTimer)
    },
    methods: {
        prepareLockedSession() {
            let activeAccount = null
            try {
                activeAccount = JSON.parse(
                    localStorage.getItem('posfood_active_account'),
                )
            } catch (error) {
                activeAccount = null
            }
            const account = findStaffAccount(activeAccount?.employeeId)
            if (!account) {
                localStorage.removeItem('posfood_session_locked')
                return
            }
            this.isUnlocking = true
            this.pendingAccount = account
            this.loginStep = 'pin'
        },
        verifyCredentials() {
            const account = findStaffAccount(this.loginForm.employeeId)
            if (
                !account ||
                account.status !== 'active' ||
                this.loginForm.password !== account.password
            ) {
                this.formMessage = 'Staff ID or password is incorrect.'
                return
            }
            this.pendingAccount = account
            this.loginForm.pin = ''
            this.formMessage = ''
            this.loginStep = 'pin'
        },
        setLoginMode(mode) {
            this.loginMode = mode
            this.formMessage = ''
        },
        scanStaffQr() {
            this.showStaffScanner = true
            this.formMessage = ''
        },
        completeStaffScan() {
            const account = findStaffAccount('EMP001')
            this.showStaffScanner = false
            if (!account || account.status !== 'active') {
                this.formMessage = 'This staff account is not available.'
                return
            }
            this.pendingAccount = account
            this.loginForm.employeeId = account.employeeId
            this.loginForm.pin = ''
            this.formMessage = ''
            this.loginStep = 'pin'
        },
        pressLoginPin(number) {
            if (this.loginForm.pin.length >= 4) return
            this.formMessage = ''
            this.loginForm.pin += String(number)
            if (this.loginForm.pin.length === 4) this.verifyPin()
        },
        clearLoginPin() {
            window.clearTimeout(this.pinResetTimer)
            this.loginForm.pin = ''
            this.formMessage = ''
        },
        backspaceLoginPin() {
            window.clearTimeout(this.pinResetTimer)
            this.loginForm.pin = this.loginForm.pin.slice(0, -1)
            this.formMessage = ''
        },
        verifyPin() {
            if (
                !this.pendingAccount ||
                this.loginForm.pin !== this.pendingAccount.pin
            ) {
                this.formMessage = 'Staff PIN is incorrect.'
                window.clearTimeout(this.pinResetTimer)
                this.pinResetTimer = window.setTimeout(() => {
                    this.loginForm.pin = ''
                }, 350)
                return
            }
            localStorage.setItem(
                'posfood_active_account',
                JSON.stringify({
                    name: this.pendingAccount.name,
                    employeeId: this.pendingAccount.employeeId,
                    role: this.pendingAccount.role,
                }),
            )
            localStorage.removeItem('posfood_session_locked')
            this.$router.replace('/pos/start')
        },
        backToCredentials() {
            this.loginStep = 'credentials'
            this.pendingAccount = null
            this.loginForm.pin = ''
            this.formMessage = ''
        },
    },
}
</script>
