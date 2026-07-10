import {getItem} from '@/system/store/localstorage';
import router from '@/system/engine/router';

export default{
    install: (app) => {
        app.config.globalProperties.$p = {
            permissionVue(){
                var permission={
                };

                return permission;
            },
            permissionChecker(permissionValue,route){
                if(getItem('authSignToken')){
                    var permissionList = JSON.parse(getItem('permissionList'));
                    var permission = this.permissionVue();
                    
                    if(permissionValue != "" && route == "class"){
                        if(permissionList.includes(permission[permissionValue])){
                            return '';
                        }else{
                            return 'permission_block';
                        }
                    }else if(route != undefined && route != "" && route != " " && route != null){
                        if(permissionList.includes(permission[permissionValue])){
                            router.push(route);
                        }
                    }else if(permissionValue != ""){
                        if(permissionList.includes(permission[permissionValue])){
                            return true;
                        }else{
                            return false;
                        }
                    }
                }else{
                    return true;
                }
            }
        }
    }
}