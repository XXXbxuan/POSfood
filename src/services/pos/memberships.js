import {
    readList,
    readObject,
    writeObject,
} from '@/services/pos/storage.js'

const MEMBER_KEY = 'posfood_members'
const POINT_HISTORY_KEY = 'posfood_member_points'
const CURRENT_MEMBER_KEY = 'posfood_current_member'

function cleanPhone(value) {
    return String(value || '').replace(/[^0-9+]/g, '')
}

function nextMemberId(members) {
    const highest = members.reduce((max, member) => {
        const number = Number(String(member.memberId || '').replace(/\D/g, ''))
        return Math.max(max, Number.isFinite(number) ? number : 0)
    }, 0)
    return `M${String(highest + 1).padStart(5, '0')}`
}

function normalizeMember(member) {
    return {
        id: member.id || `MEMBER-${Date.now()}`,
        memberId: member.memberId || '',
        name: String(member.name || '').trim(),
        phone: cleanPhone(member.phone),
        email: String(member.email || '').trim(),
        birthday: member.birthday || '',
        note: String(member.note || '').trim(),
        points: Math.max(0, Number(member.points || 0)),
        totalSpent: Math.max(0, Number(member.totalSpent || 0)),
        totalOrders: Math.max(0, Number(member.totalOrders || 0)),
        status: member.status === 'inactive' ? 'inactive' : 'active',
        createdAt: member.createdAt || new Date().toISOString(),
        updatedAt: member.updatedAt || new Date().toISOString(),
    }
}

function loadMembers() {
    return readList(MEMBER_KEY).map(normalizeMember)
}

function saveMembers(members) {
    return writeObject(MEMBER_KEY, members.map(normalizeMember))
}

function saveMember(input) {
    const members = loadMembers()
    const phone = cleanPhone(input.phone)
    if (!input.name?.trim()) throw new Error('Customer name is required.')
    if (!phone) throw new Error('Phone number is required.')
    const duplicate = members.find(
        (member) => member.phone === phone && member.id !== input.id,
    )
    if (duplicate) throw new Error('This phone number is already registered.')
    const existingIndex = members.findIndex((member) => member.id === input.id)
    const existing = existingIndex >= 0 ? members[existingIndex] : null
    const member = normalizeMember({
        ...existing,
        ...input,
        id: existing?.id || `MEMBER-${Date.now()}`,
        memberId: existing?.memberId || nextMemberId(members),
        phone,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    })
    if (existingIndex >= 0) members.splice(existingIndex, 1, member)
    else members.unshift(member)
    saveMembers(members)
    return member
}

function setMemberStatus(id, status) {
    const members = loadMembers()
    const member = members.find((item) => item.id === id)
    if (!member) return null
    member.status = status === 'inactive' ? 'inactive' : 'active'
    member.updatedAt = new Date().toISOString()
    saveMembers(members)
    return member
}

function findMember(query) {
    const keyword = String(query || '')
        .trim()
        .toLowerCase()
    if (!keyword) return null
    const phone = cleanPhone(keyword)
    return (
        loadMembers().find(
            (member) =>
                member.status === 'active' &&
                (member.memberId.toLowerCase() === keyword ||
                    member.phone === phone),
        ) || null
    )
}

function loadCurrentMember() {
    const saved = readObject(CURRENT_MEMBER_KEY)
    if (!saved?.id) return null
    return (
        loadMembers().find(
            (member) => member.id === saved.id && member.status === 'active',
        ) || null
    )
}

function setCurrentMember(member) {
    if (member?.id) writeObject(CURRENT_MEMBER_KEY, member)
    else localStorage.removeItem(CURRENT_MEMBER_KEY)
    window.dispatchEvent(
        new CustomEvent('pos-member:changed', {
            detail: member?.id ? member : null,
        }),
    )
    return member || null
}

function clearCurrentMember() {
    return setCurrentMember(null)
}

function recordMemberSale(memberId, receipt) {
    if (!memberId || !receipt?.id) return null
    const history = readList(POINT_HISTORY_KEY)
    if (history.some((entry) => entry.saleId === receipt.id)) return null
    const members = loadMembers()
    const member = members.find((item) => item.id === memberId)
    if (!member) return null
    const spent = Math.max(0, Number(receipt.total || 0))
    const points = Math.floor(spent)
    member.points += points
    member.totalSpent += spent
    member.totalOrders += 1
    member.updatedAt = new Date().toISOString()
    saveMembers(members)
    writeObject(POINT_HISTORY_KEY, [
        {
            id: `POINT-${Date.now()}`,
            memberId,
            saleId: receipt.id,
            points,
            amount: spent,
            type: 'earned',
            createdAt: new Date().toISOString(),
        },
        ...history,
    ])
    return { member, points }
}

function memberPointHistory(memberId) {
    return readList(POINT_HISTORY_KEY).filter(
        (entry) => entry.memberId === memberId,
    )
}

export {
    clearCurrentMember,
    cleanPhone,
    findMember,
    loadCurrentMember,
    loadMembers,
    memberPointHistory,
    recordMemberSale,
    saveMember,
    setCurrentMember,
    setMemberStatus,
}
