import {onBeforeUnmount, onMounted} from 'vue'

function useEventListener(element,event,callback){
  onMounted(() => {
    element?.value?.addEventListener(event, callback)
  })

  onBeforeUnmount(() => {
    element?.value?.removeEventListener(event, callback)
  })
}

export default useEventListener