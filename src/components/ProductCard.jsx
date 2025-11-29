import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product, x, y, containerRef, onDragEnd, isDraggingEnabled = true }) {
    const { updateProduct, deleteProduct, activeXAxisId, activeYAxisId } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(product.name);
    const [editLogoUrl, setEditLogoUrl] = useState(product.logoUrl || '');
    const inputRef = useRef(null);
    const isDragging = useRef(false);

    const colors = [
        { bg: 'bg-white', border: 'border-slate-200' },
        { bg: 'bg-red-100', border: 'border-red-200' },
        { bg: 'bg-orange-100', border: 'border-orange-200' },
        { bg: 'bg-amber-100', border: 'border-amber-200' },
        { bg: 'bg-emerald-100', border: 'border-emerald-200' },
        { bg: 'bg-cyan-100', border: 'border-cyan-200' },
        { bg: 'bg-blue-100', border: 'border-blue-200' },
        { bg: 'bg-indigo-100', border: 'border-indigo-200' },
        { bg: 'bg-violet-100', border: 'border-violet-200' },
        { bg: 'bg-fuchsia-100', border: 'border-fuchsia-200' },
        { bg: 'bg-pink-100', border: 'border-pink-200' },
    ];

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleSaveName = () => {
        if (editName.trim()) {
            let logoToSave = editLogoUrl.trim();

            // Auto-fetch logo if URL is empty
            if (!logoToSave && editName.trim()) {
                // Simple heuristic: try to guess domain from name
                // Remove spaces and special chars, assume .com if no dot
                let domain = editName.trim().toLowerCase().replace(/[^a-z0-9.]/g, '');
                if (!domain.includes('.')) {
                    domain += '.com';
                }
                logoToSave = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            }

            updateProduct(product.id, {
                name: editName.trim(),
                logoUrl: logoToSave
            });
        } else {
            setEditName(product.name);
            setEditLogoUrl(product.logoUrl || '');
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditName(product.name);
        setEditLogoUrl(product.logoUrl || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSaveName();
        if (e.key === 'Escape') handleCancelEdit();
    };

    const handleColorSelect = (color) => {
        updateProduct(product.id, { color: `${color.bg} ${color.border}` });
    };

    // Default color if none set
    const cardColor = product.color || 'bg-white border-slate-200';

    return (
        <motion.div
            drag={isDraggingEnabled}
            dragMomentum={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={(e, info) => {
                isDragging.current = false;
                onDragEnd(e, info);
            }}
            initial={{ opacity: 0, scale: 0.9, x, y }}
            animate={{ opacity: 1, scale: 1, x, y }}
            transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                y: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3, ease: "easeOut" },
                scale: { duration: 0.3, type: "spring", stiffness: 200, damping: 20 }
            }}
            style={{ touchAction: 'none' }}
            className="absolute top-0 left-0 cursor-grab active:cursor-grabbing group z-10 hover:z-20"
        >
            <div className={`relative ${cardColor} backdrop-blur-sm border shadow-md rounded-2xl p-3 min-w-[120px] max-w-[200px] flex flex-col items-center gap-2 hover:shadow-xl transition-all`}>
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                        <input
                            ref={inputRef}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Product Name"
                            className="w-full text-sm font-medium text-slate-800 bg-white border-none shadow-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                            value={editLogoUrl}
                            onChange={(e) => setEditLogoUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Logo URL (optional)"
                            className="w-full text-xs text-slate-600 bg-white border-none shadow-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <div className="flex flex-wrap gap-1 justify-center">
                            {colors.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleColorSelect(c)}
                                    className={`w-4 h-4 rounded-full ${c.bg} border ${c.border} hover:scale-125 transition-transform`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleSaveName}
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded self-center"
                        >
                            Done
                        </button>
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
                        {/* <div className="text-[10px] font-medium text-slate-400 select-none">
                            {Math.round(product.axisValues[activeXAxisId] ?? 50)}% / {Math.round(product.axisValues[activeYAxisId] ?? 50)}%
                        </div> */}
                    </div>
                )}

                {/* Hover Actions */}
                {!isEditing && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                            onClick={() => setIsEditing(true)}
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

                {/* AI Reasoning Tooltip */}
                {product.reasoning && !isEditing && (
                    <div className="absolute -bottom-2 -right-2 z-30">
                        <div className="group/info relative">
                            <div className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold border border-indigo-200 cursor-help shadow-sm">
                                i
                            </div>
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none">
                                {product.reasoning}
                                <div className="mt-2 pt-2 border-t border-slate-700 flex flex-col gap-0.5 text-[10px] text-slate-300">
                                    <div className="flex justify-between">
                                        <span>{useApp().axes.find(a => a.id === activeXAxisId)?.label}:</span>
                                        <span className="font-mono">{Math.round(product.axisValues[activeXAxisId] || 50)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{useApp().axes.find(a => a.id === activeYAxisId)?.label}:</span>
                                        <span className="font-mono">{Math.round(product.axisValues[activeYAxisId] || 50)}%</span>
                                    </div>
                                </div>
                                <div className="absolute top-full right-1 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
