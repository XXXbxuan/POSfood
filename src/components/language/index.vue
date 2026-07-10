<style lang="scss">
    @import '@/assets/scss/abstracts/_variables.scss';
    @import '@/assets/scss/abstracts/_mixins.scss';
    @import '@/assets/scss/layout/_right-panel.scss';
</style>

<template>
    <div id="languages-panel" :class="[languagePanel === 'languages' && 'is-active']" class="right-panel-wrapper is-languages">
        <div class="panel-overlay" @click="languagePanel = 'none'"></div>

        <div class="right-panel">
            <div class="right-panel-head">
                <h3>{{$t('mix.table_language')}}</h3>
                <i class="close-panel fa-regular fa-angle-right text-white" @click="languagePanel = 'none'"></i>
            </div>
            <div class="right-panel-body has-slimscroll">
                <div class="languages-boxes">
                    <div class="language-box">
                        <div class="language-option">
                            <input v-model="currentLanguage" type="radio" name="language_selection" value="cn" @change="switchLanguage('cn'),languagePanel = 'none'" :check="(locale == 'cn')"/>
                            <div class="language-option-inner">
                                <img src="@/assets/img/flag/cn.svg"/>
                                <div class="indicator">
                                    <i class="fa-regular fa-check text-white" style="font-size: 10px;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="language-box">
                        <div class="language-option">
                            <input v-model="currentLanguage" type="radio" name="language_selection" value="en" @change="switchLanguage('en'),languagePanel = 'none'" :check="(locale == 'en')"/>
                            <div class="language-option-inner">
                                <img src="@/assets/img/flag/en.svg"/>
                                <div class="indicator">
                                    <i class="fa-regular fa-check text-white" style="font-size: 10px;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="language-box">
                        <div class="language-option">
                            <input v-model="currentLanguage" type="radio" name="language_selection" value="22"/>
                            <div class="language-option-inner">
                                <img src="@/assets/img/flag/cn.svg"/>
                                <div class="indicator">
                                    <i class="fa-regular fa-check text-white" style="font-size: 10px;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="language-box">
                        <div class="language-option">
                            <input v-model="currentLanguage" type="radio" name="language_selection" value="11"/>
                            <div class="language-option-inner">
                                <img src="@/assets/img/flag/en.svg"/>
                                <div class="indicator">
                                    <i class="fa-regular fa-check text-white" style="font-size: 10px;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="img-wrap has-text-centered">
                    <img class="light-image" src="@/assets/img/language/languages.svg"/>
                    <img class="dark-image" src="@/assets/img/language/languages-dark.svg"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { languagePanel,currentLanguage } from '@/system/store/state.js'
import { useTimeout } from '@vueuse/core'
</script>

<script>
export default {
    inject:['reload'],
    data(){
        return{
            locale:''
        }
    },
    methods:{
        switchLanguage(value){
            this.$i18n.locale = value
            this.reload()
        },
    },
}
</script>