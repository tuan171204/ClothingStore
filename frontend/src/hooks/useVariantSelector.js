import { useState, useMemo, useCallback } from 'react';

export function useVariantSelector(skus = [], options = []) {
    const [selected, setSelected] = useState({});

    // MEMOIZED: recompute only when skus or selected changes
    const availability = useMemo(() => {
        const result = {};
        options.forEach(opt => {
            const compatible = skus.filter(sku =>
                Object.entries(selected).every(([k, v]) =>
                    k === opt.name ? true : sku.options[k] === v
                )
            );
            result[opt.name] = new Set(
                compatible.map(s => s.options[opt.name]).filter(Boolean)
            );
        });
        return result;
    }, [skus, selected, options]);

    // MEMOIZED: find current SKU only when selections change
    const currentSku = useMemo(() => {
        if (Object.keys(selected).length < options.length) return null;
        return skus.find(sku =>
            Object.entries(selected).every(([k, v]) => sku.options[k] === v)
        ) ?? null;
    }, [skus, selected, options]);

    // Whether a value is selectable (combination exists)
    const isSelectable = useCallback((optionName, value) => {
        return availability[optionName]?.has(value) ?? false;
    }, [availability]);

    // Whether a value leads to any in-stock SKU
    const hasStock = useCallback((optionName, value) => {
        return skus.some(sku =>
            sku.inStock &&
            sku.options[optionName] === value &&
            Object.entries(selected).every(([k, v]) =>
                k === optionName ? true : sku.options[k] === v
            )
        );
    }, [skus, selected]);

    const selectValue = useCallback((optionName, value) => {
        setSelected(prev => {
            if (prev[optionName] === value) {
                const { [optionName]: _, ...rest } = prev;
                return rest; // deselect
            }
            return { ...prev, [optionName]: value };
        });
    }, []);

    const reset = useCallback(() => setSelected({}), []);

    const initSelection = useCallback((initialState) => {
        setSelected(initialState);
    }, []);

    return { selected, currentSku, isSelectable, hasStock, selectValue, reset, initSelection };
}