import CryptoJS from 'crypto-js';

// const privateKey = 'ECebTv563x81mjuS';
// const privateIV = '5bXJyYso2tpjWTvQ';

const privateKey = ']e3svTtJVutZU*yD';
const privateIV = '8L+Mb2MlfX}cmeA%';

function getAesString(data, key, iv) {
    var key_hash = CryptoJS.MD5(key).toString();
    var keyAes = CryptoJS.enc.Utf8.parse(key_hash);  
    var ivAes = CryptoJS.enc.Utf8.parse(iv);
    var encrypted = CryptoJS.AES.encrypt(data, keyAes,
        {
            iv: ivAes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
    return encrypted.toString();
}
function getDAesString(encrypted, key, iv) {
    var key_hash = CryptoJS.MD5(key).toString();
    var keyDAes = CryptoJS.enc.Utf8.parse(key_hash);
    var ivDAes = CryptoJS.enc.Utf8.parse(iv);
    var decrypted = CryptoJS.AES.decrypt(encrypted, keyDAes,
        {
            iv: ivDAes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

export function getEAES(data){
    return getAesString(data, privateKey, privateIV);
}

export function getDAES(data){
    return getDAesString(data, privateKey, privateIV);
}
