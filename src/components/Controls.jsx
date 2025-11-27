import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Controls() {
    const {
        addProduct,
    } = useApp();

    return (
        <div className="flex items-center justify-center relative h-10">
            {/* Centered Add Product Button */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <button
                    onClick={() => addProduct('Untitled Product')}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-medium text-sm"
                >
                    <Plus size={18} />
                    Add Product
                </button>
            </div>
        </div>
    );
}
