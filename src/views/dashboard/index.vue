<template>
    <main class="login-page" :style="{ '--login-bg': `url(${backgroundImg})` }">
        <div class="brand-mark">posfood</div>

        <section class="login-panel">
            <div class="panel-texture"></div>
            <button class="menu-button" type="button" aria-label="Open menu">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <transition name="form-swap" mode="out-in">
                <div v-if="!isRegister" key="login" class="login-form">
                    <p class="eyebrow">Welcome back</p>
                    <h1>Login</h1>
                    <p class="intro">Sign in with your employee account to start taking orders.</p>

                    <form @submit.prevent="loginAccount">
                        <label class="input-row">
                            <i class="fa-solid fa-user"></i>
                            <input v-model.trim="loginForm.employeeId" type="text" placeholder="Employee ID">
                        </label>

                        <label class="input-row">
                            <i class="fa-solid fa-lock"></i>
                            <input v-model="loginForm.pin" type="password" placeholder="PIN">
                        </label>

                        <button class="forgot-link" type="button">Forgot PIN? Contact Manager</button>
                        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

                        <div class="form-bottom">
                            <span class="demo-hint">Demo: EMP001 / 1234</span>
                            <button class="login-button" type="submit">Login</button>
                        </div>
                    </form>

                    <button class="switch-link" type="button" @click="showRegister">
                        Register staff account
                    </button>
                </div>

                <div v-else key="register" class="login-form">
                    <p class="eyebrow">Create account</p>
                    <h1>Register</h1>
                    <p class="intro">Create a local demo staff account for this POS.</p>

                    <form @submit.prevent="registerAccount">
                        <label class="input-row">
                            <i class="fa-solid fa-id-badge"></i>
                            <input v-model.trim="registerForm.name" type="text" placeholder="Staff Name">
                        </label>

                        <label class="input-row">
                            <i class="fa-solid fa-user"></i>
                            <input v-model.trim="registerForm.employeeId" type="text" placeholder="Employee ID">
                        </label>

                        <label class="input-row">
                            <i class="fa-solid fa-lock"></i>
                            <input v-model="registerForm.pin" type="password" placeholder="4-digit PIN">
                        </label>

                        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>
                        <div class="form-bottom">
                            <button class="ghost-button" type="button" @click="showLogin">Back</button>
                            <button class="login-button" type="submit">Register</button>
                        </div>
                    </form>
                </div>
            </transition>

            <div class="food-stage">
                <img :src="pastaImg" alt="Pasta dish">
            </div>
        </section>
    </main>
</template>

<script>
import pastaImg from '@/assets/img/pasta.png'
import backgroundImg from '@/assets/img/background.jpg'

export default {
    name: 'POSDashboard',
    data() {
        return {
            isRegister: false,
            formMessage: '',
            pastaImg,
            backgroundImg,
            loginForm: {
                employeeId: 'EMP001',
                pin: '1234',
            },
            registerForm: {
                name: '',
                employeeId: '',
                pin: '',
            },
            demoAccount: {
                name: 'Alice Tan',
                employeeId: 'EMP001',
                pin: '1234',
                role: 'Cashier',
            },
        }
    },
    methods: {
        getStoredAccounts() {
            try {
                return JSON.parse(localStorage.getItem('posfood_accounts')) || []
            } catch (error) {
                return []
            }
        },
        setActiveAccount(account) {
            localStorage.setItem('posfood_active_account', JSON.stringify({
                name: account.name,
                employeeId: account.employeeId,
                role: account.role || 'Cashier',
            }))
            this.$router.push('/pos/start')
        },
        loginAccount() {
            const employeeId = this.loginForm.employeeId.toUpperCase()
            const accounts = [this.demoAccount, ...this.getStoredAccounts()]
            const account = accounts.find((item) => item.employeeId.toUpperCase() === employeeId && item.pin === this.loginForm.pin)

            if (!account) {
                this.formMessage = 'Invalid employee ID or PIN. Try EMP001 / 1234.'
                return
            }

            this.formMessage = ''
            this.setActiveAccount(account)
        },
        registerAccount() {
            const employeeId = this.registerForm.employeeId.toUpperCase()
            const accounts = this.getStoredAccounts()
            const allAccounts = [this.demoAccount, ...accounts]

            if (!this.registerForm.name || !employeeId || !this.registerForm.pin) {
                this.formMessage = 'Please fill in all fields.'
                return
            }

            if (!/^\d{4}$/.test(this.registerForm.pin)) {
                this.formMessage = 'PIN must be exactly 4 digits.'
                return
            }

            if (allAccounts.some((item) => item.employeeId.toUpperCase() === employeeId)) {
                this.formMessage = 'This employee ID is already registered.'
                return
            }

            const account = {
                name: this.registerForm.name,
                employeeId,
                pin: this.registerForm.pin,
                role: 'Cashier',
            }
            localStorage.setItem('posfood_accounts', JSON.stringify([...accounts, account]))
            this.setActiveAccount(account)
        },
        showRegister() {
            this.isRegister = true
            this.formMessage = ''
        },
        showLogin() {
            this.isRegister = false
            this.formMessage = ''
        },
    },
}
</script>

