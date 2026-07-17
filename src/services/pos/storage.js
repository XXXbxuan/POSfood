function readObject(key, fallback = null) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback
    } catch (error) {
        return fallback
    }
}
function readList(key) {
    const value = readObject(key, [])
    return Array.isArray(value) ? value : []
}
function writeObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
    return value
}
function removeKeys(...keys) {
    keys.forEach((key) => localStorage.removeItem(key))
}
export { readList, readObject, removeKeys, writeObject }
