import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const initialAxes = [
    { id: 'price', label: 'Price', leftLabel: 'Low', rightLabel: 'High' },
    { id: 'quality', label: 'Quality', leftLabel: 'Low', rightLabel: 'High' },
    { id: 'market', label: 'Market Focus', leftLabel: 'Enterprise', rightLabel: 'SMB' },
];

const initialProducts = [
    { id: 'p1', name: 'Product A', color: 'bg-indigo-100 border-indigo-200', axisValues: { price: 80, quality: 80, market: 20 } },
    { id: 'p2', name: 'Product B', color: 'bg-emerald-100 border-emerald-200', axisValues: { price: 30, quality: 50, market: 80 } },
];

export function AppProvider({ children }) {
    const [axes, setAxes] = useState(initialAxes);
    const [products, setProducts] = useState(initialProducts);
    const [activeXAxisId, setActiveXAxisId] = useState('price');
    const [activeYAxisId, setActiveYAxisId] = useState('quality');
    const [currentFileName, setCurrentFileName] = useState('quadrant-data');
    const [fileHandle, setFileHandle] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const addAxis = (axis) => {
        const newAxisId = generateId();
        const newAxis = { ...axis, id: newAxisId };

        // Initialize all existing products with default value for this new axis
        setProducts(products.map(p => ({
            ...p,
            axisValues: {
                ...p.axisValues,
                [newAxisId]: 50  // Default to center
            }
        })));

        setAxes([...axes, newAxis]);
        setIsDirty(true);
    };
    const updateAxis = (id, updates) => {
        setAxes(axes.map(a => a.id === id ? { ...a, ...updates } : a));
        setIsDirty(true);
    };
    const deleteAxis = (id) => {
        const newAxes = axes.filter(a => a.id !== id);
        setAxes(newAxes);
        setIsDirty(true);

        // If we deleted an active axis, switch to the first available one
        if (activeXAxisId === id && newAxes.length > 0) {
            setActiveXAxisId(newAxes[0].id);
        }
        if (activeYAxisId === id && newAxes.length > 0) {
            setActiveYAxisId(newAxes[0].id);
        }
    };

    const addProduct = (name) => {
        // Initialize with default values for all existing axes
        const defaultAxisValues = {};
        axes.forEach(axis => {
            defaultAxisValues[axis.id] = 50;  // Default to center
        });

        setProducts([...products, {
            id: generateId(),
            name,
            color: 'bg-white border-slate-200',
            axisValues: defaultAxisValues
        }]);
        setIsDirty(true);
    };

    const updateProduct = (id, updates) => {
        setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
        setIsDirty(true);
    };

    const updateProductAxisValues = (productId, newValues) => {
        setProducts(currentProducts => currentProducts.map(p => {
            if (p.id !== productId) return p;
            return {
                ...p,
                axisValues: {
                    ...p.axisValues,
                    ...newValues
                }
            };
        }));
        setIsDirty(true);
    };

    const deleteProduct = (id) => {
        setProducts(products.filter(p => p.id !== id));
        setIsDirty(true);
    };

    const loadData = (data, fileName, handle = null) => {
        if (data.axes) setAxes(data.axes);
        if (data.products) setProducts(data.products);
        if (data.activeXAxisId) setActiveXAxisId(data.activeXAxisId);
        if (data.activeYAxisId) setActiveYAxisId(data.activeYAxisId);
        if (fileName) setCurrentFileName(fileName.replace('.json', ''));
        if (handle) setFileHandle(handle);
        setIsDirty(false);
    };

    const updateFileName = (name) => {
        setCurrentFileName(name);
        setIsDirty(true);
    };

    return (
        <AppContext.Provider value={{
            axes, addAxis, updateAxis, deleteAxis,
            products, addProduct, updateProduct, updateProductAxisValues, deleteProduct,
            activeXAxisId, setActiveXAxisId,
            activeYAxisId, setActiveYAxisId,
            loadData,
            currentFileName, setCurrentFileName, updateFileName,
            fileHandle, setFileHandle,
            isDirty, setIsDirty
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
