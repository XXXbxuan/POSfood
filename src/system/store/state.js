import { useLocalStorage } from '@vueuse/core'
import {getEAES,getDAES} from '@/system/engine/security.js'

var serializer = {
    read: (v) => v ? JSON.parse(getDAES(v)) : null,
    write: (v) => getEAES(JSON.stringify(v)),
}

var projectName = "template_";

export const headerBar = useLocalStorage(projectName+'headerBar', '', {serializer: serializer})
export const languagePanel = useLocalStorage(projectName+'languagePanel', 'none',{serializer: serializer})
export const currentLanguage = useLocalStorage(projectName+'currenttemplateLanguage', 'en',{serializer: serializer})
export const sidebarPanel = useLocalStorage(projectName+'sidebarPanel', '',{serializer: serializer})
export const tempList = useLocalStorage(projectName+'tempList',{},{serializer: serializer})
