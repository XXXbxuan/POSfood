<template>
    <main class="staff-profile-page">
        <PosTopbar>
            <template #center>
                <strong class="staff-profile-topbar-title">My profile</strong>
            </template>
        </PosTopbar>

        <section class="staff-profile-workspace">
            <header class="staff-profile-header">
                <div class="staff-profile-header-copy">
                    <button
                        type="button"
                        class="staff-profile-home"
                        @click="goHome"
                    >
                        <i class="fa-solid fa-house"></i>
                        Back to home
                    </button>
                    <h1>My profile</h1>
                </div>
            </header>

            <div class="staff-profile-layout">
                <aside class="staff-profile-identity">
                    <button
                        type="button"
                        class="staff-profile-photo"
                        aria-label="Change profile picture"
                        @click="openPhotoPicker"
                    >
                        <img
                            v-if="form.profileImage"
                            :src="form.profileImage"
                            :alt="form.name || 'Staff profile picture'"
                        />
                        <span v-else>{{ initials }}</span>
                        <i class="fa-solid fa-camera"></i>
                    </button>
                    <input
                        ref="photoInput"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                        @change="handlePhotoChange"
                    />

                    <h2>{{ form.name || account.name || 'Staff' }}</h2>



                    <dl class="staff-profile-readonly">
                        <div>
                            <dt>Position</dt>
                            <dd>{{ account.role }}</dd>
                        </div>
                        <div>
                            <dt>Staff ID</dt>
                            <dd>{{ account.employeeId }}</dd>
                        </div>
                    </dl>
                </aside>

                <form
                    class="staff-profile-form"
                    @submit.prevent="saveProfile"
                >
                    <section class="staff-profile-form-section">
                        <header>
                            <span class="staff-profile-section-icon">
                                <i class="fa-solid fa-user"></i>
                            </span>
                            <div>
                                <h2>Personal details</h2>
                                <p>Information shown on your staff account.</p>
                            </div>
                        </header>

                        <div class="staff-profile-fields">
                            <label class="staff-profile-field full">
                                <span>Full name</span>
                                <div>
                                    <i class="fa-solid fa-user"></i>
                                    <input
                                        v-model.trim="form.name"
                                        type="text"
                                        autocomplete="name"
                                        maxlength="60"
                                        placeholder="Enter full name"
                                    />
                                </div>
                            </label>

                            <label class="staff-profile-field">
                                <span>Phone</span>
                                <div>
                                    <i class="fa-solid fa-phone"></i>
                                    <input
                                        v-model.trim="form.phone"
                                        type="tel"
                                        inputmode="tel"
                                        autocomplete="tel"
                                        maxlength="24"
                                        placeholder="e.g. 012-345 6789"
                                    />
                                </div>
                            </label>

                            <label class="staff-profile-field">
                                <span>Gmail</span>
                                <div>
                                    <i class="fa-solid fa-envelope"></i>
                                    <input
                                        v-model.trim="form.email"
                                        type="email"
                                        inputmode="email"
                                        autocomplete="email"
                                        maxlength="100"
                                        placeholder="name@gmail.com"
                                    />
                                </div>
                            </label>
                        </div>
                    </section>

                    <section class="staff-profile-form-section security">
                        <header>
                            <span class="staff-profile-section-icon">
                                <i class="fa-solid fa-shield-halved"></i>
                            </span>
                            <div>
                                <h2>Password & PIN</h2>
                                <p>
                                    Used for staff login and session unlocking.
                                </p>
                            </div>
                        </header>

                        <div class="staff-profile-fields">
                            <label class="staff-profile-field">
                                <span>Password</span>
                                <div>
                                    <i class="fa-solid fa-key"></i>
                                    <input
                                        v-model="form.password"
                                        :type="showPassword ? 'text' : 'password'"
                                        autocomplete="new-password"
                                        maxlength="80"
                                        placeholder="At least 6 characters"
                                    />
                                    <button
                                        type="button"
                                        :aria-label="showPassword ? 'Hide password' : 'Show password'"
                                        @click="showPassword = !showPassword"
                                    >
                                        <i
                                            class="fa-solid"
                                            :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
                                        ></i>
                                    </button>
                                </div>
                            </label>

                            <label class="staff-profile-field">
                                <span>4-digit PIN</span>
                                <div>
                                    <i class="fa-solid fa-lock"></i>
                                    <input
                                        v-model="form.pin"
                                        :type="showPin ? 'text' : 'password'"
                                        inputmode="numeric"
                                        autocomplete="off"
                                        maxlength="4"
                                        placeholder="4 digits"
                                        @input="normalizePin"
                                    />
                                    <button
                                        type="button"
                                        :aria-label="showPin ? 'Hide PIN' : 'Show PIN'"
                                        @click="showPin = !showPin"
                                    >
                                        <i
                                            class="fa-solid"
                                            :class="showPin ? 'fa-eye-slash' : 'fa-eye'"
                                        ></i>
                                    </button>
                                </div>
                            </label>
                        </div>
                    </section>

                    <p
                        v-if="message"
                        class="staff-profile-message"
                        :class="messageType"
                    >
                        <i
                            class="fa-solid"
                            :class="messageType === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"
                        ></i>
                        {{ message }}
                    </p>

                    <footer
                        v-if="hasChanges"
                        class="staff-profile-actions"
                    >
                        <button
                            type="button"
                            class="staff-profile-reset"
                            @click="resetForm"
                        >
                            Cancel changes
                        </button>
                        <button
                            type="submit"
                            class="staff-profile-save"
                            :disabled="saving"
                        >
                            <i class="fa-solid fa-floppy-disk"></i>
                            {{ saving ? 'Saving...' : 'Save changes' }}
                        </button>
                    </footer>
                </form>
            </div>
        </section>
    </main>
