<template>
    <header class="inv-topbar">
        <button class="topbar-brand-button" type="button" aria-label="Open navigation menu" @click="$emit('menu')">
            <i class="fa-solid fa-bars"></i>
        </button>

        <RouterLink class="topbar-context topbar-home-link" to="/inventory/dashboard" aria-label="Return to Dashboard">
            <span class="topbar-workspace-mark" aria-hidden="true">
                <i class="fa-solid fa-boxes-stacked"></i>
            </span>
            <span class="topbar-context-copy">
                <span>INVENTORY WORKSPACE</span>
                <strong>Main Warehouse</strong>
            </span>
        </RouterLink>

        <button
            v-if="account"
            class="topbar-account-button"
            type="button"
            aria-label="Open account menu"
            :aria-expanded="profileOpen"
            @click.stop="$emit('profile')"
        >
            <span>{{ initials }}</span>
        </button>

        <div class="topbar-language" @click.stop>
            <button
                class="topbar-language-button"
                type="button"
                aria-label="Open language menu"
                :aria-expanded="languageOpen"
                @click="languageOpen = !languageOpen"
            >
                <i class="fa-solid fa-globe"></i>
                <span>{{ activeLanguage.code.toUpperCase() }}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div v-if="languageOpen" class="topbar-language-menu" role="menu" aria-label="Language">
                <button
                    v-for="language in languages"
                    :key="language.code"
                    type="button"
                    role="menuitemradio"
                    :aria-checked="activeLanguage.code === language.code"
                    :class="{ active: activeLanguage.code === language.code }"
                    @click="chooseLanguage(language.code)"
                >
                    <i :class="activeLanguage.code === language.code ? 'fa-solid fa-check' : 'fa-regular fa-circle'"></i>
                    <span>{{ language.label }}</span>
                </button>
            </div>
        </div>
    </header>
</template>

<script>
import { LANGUAGES, languageState, setLanguage } from '@/system/language'

export default {
    name: 'AppTopbar',
    props: {
        account: { type: Object, default: null },
        profileOpen: { type: Boolean, default: false },
    },
    emits: ['menu', 'profile', 'action'],
    data() {
        return {
            activeLanguage: languageState,
            languages: LANGUAGES,
            languageOpen: false,
        }
    },
    mounted() {
        document.addEventListener('click', this.closeLanguageMenu)
    },
    beforeUnmount() {
        document.removeEventListener('click', this.closeLanguageMenu)
    },
    computed: {
        initials() {
            return (this.account?.name || '')
                .split(/\s+/)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        },
    },
    methods: {
        chooseLanguage(code) {
            setLanguage(code)
            this.languageOpen = false
        },
        closeLanguageMenu() {
            this.languageOpen = false
        },
    },
}
</script>

<style scoped src="@/assets/css/components/app-topbar.css"></style>
