import { getEAES, getDAES } from '@/system/engine/security.js'

var projectName = "template_";

var serializer = {
    read: (v) => v ? JSON.parse(getDAES(v)) : null,
    write: (v) => getEAES(JSON.stringify(v)),
}

export function getItem(name){
    var value = localStorage.getItem(projectName+name)
    return serializer.read(value)
}

export function setItem(name, value){
    var serializedValue = serializer.write(value)
    return localStorage.setItem(projectName+name, serializedValue)
}

export function removeItem(name){
    return localStorage.removeItem(projectName+name)
}