</template>

<script>
import PosTopbar from '@/components/common/PosTopbar.vue'
import { roleHome } from '@/services/pos/permissions.js'
import {
    findStaffAccount,
    updateStaffProfile,
} from '@/services/pos/staff.js'

export default {
    name: 'POSStaffProfile',
    components: { PosTopbar },
    data() {
        return {
            account: {},
            form: {
                name: '',
                phone: '',
                email: '',
                password: '',
                pin: '',
                profileImage: '',
            },
            showPassword: false,
            showPin: false,
            saving: false,
            baselineProfile: '',
            message: '',
            messageType: '',
        }
    },
    computed: {
        initials() {
            return (
                String(this.form.name || this.account.name || 'Staff')
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'ST'
            )
        },
        hasChanges() {
            return this.profileSignature(this.form) !== this.baselineProfile
        },
    },
    mounted() {
        this.loadProfile()
    },
    methods: {
        loadProfile() {
            let activeAccount = null
            try {
                activeAccount = JSON.parse(
                    localStorage.getItem('posfood_active_account'),
                )
            } catch (error) {
                activeAccount = null
            }

            const storedAccount = findStaffAccount(activeAccount?.employeeId)
            if (!storedAccount) {
                this.$router.replace('/')
                return
            }

            this.account = storedAccount
            this.resetForm()
        },
        profileSignature(profile = {}) {
            return JSON.stringify({
                name: String(profile.name || ''),
                phone: String(profile.phone || ''),
                email: String(profile.email || ''),
                password: String(profile.password || ''),
                pin: String(profile.pin || ''),
                profileImage: String(profile.profileImage || ''),
            })
        },
        resetForm() {
            this.form = {
                name: this.account.name || '',
                phone: this.account.phone || '',
                email: this.account.email || '',
                password: this.account.password || '',
                pin: this.account.pin || '',
                profileImage: this.account.profileImage || '',
            }
            this.baselineProfile = this.profileSignature(this.form)
            this.showPassword = false
            this.showPin = false
            this.message = ''
            this.messageType = ''
        },
        normalizePin(event) {
            this.form.pin = String(event.target.value || '')
                .replace(/\D/g, '')
                .slice(0, 4)
        },
        openPhotoPicker() {
            this.$refs.photoInput?.click()
        },
        handlePhotoChange(event) {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            if (!file.type.startsWith('image/')) {
                this.setMessage('Please choose an image file.', 'error')
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                this.setMessage(
                    'Profile picture must be smaller than 5 MB.',
                    'error',
                )
                return
            }

            const reader = new FileReader()
            reader.onload = () => this.resizeProfileImage(reader.result)
            reader.onerror = () =>
                this.setMessage('Unable to read this image.', 'error')
            reader.readAsDataURL(file)
        },
        resizeProfileImage(source) {
            const image = new Image()
            image.onload = () => {
                const maxSize = 320
                const scale = Math.min(
                    1,
                    maxSize / Math.max(image.width, image.height),
                )
                const width = Math.max(1, Math.round(image.width * scale))
                const height = Math.max(1, Math.round(image.height * scale))
                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                const context = canvas.getContext('2d')
                if (!context) {
                    this.setMessage('Unable to prepare this image.', 'error')
                    return
                }
                context.drawImage(image, 0, 0, width, height)
                this.form.profileImage = canvas.toDataURL('image/jpeg', 0.82)
                this.setMessage(
                    'New profile picture is ready. Save to update it.',
                    'success',
                )
            }
            image.onerror = () =>
                this.setMessage('Unable to open this image.', 'error')
            image.src = source
        },
        validateForm() {
            if (!this.form.name.trim()) return 'Full name is required.'
            if (this.form.password.length < 6)
                return 'Password must contain at least 6 characters.'
            if (!/^\d{4}$/.test(this.form.pin))
                return 'PIN must be exactly 4 digits.'
            if (
                this.form.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)
            )
                return 'Enter a valid email address.'
            return ''
        },
        saveProfile() {
            const validationError = this.validateForm()
            if (validationError) {
                this.setMessage(validationError, 'error')
                return
            }

            this.saving = true
            const updated = updateStaffProfile(this.account.employeeId, {
                name: this.form.name,
                phone: this.form.phone,
                email: this.form.email,
                password: this.form.password,
                pin: this.form.pin,
                profileImage: this.form.profileImage,
            })
            this.saving = false

            if (!updated) {
                this.setMessage('Unable to update this staff account.', 'error')
                return
            }

            this.account = updated
            this.form = {
                ...this.form,
                name: updated.name,
                phone: updated.phone,
                email: updated.email,
                password: updated.password,
                pin: updated.pin,
                profileImage: updated.profileImage,
            }
            this.baselineProfile = this.profileSignature(this.form)
            this.setMessage('Profile updated successfully.', 'success')
        },
        setMessage(message, type) {
            this.message = message
            this.messageType = type
        },
        goHome() {
            this.$router.push(roleHome(this.account.role))
        },
    },
}
</script>
