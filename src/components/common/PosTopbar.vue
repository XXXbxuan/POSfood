<template>
    <header class="restro-topbar pos-topbar">
        <div class="topbar-brand-area">
            <button
                type="button"
                class="topbar-sidebar-trigger"
                aria-label="Open navigation"
                title="Open menu"
                @click="openSidebar"
            >
                <i class="fa-solid fa-chevron-right"></i>
            </button>
            <h1
                role="button"
                tabindex="0"
                aria-label="Go to home"
                @click="goHome"
                @keydown.enter="goHome"
            >
                Restro <span>POS</span>
            </h1>
        </div>
        <div class="header-center"><slot name="center"></slot></div>
        <div class="header-actions">
            <slot name="actions">
                <button
                    v-if="showOrderActions"
                    type="button"
                    class="order-action dine-in-button"
                    @click="startDineIn"
                >
                    <i class="fa-solid fa-utensils"></i>Dine In
                </button>
                <button
                    v-if="showOrderActions"
                    type="button"
                    class="order-action takeaway-button"
                    @click="startTakeaway"
                >
                    <i class="fa-solid fa-bag-shopping"></i>Takeaway
                </button>
            </slot>
        </div>
        <div
            v-if="showMembershipDialog"
            class="topbar-member-backdrop"
            @click.self="closeMembershipDialog"
        >
            <section
                class="topbar-member-modal"
                :class="{ 'register-mode': registerMode }"
            >
                <header>
                    <div>
                        <span>MEMBERSHIP</span>
                        <h2>{{ currentMember ? 'Member account' : registerMode ? 'Register member' : 'Sign in member' }}</h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close membership"
                        @click="closeMembershipDialog"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <template v-if="currentMember">
                    <div class="topbar-current-member">
                        <span>{{ memberInitials(currentMember.name) }}</span>
                        <div>
                            <strong>{{ currentMember.name }}</strong>
                            <small>{{ currentMember.memberId }}</small>
                        </div>
                        <b>{{ currentMember.points }} pts</b>
                    </div>
                    <footer class="topbar-member-actions">
                        <button type="button" class="logout" @click="logoutMember">
                            Logout
                        </button>
                        <button type="button" @click="viewMemberProfile">
                            View profile
                        </button>
                    </footer>
                </template>

                <section v-else-if="!registerMode" class="topbar-member-picker">
                    <label class="topbar-member-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input
                            v-model.trim="memberQuery"
                            type="search"
                            placeholder="Name, phone or Member ID"
                            autofocus
                        />
                    </label>
                    <p v-if="memberError">{{ memberError }}</p>
                    <div class="topbar-member-results">
                        <button
                            v-for="member in memberMatches"
                            :key="member.id"
                            type="button"
                            @click="selectMember(member)"
                        >
                            <span>{{ memberInitials(member.name) }}</span>
                            <div>
                                <strong>{{ member.name }}</strong>
                                <small>{{ member.memberId }} · {{ member.phone }}</small>
                            </div>
                            <b>{{ member.points }} pts</b>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <p v-if="!memberMatches.length">No member found.</p>
                    </div>
                    <button type="button" class="register-link" @click="openRegister">
                        Register
                    </button>
                </section>

                <form
                    v-else
                    class="topbar-member-form"
                    @submit.prevent="registerMember"
                >
                    <MemberFormFields v-model="registerForm" />
                    <p v-if="memberError">{{ memberError }}</p>
                    <button type="submit">Register</button>
                    <button type="button" class="register-link" @click="registerMode = false">
                        Back
                    </button>
                </form>
            </section>
        </div>
    </header>
</template>
<script>
import {
    clearCurrentMember,
    loadCurrentMember,
    loadMembers,
    saveMember,
    setCurrentMember,
} from '@/services/pos/memberships.js'
import MemberFormFields from '@/components/membership/MemberFormFields.vue'

