import React, { useState } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAiSuggestion } from '../hooks/useAiSuggestion';

export default function Controls() {
    const {
        addProduct,
        products,
        axes,
        activeXAxisId,
        activeYAxisId,
        constraints,
        currentFileName,
        specifications
    } = useApp();

    const { generateSuggestion, isLoading, error } = useAiSuggestion();
    const [showError, setShowError] = useState(false);

    const handleAiSuggestion = async () => {
        try {
            setShowError(false);
            const suggestion = await generateSuggestion(products, axes, activeXAxisId, activeYAxisId, constraints, currentFileName, specifications);

            // Create axis values object using the active axes
            const axisValues = {
                [activeXAxisId]: suggestion.xValue,
                [activeYAxisId]: suggestion.yValue
            };

            // Add default values for other axes
            axes.forEach(axis => {
                if (!axisValues[axis.id]) {
                    axisValues[axis.id] = 50;
                }
            });

            // Add product with axis values, logo URL, reasoning, USPs, and specifications from AI suggestion
            addProduct(suggestion.name, axisValues, suggestion.logoUrl || null, suggestion.reasoning || null, suggestion.usps || null, suggestion.domain || null, suggestion.specifications || {});
        } catch (err) {
            console.error('Failed to generate suggestion:', err);
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
        }
    };

    return (
        <div className="flex items-center justify-center relative h-10">
            {/* Centered Add Product Button */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
                <button
                    onClick={() => addProduct('Untitled Product')}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-medium text-sm"
                >
                    <Plus size={18} />
                    Add Product
                </button>

                {/* AI Suggestion Button - only show when 2+ products */}
                {products.length >= 2 && (
                    <button
                        onClick={handleAiSuggestion}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Thinking...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                AI Suggestion
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Error message */}
            {showError && error && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm shadow-lg max-w-md">
                    {error}
                </div>
            )}
        </div>
    );
}
