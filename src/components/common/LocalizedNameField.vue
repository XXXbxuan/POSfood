<template>
    <div class="localized-name-field" :class="{ 'localized-name-field--wide': wide }">
        <span class="localized-name-field__label">{{ label }} <b v-if="required">*</b></span>
        <button
            class="localized-name-field__trigger"
            type="button"
            :aria-label="`Edit ${label.toLowerCase()}`"
            @click="openEditor"
        >
            <span :class="{ placeholder: !displayName }">{{ displayName || placeholder }}</span>
            <i class="fa-solid fa-language" aria-hidden="true"></i>
        </button>
        <small class="localized-name-field__mode">
            {{ mode === 'multiple' ? 'Multiple languages' : 'Single language' }}
        </small>

        <teleport to="body">
            <div v-if="editorOpen" class="localized-name-editor-backdrop" @mousedown.self="closeEditor">
                <section class="localized-name-editor" role="dialog" aria-modal="true" :aria-label="editorTitle">
                    <header class="localized-name-editor__header">
                        <div>
                            <span>NAME</span>
                            <h2>{{ editorTitle }}</h2>
                        </div>
                        <button type="button" aria-label="Close" @click="closeEditor">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>

                    <div class="localized-name-editor__body">
                        <div class="localized-name-editor__choices" role="group" aria-label="Name language mode">
                            <button type="button" :class="{ active: draftMode === 'single' }" @click="selectMode('single')">
                                Single language
                            </button>
                            <button type="button" :class="{ active: draftMode === 'multiple' }" @click="selectMode('multiple')">
                                Multiple languages
                            </button>
                        </div>

                        <template v-if="draftMode === 'multiple'">
                            <div class="localized-name-editor__language">
                                <span>{{ currentLanguage.label }}</span>
                                <small>{{ languageIndex + 1 }} / {{ languages.length }}</small>
                            </div>
                            <input
                                ref="nameInput"
                                v-model.trim="draftTranslations[currentLanguage.code]"
                                type="text"
                                :placeholder="currentLanguage.code === 'en' ? example : 'Optional; English is used when blank.'"
                                @keydown.enter.prevent="languageIndex < languages.length - 1 ? moveLanguage(1) : saveEditor()"
                            />
                            <small class="localized-name-editor__hint">
                                {{ currentLanguage.code === 'en' ? 'Required; used as the fallback language.' : 'Optional; English is used when blank.' }}
                            </small>
                            <div class="localized-name-editor__navigation">
                                <button type="button" :disabled="languageIndex === 0" @click="moveLanguage(-1)">Previous</button>
                                <button v-if="languageIndex < languages.length - 1" class="primary" type="button" @click="moveLanguage(1)">
                                    Next <i class="fa-solid fa-arrow-right"></i>
                                </button>
                                <button v-else class="primary" type="button" @click="saveEditor">
                                    Done <i class="fa-solid fa-check"></i>
                                </button>
                            </div>
                        </template>

                        <template v-else>
                            <input
                                ref="nameInput"
                                v-model.trim="draftTranslations.en"
                                type="text"
                                :placeholder="example"
                                @keydown.enter.prevent="saveEditor"
                            />
                            <small class="localized-name-editor__hint">One name is used in every language.</small>
                            <div class="localized-name-editor__navigation localized-name-editor__navigation--single">
                                <button type="button" @click="closeEditor">Cancel</button>
                                <button class="primary" type="button" @click="saveEditor">
                                    Save <i class="fa-solid fa-check"></i>
                                </button>
                            </div>
                        </template>

                        <p v-if="error" class="localized-name-editor__error">
                            <i class="fa-solid fa-circle-exclamation"></i>{{ error }}
                        </p>
                    </div>
                </section>
            </div>
        </teleport>
    </div>
</template>

<script>
import { LANGUAGES, localizedFields, localizedValue } from '@/system/language'

export default {
    name: 'LocalizedNameField',
    props: {
        label: { type: String, default: 'Name' },
        editorTitle: { type: String, default: 'Enter name' },
        placeholder: { type: String, default: 'Click to enter name' },
        example: { type: String, default: 'Enter English name' },
        mode: { type: String, default: 'single' },
        translations: { type: Object, default: () => ({ en: '', cn: '', bm: '' }) },
        required: { type: Boolean, default: false },
        wide: { type: Boolean, default: false },
    },
    emits: ['save'],
    data() {
        return {
            languages: LANGUAGES,
            editorOpen: false,
            draftMode: 'single',
            draftTranslations: { en: '', cn: '', bm: '' },
            languageIndex: 0,
            error: '',
        }
    },
    computed: {
        currentLanguage() {
            return this.languages[this.languageIndex] || this.languages[0]
        },
        displayName() {
            return localizedValue(this.translations, this.translations?.en || '')
        },
    },
    mounted() {
        window.addEventListener('keydown', this.handleKeydown)
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydown)
    },
    methods: {
        openEditor() {
            this.draftMode = this.mode === 'multiple' ? 'multiple' : 'single'
            this.draftTranslations = {
                en: this.translations?.en || '',
                cn: this.translations?.cn === this.translations?.en ? '' : this.translations?.cn || '',
                bm: this.translations?.bm === this.translations?.en ? '' : this.translations?.bm || '',
            }
            this.languageIndex = 0
            this.error = ''
            this.editorOpen = true
            this.focusInput()
        },
        closeEditor() {
            this.editorOpen = false
            this.error = ''
        },
        selectMode(mode) {
            this.draftMode = mode
            this.languageIndex = 0
            this.error = ''
            this.focusInput()
        },
        moveLanguage(delta) {
            if (delta > 0 && !this.draftTranslations.en.trim()) {
                this.error = 'Enter the English name first.'
                this.languageIndex = 0
                this.focusInput()
                return
            }
            this.error = ''
            this.languageIndex = Math.max(0, Math.min(this.languages.length - 1, this.languageIndex + delta))
            this.focusInput()
        },
        saveEditor() {
            const english = this.draftTranslations.en.trim()
            if (!english) {
                this.error = 'Enter the English name first.'
                this.languageIndex = 0
                this.focusInput()
                return
            }
            const translations = this.draftMode === 'multiple'
                ? localizedFields(english, this.draftTranslations.cn, this.draftTranslations.bm)
                : localizedFields(english)
            this.$emit('save', { mode: this.draftMode, translations })
            this.closeEditor()
        },
        focusInput() {
            this.$nextTick(() => this.$refs.nameInput?.focus())
        },
        handleKeydown(event) {
            if (this.editorOpen && event.key === 'Escape') this.closeEditor()
        },
    },
}
</script>