export default {
    name: 'PosTopbar',
    components: { MemberFormFields },
    props: {
        showOrderActions: { type: Boolean, default: false },
        showNewOrderButton: { type: Boolean, default: void 0 },
        membershipMode: { type: String, default: 'manage' },
    },
    emits: ['dine-in', 'membership', 'new-takeaway'],
    data() {
        return {
            currentMember: null,
            showMembershipDialog: false,
            registerMode: false,
            memberQuery: '',
            memberError: '',
            registerForm: {
                name: '',
                phone: '',
                email: '',
                birthday: '',
                note: '',
            },
        }
    },
    mounted() {
        this.currentMember = loadCurrentMember()
        window.addEventListener('pos-member:changed', this.syncCurrentMember)
    },
    beforeUnmount() {
        window.removeEventListener('pos-member:changed', this.syncCurrentMember)
    },
    computed: {
        memberMatches() {
            const keyword = this.memberQuery.toLowerCase()
            return loadMembers()
                .filter((member) => member.status === 'active')
                .filter((member) =>
                    !keyword
                        ? true
                        : [member.name, member.phone, member.memberId].some(
                              (value) =>
                                  String(value || '')
                                      .toLowerCase()
                                      .includes(keyword),
                          ),
                )
                .slice(0, 6)
        },
    },
    methods: {
        syncCurrentMember(event) {
            this.currentMember = event.detail || loadCurrentMember()
        },
        openSidebar() {
            window.dispatchEvent(new CustomEvent('pos-sidebar:open'))
        },
        goHome() {
            if (this.$route.path !== '/pos/start')
                this.$router.push('/pos/start')
        },
        clearOrderDraft() {
            localStorage.removeItem('posfood_order_draft')
        },
        openMembership() {
            if (this.membershipMode === 'attach') {
                this.$emit('membership')
                return
            }
            this.memberError = ''
            this.memberQuery = ''
            this.registerMode = false
            this.currentMember = loadCurrentMember()
            this.showMembershipDialog = true
        },
        closeMembershipDialog() {
            this.showMembershipDialog = false
            this.memberError = ''
        },
        memberInitials(name) {
            return String(name || '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
        selectMember(member) {
            this.currentMember = setCurrentMember(member)
            this.memberError = ''
        },
        openRegister() {
            this.registerMode = true
            this.memberError = ''
            this.registerForm = {
                name: '',
                phone: '',
                email: '',
                birthday: '',
                note: '',
            }
        },
        registerMember() {
            try {
                const member = saveMember(this.registerForm)
                this.currentMember = setCurrentMember(member)
                this.registerMode = false
                this.memberError = ''
            } catch (error) {
                this.memberError = error.message
            }
        },
        logoutMember() {
            clearCurrentMember()
            this.currentMember = null
            this.closeMembershipDialog()
        },
        viewMemberProfile() {
            const memberId = this.currentMember.id
            this.closeMembershipDialog()
            this.$router.push({
                path: '/pos/memberships',
                query: { member: memberId },
            })
        },
        startTakeaway() {
            const setup = {
                orderType: 'Takeaway',
                tableNumber: '',
                pax: 1,
                orderNo: `#${String(Date.now()).slice(-5)}`,
            }
            this.clearOrderDraft()
            localStorage.setItem('posfood_order_setup', JSON.stringify(setup))
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            this.$emit('new-takeaway', setup)
            if (this.$route.path !== '/pos/order')
                this.$router.push(`/pos/order?takeaway=${Date.now()}`)
        },
        startDineIn() {
            this.clearOrderDraft()
            localStorage.removeItem('posfood_order_setup')
            localStorage.removeItem('posfood_editing_order')
            localStorage.removeItem('posfood_add_order_mode')
            if (this.$route.path === '/pos/start') this.$emit('dine-in')
            else this.$router.push(`/pos/start?new=dine-in&t=${Date.now()}`)
        },
    },
}
</script>
