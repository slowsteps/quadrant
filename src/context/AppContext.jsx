import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';

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
    const { user } = useAuth();

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
    const saveToCloud = async () => {
        if (!user) throw new Error('User not authenticated');

        const data = { axes, products, activeXAxisId, activeYAxisId };

        // Check if we already have a cloud ID for this file (we might need to store it)
        // For now, let's just use the currentFileName as the name and upsert based on name + user_id?
        // Or better, let's query to see if a quadrant with this name exists for this user.

        // Simple approach: Upsert based on an ID if we have one, or create new.
        // But we don't have a cloud ID in state yet.
        // Let's try to find by name first.

        const { data: existing } = await supabase
            .from('quadrants')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', currentFileName)
            .single();

        const payload = {
            user_id: user.id,
            name: currentFileName,
            data: data,
            updated_at: new Date()
        };

        if (existing) {
            payload.id = existing.id;
        }

        const { error } = await supabase
            .from('quadrants')
            .upsert(payload);

        if (error) throw error;
        setIsDirty(false);
        return true;
    };

    const fetchQuadrants = async () => {
        if (!user) return [];
        const { data, error } = await supabase
            .from('quadrants')
            .select('id, name, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    };

    const loadQuadrant = async (id) => {
        const { data, error } = await supabase
            .from('quadrants')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (data && data.data) {
            loadData(data.data, data.name);
        }
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
            fileHandle, setFileHandle,
            isDirty, setIsDirty,
            saveToCloud, fetchQuadrants, loadQuadrant
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
