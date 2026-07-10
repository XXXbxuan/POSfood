import axios from 'axios';
import router from '@/system/engine/router';
import {setItem,getItem,removeItem} from '@/system/store/localstorage';
import { ElMessageBox } from 'element-plus';
const service = axios.create({
	// baseURL: process.env.BASE_API,
	timeout: 20000
});

service.interceptors.request.use(
	config =>{
		const token = getItem('authSignToken');
		let language = getItem('currenttemplateLanguage');
		language = (language == 'cn') ? 'cn' : language;
		
		config.headers['f-token'] = token;
		config.headers['f-language'] = language;
		return config;
	}, error =>{
		router.push('/');
		Promise.reject(error);
	}

);

service.interceptors.response.use(
	response =>{
		const data = response.data;
		if(typeof data.maintenance !== 'undefined') {
			router.push('/maintenance');
			setItem('error_msg',data.error);
		}else if(typeof data.code !== 'undefined' && (data.code == 1001 || data.code == 1002)){
			removeItem('authSignToken');
			router.push('/login');
			setItem('error_msg',data.message);
		}else if(data.error == 'error_token_expired' || data.error == 'error_token_invalid' || data.error == 'error_token_mismatch' || data.error == 'version_expired' || data.error == 'token_expired' || data.error == 'error.invalid_token_expired' || data.error == 'error.invalid_token_mismatch' || data.error == 'error.invalid_token_exists' || data.error == 'error.invalid_token' || data.error == 'error.invalid_token_empty'){
			removeItem('authSignToken');
			setItem('tokenExpire','yes');
			router.push('/');
			setItem('error_msg',data.error);
		}else if(typeof data.error_status !== 'undefined'){
			if (location.hostname !== "localhost" && !location.hostname.includes('192.168.')){
				removeItem('authSignToken');
				router.push('/nofound');
			}
			setItem('error_msg',data.error);
		}else{
			return data;
		}
		
	},
	error =>{
		if (location.hostname !== "localhost" && !location.hostname.includes('192.168.')){
			removeItem('authSignToken');
			router.push('/login');
		}
	}

);


export default service;