import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Check, X, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAiSuggestion } from '../hooks/useAiSuggestion';

export default function ProductCard({ product, x, y, containerRef, onDragEnd, isDraggingEnabled = true }) {
    const { updateProduct, deleteProduct, activeXAxisId, activeYAxisId, currentFileName } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(product.name);
    const [editUrl, setEditUrl] = useState(product.url || '');
    const [editLogoUrl, setEditLogoUrl] = useState(product.logoUrl || '');
    const inputRef = useRef(null);
    const isDragging = useRef(false);
    const [yOffset, setYOffset] = useState(0);

    const colors = [
        { bg: 'bg-white', border: 'border-slate-200' },
        { bg: 'bg-red-100', border: 'border-red-200' },
        { bg: 'bg-amber-100', border: 'border-amber-200' },
        { bg: 'bg-emerald-100', border: 'border-emerald-200' },
        { bg: 'bg-blue-100', border: 'border-blue-200' },
        { bg: 'bg-indigo-100', border: 'border-indigo-200' },
        { bg: 'bg-violet-100', border: 'border-violet-200' },
        { bg: 'bg-pink-100', border: 'border-pink-200' },
    ];

    const cardRef = useRef(null);
    const hoverTimeoutRef = useRef(null);
    const [isClicking, setIsClicking] = useState(false);

    // Adjust position when editing to prevent cutoff at bottom of viewport
    useEffect(() => {
        if (isEditing && cardRef.current) {
            // Use requestAnimationFrame to ensure layout is complete
            const adjustPosition = () => {
                if (!cardRef.current) return;

                const cardRect = cardRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;

                // Check if card extends beyond bottom of viewport
                const bottomOverflow = cardRect.bottom - viewportHeight;

                if (bottomOverflow > 20) { // 20px padding from bottom
                    setYOffset(-bottomOverflow - 20);
                } else {
                    setYOffset(0);
                }
            };

            // Wait for layout to complete
            setTimeout(adjustPosition, 100);
        } else {
            setYOffset(0);
        }
    }, [isEditing, product.usps?.length, product.specifications ? Object.keys(product.specifications).length : 0]);

    // Click outside to save and close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isEditing && cardRef.current && !cardRef.current.contains(event.target)) {
                handleSaveName();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing, editName, editUrl, editLogoUrl]);

    // Remove auto-focus effect
    // useEffect(() => {
    //     if (isEditing) {
    //         inputRef.current?.focus();
    //     }
    // }, [isEditing]);

    // Reset isClicking when opening edit mode
    useEffect(() => {
        if (isEditing) {
            setIsClicking(false);
        }
    }, [isEditing]);

    const handleSaveName = async () => {
        // Always save whatever is in the state, even if empty (though we might want to revert if empty name)
        if (editName.trim()) {
            let logoToSave = editLogoUrl.trim();
            const trimmedName = editName.trim();

            // Auto-fetch logo if URL is empty
            if (!logoToSave && trimmedName) {
                const words = trimmedName.toLowerCase().split(' ');
                let domain = words[0].replace(/[^a-z0-9.]/g, '');

                if (!domain.includes('.')) {
                    domain += '.com';
                }
                logoToSave = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            }

            updateProduct(product.id, {
                name: trimmedName,
                url: editUrl.trim(),
                logoUrl: logoToSave
            });

            // If this was a new product (default name) and user changed it, auto-enrich
            if (product.name === 'Untitled Product' && trimmedName !== 'Untitled Product') {
                await handleEnrichProduct();
            } else {
                setIsEditing(false);
            }
        } else {
            // Revert if empty
            setEditName(product.name);
            setEditUrl(product.url || '');
            setEditLogoUrl(product.logoUrl || '');
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditName(product.name);
        setEditUrl(product.url || '');
        setEditLogoUrl(product.logoUrl || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveName();
        }
        if (e.key === 'Escape') handleCancelEdit();
    };

    const handleColorSelect = (color) => {
        updateProduct(product.id, { color: `${color.bg} ${color.border}` });
    };

    const { enrichProduct, isLoading: isAiLoading } = useAiSuggestion();
    const { axes, products, updateProductAxisValues, constraints, specifications } = useApp();

    const handleEnrichProduct = async () => {
        if (!editName.trim()) return;

        const trimmedName = editName.trim();
        const trimmedUrl = editUrl.trim();

        try {
            const result = await enrichProduct(
                trimmedName,
                trimmedUrl,
                axes,
                activeXAxisId,
                activeYAxisId,
                products,
                currentFileName,
                constraints,
                specifications
            );

            console.log('AI Enrichment Result:', result);

            // Update position
            updateProductAxisValues(product.id, {
                [activeXAxisId]: result.xValue,
                [activeYAxisId]: result.yValue
            });

            // Update all enriched data
            updateProduct(product.id, {
                name: trimmedName,
                url: result.domain || trimmedUrl,
                logoUrl: result.logoUrl,
                reasoning: result.reasoning,
                usps: result.usps,
                specifications: result.specifications || {}
            });

            // Update local state
            setEditUrl(result.domain || trimmedUrl);
            setEditLogoUrl(result.logoUrl);

            // Don't close edit mode - let user continue editing

        } catch (err) {
            console.error("Failed to enrich product:", err);
            // Ideally show a toast here
        }
    };

    // Default color if none set
    const cardColor = product.color || 'bg-white border-slate-200';

    const handleHoverEdit = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsEditing(true);
        }, 300); // 300ms delay for "short mouseover"
    };

    const handleHoverLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    return (
        <motion.div
            ref={cardRef}
            layout // Enable layout animation for smooth transitions
            drag={isDraggingEnabled}
            dragMomentum={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={(e, info) => {
                isDragging.current = false;
                onDragEnd(e, info);
            }}
            initial={{ opacity: 0, scale: 0.9, x, y }}
            animate={{ opacity: 1, scale: 1, x, y: y + yOffset }}
            transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                y: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3, ease: "easeOut" },
                scale: { duration: 0.3, type: "spring", stiffness: 200, damping: 20 },
                layout: { duration: 0.2 }
            }}
            style={{ touchAction: 'none' }}
            className={`absolute top-0 left-0 cursor-grab active:cursor-grabbing group ${isEditing ? 'z-50' : 'z-10 hover:z-20'}`}
        >
            <div className={`relative ${cardColor} backdrop-blur-sm border shadow-md rounded-2xl p-3 min-w-[120px] max-w-[200px] flex flex-col items-center gap-2 hover:shadow-xl transition-all`}>
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                        {/* Close Button */}
                        {!isClicking && (
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsClicking(true);
                                    setIsEditing(false);
                                    handleSaveName();
                                }}
                                className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors z-20"
                            >
                                <X size={12} />
                            </button>
                        )}

                        {/* Show logo in edit mode if available */}
                        {product.logoUrl && (
                            <img
                                src={product.logoUrl}
                                alt="Logo"
                                className="w-8 h-8 object-contain self-center"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        )}
                        <input
                            ref={inputRef}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Product Name"
                            className="w-full text-sm font-medium text-slate-800 bg-white border border-transparent hover:border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-slate-300 focus:ring-0 text-center transition-colors"
                        />
                        {/* Hidden logo input, auto-handled */}
                        <div className="flex flex-wrap gap-1 justify-center my-2">
                            {colors.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleColorSelect(c)}
                                    className={`w-4 h-4 rounded-full ${c.bg} border ${c.border} hover:scale-125 transition-transform`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2 justify-center w-full">
                            <button
                                onClick={handleEnrichProduct}
                                disabled={isAiLoading || !editName.trim()}
                                className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 w-full justify-center"
                                title="Refresh data with AI"
                            >
                                {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                <span>Refresh</span>
                            </button>
                        </div>
                        <div className="relative w-full">
                            <input
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                onBlur={async () => {
                                    // Enrich when domain changes
                                    if (editUrl.trim() && editUrl.trim() !== product.url && editName.trim() && editName.trim() !== 'Untitled Product') {
                                        await handleEnrichProduct();
                                    }
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Product URL (optional)"
                                className="w-full text-[10px] text-slate-500 bg-transparent border border-transparent hover:border-slate-200 rounded px-2 py-1 pr-6 focus:outline-none focus:border-slate-300 focus:ring-0 text-center transition-colors"
                            />
                            {editUrl && (
                                <a
                                    href={editUrl.startsWith('http') ? editUrl : `https://${editUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Open in new tab"
                                >
                                    <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                        {/* Unified Specifications in edit mode */}
                        {(product.usps?.length > 0 || Object.keys(product.specifications || {}).length > 0) && (
                            <div className="w-full mt-1 pt-1 border-t border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 mb-1">Specifications:</div>
                                <div className="text-[10px] text-slate-500 text-left space-y-0.5">
                                    {product.usps?.map((usp, i) => (
                                        <div key={`usp-${i}`} className="pl-1 flex items-start gap-1">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                                            <span className="text-slate-500 font-medium">{usp}</span>
                                        </div>
                                    ))}
                                    {Object.entries(product.specifications || {}).map(([key, value], i) => (
                                        <div key={`spec-${i}`} className="pl-1 flex items-start gap-1">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                                            <span className="text-slate-500">
                                                {key}: <span className="font-medium text-slate-700">{value}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        className="flex flex-col items-center gap-2 w-full"
                        onDoubleClick={() => setIsEditing(true)}
                    >
                        {product.logoUrl && (
                            <img
                                src={product.logoUrl}
                                alt={product.name}
                                className="w-8 h-8 object-contain select-none pointer-events-none"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        )}
                        <div className="text-sm font-bold text-slate-800 text-center break-words w-full px-1 select-none">
                            {product.name}
                        </div>
                    </div>
                )}

                {/* Hover Actions */}
                {!isEditing && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                            onClick={() => setIsEditing(true)}
                            onMouseEnter={handleHoverEdit}
                            onMouseLeave={handleHoverLeave}
                            className="p-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                        >
                            <Pencil size={12} />
                        </button>
                        <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:text-red-600 hover:border-red-200"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}


            </div>
        </motion.div >
    );
}