<style scoped lang="scss">
.login-page {
    min-height: 100vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5rem 0;
    overflow: hidden;
    background:
        radial-gradient(circle at 70% 42%, rgba(252, 128, 25, .18), transparent 24rem),
        linear-gradient(135deg, #173f43 0%, #11323a 48%, #08212b 100%);
    color: #171826;
    font-family: 'poppins', Arial, sans-serif;
}

.login-page::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: var(--login-bg);
    background-size: cover;
    background-position: center;
    opacity: .16;
    mix-blend-mode: soft-light;
}

.brand-mark {
    position: absolute;
    top: 2.2rem;
    left: 2.8rem;
    z-index: 2;
    color: rgba(255, 255, 255, .9);
    font-size: 1.2rem;
    font-weight: 600;
}

.login-panel {
    width: 100%;
    height: 540px;
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(24rem, .85fr) minmax(25rem, 1.15fr);
    align-items: center;
    padding: 5.2rem max(5rem, calc((100vw - 1120px) / 2));
    overflow: hidden;
    background:
        linear-gradient(90deg, rgba(213, 238, 236, .8), rgba(250, 252, 249, .82)),
        var(--login-bg) center / cover;
    border-top: 1px solid rgba(255, 255, 255, .38);
    border-bottom: 1px solid rgba(255, 255, 255, .3);
    box-shadow: 0 1.8rem 4rem rgba(0, 0, 0, .32);
}

.panel-texture {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(110deg, rgba(129, 199, 201, .3), rgba(255, 255, 255, .22)),
        var(--login-bg) center / cover;
    opacity: .78;
}

.menu-button {
    position: absolute;
    top: 1.45rem;
    right: max(1.6rem, calc((100vw - 1120px) / 2));
    z-index: 3;
    width: 2.35rem;
    height: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: .3rem;
    padding: 0;
    border: 0;
    background: transparent;
}

.menu-button span {
    height: .22rem;
    border-radius: 2rem;
    background: rgba(255, 255, 255, .96);
}

.login-form,
.food-stage {
    position: relative;
    z-index: 1;
}

.login-form {
    max-width: 430px;
}

.eyebrow {
    margin: 0 0 .5rem;
    color: rgba(23, 24, 38, .7);
    font-size: .95rem;
    font-weight: 800;
    letter-spacing: .15em;
    text-transform: uppercase;
}

.login-form h1 {
    margin: 0;
    font-size: 2.45rem;
    line-height: 1.05;
}

.intro {
    max-width: 24rem;
    margin: 1rem 0 2.15rem;
    color: rgba(23, 24, 38, .76);
    font-size: 1.08rem;
    line-height: 1.5;
}

.input-row {
    display: flex;
    align-items: center;
    gap: .85rem;
    width: 100%;
    padding: .25rem 0 .72rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid rgba(23, 24, 38, .5);
}

.input-row i {
    width: 1.2rem;
    color: rgba(23, 24, 38, .8);
    text-align: center;
}

.input-row input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #171826;
    font-size: 1.05rem;
}

.forgot-link,
.switch-link {
    display: block;
    margin-left: auto;
    border: 0;
    background: transparent;
    color: rgba(23, 24, 38, .65);
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
}

.switch-link {
    margin: 1.55rem 0 0;
}

.form-message {
    margin: .4rem 0 1rem;
    color: #b42318;
    font-weight: 800;
}

.form-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.demo-hint {
    color: rgba(23, 24, 38, .65);
    font-size: .92rem;
    font-weight: 700;
}

.login-button,
.ghost-button {
    min-width: 6.7rem;
    min-height: 2.6rem;
    border-radius: 2rem;
    font-weight: 900;
    cursor: pointer;
}

.login-button {
    border: 0;
    background: #ffffff;
    color: #171826;
    box-shadow: 0 .65rem 1.25rem rgba(14, 55, 62, .22);
}

.ghost-button {
    border: 1px solid rgba(23, 24, 38, .35);
    background: transparent;
}

.food-stage {
    display: flex;
    justify-content: center;
    align-items: center;
}

.food-stage img {
    width: min(92%, 34rem);
    max-height: 32rem;
    object-fit: contain;
    filter: drop-shadow(0 1.7rem 1.55rem rgba(6, 38, 43, .32));
    transform: translate(1rem, .5rem) scale(1.08);
}

.form-swap-enter-active,
.form-swap-leave-active {
    transition: opacity .25s ease, transform .28s ease;
}

.form-swap-enter-from,
.form-swap-leave-to {
    opacity: 0;
    transform: translateX(1rem);
}

@media (max-width: 900px) {
    .login-panel {
        height: auto;
        min-height: 700px;
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 4.8rem 2rem 2.5rem;
    }

    .login-form {
        max-width: none;
    }

    .food-stage img {
        width: min(80%, 24rem);
        transform: none;
    }
}
</style>
