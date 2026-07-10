import { createI18n } from 'vue-i18n'
import en from './en.json'
import cn from './cn.json'
import bm from './bm.json'

const i18n = createI18n({
	legacy: false,
	locale: 'en',
	fallbackLocale: 'en',
	globalInjection: true,
	messages: {en,cn,bm}
});

export default i18n;