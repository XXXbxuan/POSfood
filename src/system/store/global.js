import request from '@/system/engine/request.js';
import config from '@/system/engine/config.js';
import {getEAES,getDAES} from '@/system/engine/security.js';
import { ElMessageBox,ElMessage } from 'element-plus';
import {getItem,setItem,removeItem} from '@/system/store/localstorage.js';
import axios from 'axios';
import router from '@/system/engine/router';

export default{
    install: (app) => {
        app.config.globalProperties.$m = {
            postMethod(url,postData){
                const data = request({
                    url: config.url+url,
                    method: 'post',
                    data: postData
                });
                
                return Promise.resolve(data);
            },getMethod(url){
                const data = request({
                    url: config.url+url,
                    method: 'get',
                });
                
                return Promise.resolve(data);
            },getEAES(data){
                return getEAES(data);
            },getDAES(data){
                return getDAES(data);
            },getItem(name){
                return getItem(name);
            },setItem(name,value){
                return setItem(name,value);
            },removeItem(name){
                return removeItem(name);
            },checkSecurityType(type){
                document.location = "js://vidiCmsSecurityType/"+type;
            },genRandomCode(number){
                let text = "";
                let chars = "abcdefghijklmnopqrstuvwxyz123456789";
                
                for( let i=0; i < number; i++ ) {
                    text += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                return text.toUpperCase();
            },genRandomSerialCode(number){
                let text = "";
                let chars = "0123456789";
                
                for( let i=0; i < number; i++ ) {
                    text += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                return text;
            },openBrowser(url){
                if(url.includes('http')){
                    window.open(url, "_blank");  
                }
            },popupErrorMessage(returnMsg,self){
                var text = '';

                returnMsg.forEach(function(value){
                    text+= value+"<br/>";
                });
                
                ElMessageBox.alert(text, self.$t('msg.msg_error_title'), {
                    type: 'error',
                    dangerouslyUseHTMLString: true,
                    confirmButtonClass: 'el-button-none',
                    closeOnClickModal: true
                });
                
            },popupSingleErrorMessage(returnMsg,self){
                ElMessageBox.alert(returnMsg, self.$t('msg.msg_error_title'), {
                    type: 'error',
                    dangerouslyUseHTMLString: true,
                    confirmButtonClass: 'el-button-none',
                    closeOnClickModal: true
                });
            },popupSingleWarningMessage(returnMsg,self){
                ElMessageBox.alert(returnMsg, self.$t('msg.msg_warning_title'), {
                    type: 'warning',
                    dangerouslyUseHTMLString: true,
                    confirmButtonClass: 'el-button-none',
                    closeOnClickModal: true
                });
            },settingSidebar(){
                var sidebar = document.getElementById('main-container');
                if(sidebar.className.includes('openSettingSideBar')){
                    sidebar.classList.remove("openSettingSideBar");
                }else{
                    sidebar.className += " openSettingSideBar";
                }
            },htmlDecoder (str) {
                str = str.replace(/&quot;/g,"'");
                var textArea = document.createElement('textarea');
                textArea.innerHTML = str;

                return textArea.value;
            },backToTop(){
                var isMoving = false;
                var interval;

                if (isMoving) return;
                const start = window.pageYOffset;
                let i = 0;
                isMoving = true;
                interval = setInterval(() => {
                    const next = Math.floor(this.easeInOutQuad(10 * i, start, -start, 500));
                    if (next <= 0) {
                        window.scrollTo(0, 0);
                        clearInterval(interval)
                        isMoving = false;
                    } else {
                        window.scrollTo(0, next);
                    }
                    i++;
                }, 16.7);
            },easeInOutQuad(t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t + b;
                return -c / 2 * (--t * (t - 2) - 1) + b;
            },removeCommonLocalStorage(){
                removeItem('authSignToken');
                removeItem('appVersion');
                removeItem('languageList');
                removeItem('permissionList');
            },telebot(text){
                var botApi = '1379716596:AAGBV7YdzUGw3Hx1ce39x6mscdXJeak47iA';
                var chatId = '-247498799';
                
                axios.post('https://api.telegram.org/bot'+botApi+'/sendMessage?chat_id='+chatId+'&text='+text);
            },getImageUrl(name) {
                return new URL(`/src/assets/img/${name}`, import.meta.url).href
            },checkLogin(){
                if(getItem('authSignToken') == null){
                    return false;
                }else{
                    return true;
                }
            },checkLoginRoute(route){
                if(getItem('authSignToken') == null){
                    router.push('/')
                }else{
                    router.push(route)
                }
            },getStatusColor(status){
                if(status == 'pending' || status == 'process' || status == 'request-submitted' || status == 'opened' || status == 'yellow'){
                    return 'text-yellow';
                }else if(status == 'complete' || status == 'approved' || status == 'active' || status == 'green'){
                    return 'text-green';
                }else if(status == 'reject' || status == 'failed' || status == 'cancel' || status == 'incomplete' || status == 'inactive' || status == 'closed' || status == 'red'){
                    return 'text-red';
                }else{
                    return 'text-black';
                }
            },getRGColor(value){
                if(value.toString().includes('-')){
                    return 'text-red';
                }else{
                    return 'text-green';
                }
            },copyMessage(message){
                ElMessage({
                    message: message,
                    type: 'success',
                    duration: 1000,
                })
            },formatDate(date) {
                var d = new Date(date),
                    month = '' + (d.getMonth() + 1),
                    day = '' + d.getDate(),
                    year = d.getFullYear();
            
                if (month.length < 2) 
                    month = '0' + month;
                if (day.length < 2) 
                    day = '0' + day;
            
                return [year, month, day].join('-');
            },formatCommaNumber(value){
				if(!value) return '0.00';
				var intPart = Number(value).toFixed(0);
				var intPartFormat = intPart.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,'); 
				var floatPart = ".00"; 
				var value2Array = value.split(".");
				if(value2Array.length == 2) {
					floatPart = value2Array[1].toString();
					if(floatPart.length == 1) {
						return intPartFormat + "." + floatPart + '0';
					}else{
					  return intPartFormat + "." + floatPart;
					}
				}else{
					return intPartFormat + floatPart;
				}
			},originBrowser(){
                var url = window.location.href;
                var origin = url.split('/')[0]+'//'+url.split('/')[2];
                return origin;
            }
        }
    }
}