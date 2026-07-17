<template>
    <main class="login-page" :style="{ '--login-bg': `url(${backgroundImg})` }">
        <div class="brand-mark">posfood</div>

        <section class="login-panel">
            <div class="panel-texture"></div>

            <transition name="form-swap" mode="out-in">
                <div v-if="!isRegister" key="login" class="login-form">
                    <p class="eyebrow">Welcome back</p>
                    <h1>Login</h1>

                    <div class="login-mode-tabs">
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
                            <i class="fa-solid fa-keyboard"></i>Enter Password
                        </button>
                    </div>

                    <form @submit.prevent="loginAccount">
                        <div v-if="loginMode === 'qr'" class="staff-qr-login">
                            <button
                                type="button"
                                class="qr-scan-box"
                                :class="{ scanned: qrScanned }"
                                @click="scanStaffQr"
                            >
                                <span class="staff-camera-icon"
                                    ><i
                                        class="fa-solid"
                                        :class="
                                            qrScanned
                                                ? 'fa-circle-check'
                                                : 'fa-camera'
                                        "
                                    ></i
                                ></span>
                                <strong>{{
                                    qrScanned
                                        ? loginForm.employeeId + ' scanned'
                                        : 'Scan staff card QR'
                                }}</strong>
                                <span>{{
                                    qrScanned
                                        ? 'Identity confirmed'
                                        : 'Open this device camera'
                                }}</span>
                            </button>
                            <label v-if="qrScanned" class="input-row">
                                <i class="fa-solid fa-shield-halved"></i>
                                <input
                                    v-model="loginForm.qrSecret"
                                    type="password"
                                    placeholder="Enter password or PIN"
                                />
                            </label>
                        </div>

                        <label
                            v-if="loginMode === 'password'"
                            class="input-row"
                        >
                            <i class="fa-solid fa-user"></i>
                            <input
                                v-model.trim="loginForm.employeeId"
                                type="text"
                                placeholder="Employee ID"
                            />
                        </label>

                        <label
                            v-if="loginMode === 'password'"
                            class="input-row"
                        >
                            <i class="fa-solid fa-key"></i>
                            <input
                                v-model="loginForm.password"
                                type="password"
                                placeholder="Password (letters and numbers)"
                            />
                        </label>

                        <label
                            v-if="loginMode === 'password'"
                            class="input-row"
                        >
                            <i class="fa-solid fa-grip"></i>
                            <input
                                v-model="loginForm.pin"
                                type="password"
                                inputmode="numeric"
                                maxlength="4"
                                placeholder="4-digit Staff PIN"
                            />
                        </label>

                        <div class="login-links">
                            <button
                                class="switch-link"
                                type="button"
                                @click="showRegister"
                            >
                                Register staff account
                            </button>
                            <button class="forgot-link" type="button">
                                Forgot PIN?
                            </button>
                        </div>
                        <p v-if="formMessage" class="form-message">
                            {{ formMessage }}
                        </p>

                        <div class="form-bottom">
                            <span class="demo-hint"
                                >Demo: EMP001 / restro123 / 1234</span
                            >
                            <button class="login-button" type="submit">
                                Login
                            </button>
                        </div>
                    </form>
                </div>

                <div v-else key="register" class="login-form">
                    <p class="eyebrow">Create account</p>
                    <h1>Register</h1>

                    <form @submit.prevent="registerAccount">
                        <label class="input-row">
                            <i class="fa-solid fa-id-badge"></i>
                            <input
                                v-model.trim="registerForm.name"
                                type="text"
                                placeholder="Staff Name"
                            />
                        </label>

                        <label class="input-row">
                            <i class="fa-solid fa-user"></i>
                            <input
                                :value="registerForm.employeeId"
                                type="text"
                                placeholder="Employee ID"
                                readonly
                            />
                        </label>

                        <label class="input-row">
                            <i class="fa-solid fa-lock"></i>
                            <input
                                v-model="registerForm.password"
                                type="password"
                                placeholder="Password"
                            />
                        </label>

                        <label class="input-row">
                            <i class="fa-solid fa-shield-halved"></i>
                            <input
                                v-model="registerForm.pin"
                                type="password"
                                placeholder="4-digit PIN"
                            />
                        </label>

                        <p v-if="formMessage" class="form-message">
                            {{ formMessage }}
                        </p>
                        <div class="form-bottom">
                            <button
                                class="ghost-button"
                                type="button"
                                @click="showLogin"
                            >
                                Back
                            </button>
                            <button class="login-button" type="submit">
                                Register
                            </button>
                        </div>
                    </form>
                </div>
            </transition>
        </section>
        <CameraScannerModal
            v-if="showStaffScanner"
            title="Scan staff card"
            subtitle="Use this device camera to scan the worker ID card"
            action-label="Complete demo staff scan"
            hint="Position the staff card QR inside the frame"
            @close="showStaffScanner = false"
            @scanned="completeStaffScan"
        />
    </main>