<style scoped>
.localized-name-field {
    display: grid;
    gap: 0.42rem;
    min-width: 0;
}

.localized-name-field--wide { grid-column: 1 / -1; }

.localized-name-field__label {
    color: var(--inv-text-primary, #19343a);
    font-size: 0.91rem;
    font-weight: 800;
}

.localized-name-field__label b { color: var(--inv-danger, #e24b4b); }

.localized-name-field__trigger {
    width: 100%;
    min-height: 2.76rem;
    padding: 0.72rem 0.86rem;
    border: 1px solid var(--inv-border, #d5e1e2);
    border-radius: 0.72rem;
    background: #fff;
    color: var(--inv-text-primary, #19343a);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.localized-name-field__trigger:hover,
.localized-name-field__trigger:focus-visible {
    border-color: var(--inv-primary, #10a39c);
    box-shadow: 0 0 0 3px rgba(16, 163, 156, 0.12);
    outline: none;
}

.localized-name-field__trigger .placeholder { color: #96a8ad; }
.localized-name-field__trigger > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.localized-name-field__trigger i { color: var(--inv-primary, #10a39c); font-size: 1rem; }
.localized-name-field__mode { color: var(--inv-text-secondary, #71878c); font-size: 0.79rem; }

.localized-name-editor-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1400;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(13, 39, 43, 0.54);
    backdrop-filter: blur(2px);
}

.localized-name-editor {
    width: min(31rem, 100%);
    overflow: hidden;
    border: 1px solid rgba(213, 225, 226, 0.95);
    border-radius: 1rem;
    background: #fff;
    box-shadow: 0 1.5rem 4rem rgba(13, 39, 43, 0.25);
}

.localized-name-editor__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.1rem;
    border-bottom: 1px solid var(--inv-border, #dce7e8);
}

.localized-name-editor__header span {
    display: block;
    margin-bottom: 0.22rem;
    color: var(--inv-primary, #0b9993);
    font-size: 0.75rem;
    font-weight: 900;
    letter-spacing: 0.16em;
}

.localized-name-editor__header h2 { margin: 0; color: #19343a; font-size: 1.2rem; }
.localized-name-editor__header button {
    width: 2.55rem;
    height: 2.55rem;
    border: 1px solid var(--inv-border, #d5e1e2);
    border-radius: 0.78rem;
    background: #fff;
    color: #19343a;
    cursor: pointer;
}

.localized-name-editor__body { display: grid; gap: 0.72rem; padding: 1.1rem; }
.localized-name-editor__choices { display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; }
.localized-name-editor__choices button,
.localized-name-editor__navigation button {
    min-height: 2.55rem;
    border: 1px solid var(--inv-border, #d5e1e2);
    border-radius: 0.66rem;
    background: #fff;
    color: #19343a;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
}

.localized-name-editor__choices button.active {
    border-color: var(--inv-primary, #10a39c);
    background: rgba(16, 163, 156, 0.12);
    color: #087a75;
}

.localized-name-editor__language { display: flex; align-items: center; justify-content: space-between; margin-top: 0.15rem; }
.localized-name-editor__language span { color: #19343a; font-weight: 900; }
.localized-name-editor__language small { color: #71878c; }
.localized-name-editor__body input {
    width: 100%;
    min-height: 2.84rem;
    padding: 0.74rem 0.82rem;
    border: 1px solid var(--inv-border, #d5e1e2);
    border-radius: 0.72rem;
    color: #19343a;
    font: inherit;
    outline: none;
}

.localized-name-editor__body input:focus {
    border-color: var(--inv-primary, #10a39c);
    box-shadow: 0 0 0 3px rgba(16, 163, 156, 0.12);
}

.localized-name-editor__hint { color: #71878c; font-size: 0.8rem; }
.localized-name-editor__navigation { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; margin-top: 0.15rem; }
.localized-name-editor__navigation--single { margin-top: 0.35rem; }
.localized-name-editor__navigation button:disabled { opacity: 0.45; cursor: not-allowed; }
.localized-name-editor__navigation button.primary { border-color: var(--inv-primary, #10a39c); background: var(--inv-primary, #10a39c); color: #fff; }
.localized-name-editor__navigation button i { margin-left: 0.3rem; }
.localized-name-editor__error { margin: 0; color: var(--inv-danger, #d83b3b); font-size: 0.84rem; font-weight: 700; }
.localized-name-editor__error i { margin-right: 0.4rem; }

@media (max-width: 560px) {
    .localized-name-editor__choices { grid-template-columns: 1fr; }
}
</style>
