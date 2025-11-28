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

    // Page management
    const [pages, setPages] = useState([
        { id: 'default', title: 'Page 1', xAxisId: 'price', yAxisId: 'quality', backgroundColor: '#f8fafc' }
    ]);
    const [activePageId, setActivePageId] = useState('default');

    const [currentFileName, setCurrentFileName] = useState('quadrant-data');
    const [fileHandle, setFileHandle] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const { user } = useAuth();

    // Derived state
    const activePage = pages.find(p => p.id === activePageId) || pages[0];
    const activeXAxisId = activePage?.xAxisId || (axes[0]?.id);
    const activeYAxisId = activePage?.yAxisId || (axes[1]?.id);

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    // Page Actions
    const addPage = () => {
        const newPage = {
            id: generateId(),
            title: `Page ${pages.length + 1}`,
            xAxisId: axes[0]?.id,
            yAxisId: axes[1]?.id,
            backgroundColor: '#f8fafc'
        };
        setPages([...pages, newPage]);
        setActivePageId(newPage.id);
        setIsDirty(true);
    };

    const updatePage = (id, updates) => {
        setPages(pages.map(p => p.id === id ? { ...p, ...updates } : p));
        setIsDirty(true);
    };

    const deletePage = (id) => {
        if (pages.length <= 1) return; // Prevent deleting last page
        const newPages = pages.filter(p => p.id !== id);
        setPages(newPages);
        if (activePageId === id) {
            setActivePageId(newPages[0].id);
        }
        setIsDirty(true);
    };

    // Axis Actions
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

        // Update pages that were using this axis
        const updatedPages = pages.map(p => {
            let updates = {};
            if (p.xAxisId === id) updates.xAxisId = newAxes[0]?.id;
            if (p.yAxisId === id) updates.yAxisId = newAxes[0]?.id;
            return Object.keys(updates).length > 0 ? { ...p, ...updates } : p;
        });

        if (JSON.stringify(updatedPages) !== JSON.stringify(pages)) {
            setPages(updatedPages);
        }
    };

    // Product Actions
    const addProduct = (name, axisValues = null, logoUrl = null, reasoning = null) => {
        const defaultAxisValues = {};
        axes.forEach(axis => {
            defaultAxisValues[axis.id] = 50;
        });

        setProducts([...products, {
            id: generateId(),
            name,
            color: 'bg-white border-slate-200',
            logoUrl: logoUrl || '',
            reasoning: reasoning || null,
            axisValues: axisValues || defaultAxisValues
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

    // Persistence
    const loadData = (data, fileName, handle = null) => {
        if (data.axes) setAxes(data.axes);
        if (data.products) setProducts(data.products);

        // Handle legacy data format (no pages)
        if (data.pages) {
            setPages(data.pages);
            setActivePageId(data.pages[0]?.id || 'default');
        } else {
            // Convert legacy state to single page
            const initialPage = {
                id: 'default',
                title: 'Page 1',
                xAxisId: data.activeXAxisId || axes[0]?.id,
                yAxisId: data.activeYAxisId || axes[1]?.id,
                backgroundColor: '#f8fafc'
            };
            setPages([initialPage]);
            setActivePageId('default');
        }

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

        const data = {
            axes,
            products,
            pages // Save pages structure
        };

        const { data: existing } = await supabase
            .from('quadrants')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', currentFileName)
            .maybeSingle();

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

    // Compatibility setters for Controls component
    const setActiveXAxisId = (id) => updatePage(activePageId, { xAxisId: id });
    const setActiveYAxisId = (id) => updatePage(activePageId, { yAxisId: id });

    return (
        <AppContext.Provider value={{
            axes, addAxis, updateAxis, deleteAxis,
            products, addProduct, updateProduct, updateProductAxisValues, deleteProduct,
            pages, activePageId, activePage, addPage, updatePage, deletePage, setActivePageId,
            activeXAxisId, setActiveXAxisId,
            activeYAxisId, setActiveYAxisId,
            loadData,
            currentFileName, setCurrentFileName, updateFileName,
            fileHandle, setFileHandle,
            isDirty, setIsDirty,
            saveToCloud, fetchQuadrants, loadQuadrant
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
