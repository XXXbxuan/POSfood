function createProductOptionState(product, savedState = {}) {
    return {
        size: savedState.size || product?.sizes?.[0]?.name || '',
        ingredients: savedState.ingredients
            ? [...savedState.ingredients]
            : [...(product?.ingredients || [])],
        removedIngredients: [...(savedState.removedIngredients || [])],
        addons: [...(savedState.addons || [])],
        modifiers: {
            ...Object.fromEntries(
                (product?.modifierGroups || []).map((group) => [
                    group.name,
                    group.options?.[0]?.name || '',
                ]),
            ),
            ...(savedState.modifiers || {}),
        },
        remark: savedState.remark || '',
    }
}

function selectedProductOptions(product, state) {
    const size = product?.sizes?.find((item) => item.name === state.size)
    const addons = (product?.addons || []).filter((item) =>
        (state.addons || []).includes(item.name),
    )
    const modifiers = (product?.modifierGroups || [])
        .map((group) =>
            (group.options || []).find(
                (item) => item.name === state.modifiers?.[group.name],
            ),
        )
        .filter(Boolean)

    return { size, addons, modifiers }
}

function productOptionExtra(product, state) {
    const { size, addons, modifiers } = selectedProductOptions(product, state)
    return (
        Number(size?.price || 0) +
        addons.reduce((total, item) => total + Number(item.price || 0), 0) +
        modifiers.reduce(
            (total, item) => total + Number(item.price || 0),
            0,
        )
    )
}

function productOptionLines(product, state) {
    const { addons, modifiers } = selectedProductOptions(product, state)
    return [
        state.size,
        ...modifiers.map((item) => item.name),
        ...addons.map((item) => item.name),
        ...(state.removedIngredients || []).map((item) => `No ${item}`),
    ].filter(Boolean)
}

export {
    createProductOptionState,
    productOptionExtra,
    productOptionLines,
}