</template>

<script>
import backgroundImg from '@/assets/img/background/dark_background.jpg'
import CameraScannerModal from '@/components/common/CameraScannerModal.vue'
export default {
    name: 'POSLogin',
    components: { CameraScannerModal },
    data() {
        return {
            isRegister: false,
            loginMode: 'qr',
            qrScanned: false,
            showStaffScanner: false,
            formMessage: '',
            backgroundImg,
            loginForm: {
                employeeId: 'EMP001',
                password: 'restro123',
                pin: '1234',
                qrSecret: '',
            },
            registerForm: {
                name: '',
                employeeId: '',
                password: '',
                pin: '',
            },
            demoAccount: {
                name: 'Alice Tan',
                employeeId: 'EMP001',
                password: 'restro123',
                pin: '1234',
                role: 'Cashier',
            },
        }
    },
    methods: {
        getStoredAccounts() {
            try {
                return (
                    JSON.parse(localStorage.getItem('posfood_accounts')) || []
                )
            } catch (error) {
                return []
            }
        },
        setActiveAccount(account) {
            localStorage.setItem(
                'posfood_active_account',
                JSON.stringify({
                    name: account.name,
                    employeeId: account.employeeId,
                    role: account.role || 'Cashier',
                }),
            )
            this.$router.push('/pos/start')
        },
        loginAccount() {
            const employeeId = this.loginForm.employeeId.toUpperCase()
            const accounts = [this.demoAccount, ...this.getStoredAccounts()]
            const account = accounts.find(
                (item) => item.employeeId.toUpperCase() === employeeId,
            )
            const qrValid =
                this.loginMode === 'qr' &&
                this.qrScanned &&
                account &&
                (this.loginForm.qrSecret === account.password ||
                    this.loginForm.qrSecret === account.pin)
            const passwordValid =
                this.loginMode === 'password' &&
                account &&
                this.loginForm.password === account.password &&
                this.loginForm.pin === account.pin
            if (!qrValid && !passwordValid) {
                this.formMessage =
                    this.loginMode === 'qr'
                        ? 'Scan your staff QR, then enter your password or PIN.'
                        : 'Employee ID, password or PIN is incorrect.'
                return
            }
            this.formMessage = ''
            this.setActiveAccount(account)
        },
        registerAccount() {
            const employeeId = this.nextEmployeeId()
            this.registerForm.employeeId = employeeId
            const accounts = this.getStoredAccounts()
            const allAccounts = [this.demoAccount, ...accounts]
            if (
                !this.registerForm.name ||
                !employeeId ||
                !this.registerForm.password ||
                !this.registerForm.pin
            ) {
                this.formMessage = 'Please fill in all fields.'
                return
            }
            if (!/^\d{4}$/.test(this.registerForm.pin)) {
                this.formMessage = 'PIN must be exactly 4 digits.'
                return
            }
            if (this.registerForm.password.length < 6) {
                this.formMessage =
                    'Password must contain at least 6 characters.'
                return
            }
            if (
                allAccounts.some(
                    (item) => item.employeeId.toUpperCase() === employeeId,
                )
            ) {
                this.formMessage = 'This employee ID is already registered.'
                return
            }
            const account = {
                name: this.registerForm.name,
                employeeId,
                password: this.registerForm.password,
                pin: this.registerForm.pin,
                role: 'Cashier',
            }
            localStorage.setItem(
                'posfood_accounts',
                JSON.stringify([...accounts, account]),
            )
            this.setActiveAccount(account)
        },
        nextEmployeeId() {
            const accounts = [this.demoAccount, ...this.getStoredAccounts()]
            const highestNumber = accounts.reduce((highest, account) => {
                const number =
                    Number(
                        String(account.employeeId || '').replace(/\D/g, ''),
                    ) || 0
                return Math.max(highest, number)
            }, 0)
            return `EMP${String(highestNumber + 1).padStart(3, '0')}`
        },
        showRegister() {
            this.isRegister = true
            this.formMessage = ''
            this.registerForm.employeeId = this.nextEmployeeId()
        },
        showLogin() {
            this.isRegister = false
            this.formMessage = ''
        },
        setLoginMode(mode) {
            this.loginMode = mode
            this.formMessage = ''
            if (mode !== 'qr') this.qrScanned = false
        },
        scanStaffQr() {
            this.showStaffScanner = true
            this.formMessage = ''
        },
        completeStaffScan() {
            this.qrScanned = true
            this.showStaffScanner = false
            this.loginForm.employeeId = 'EMP001'
            this.formMessage = ''
        },
    },
}
</script>
