import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, X, Pencil, RotateCw, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAiSuggestion } from '../hooks/useAiSuggestion';

export default function AxisEditor({ onClose }) {
    const { axes, addAxis, updateAxis, deleteAxis, products, updateProduct, updateProductAxisValues, activeXAxisId, activeYAxisId, currentFileName, constraints, setConstraints, specifications, setSpecifications, restrictToUserSpecs, setRestrictToUserSpecs } = useApp();
    const { enrichProduct } = useAiSuggestion();
    const [isRefreshingAll, setIsRefreshingAll] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newAxis, setNewAxis] = useState({ label: '', leftLabel: '', rightLabel: '' });
    const [newConstraint, setNewConstraint] = useState('');
    const [newSpecification, setNewSpecification] = useState('');

    const handleAdd = () => {
        if (newAxis.label && newAxis.leftLabel && newAxis.rightLabel) {
            addAxis(newAxis);
            setNewAxis({ label: '', leftLabel: '', rightLabel: '' });
            setIsAdding(false);
        }
    };

    const handleAddConstraint = () => {
        if (newConstraint.trim()) {
            setConstraints([...constraints, newConstraint.trim()]);
            setNewConstraint('');
        }
    };

    const handleDeleteConstraint = (index) => {
        const newConstraints = [...constraints];
        newConstraints.splice(index, 1);
        setConstraints(newConstraints);
    };

    const handleAddSpecification = () => {
        if (newSpecification.trim()) {
            setSpecifications([...specifications, newSpecification.trim()]);
            setNewSpecification('');
        }
    };

    const handleDeleteSpecification = (index) => {
        const newSpecs = [...specifications];
        newSpecs.splice(index, 1);
        setSpecifications(newSpecs);
    };

    const stopRefreshRef = useRef(false);

    const handleStopRefresh = () => {
        stopRefreshRef.current = true;
    };

    const handleRefreshAll = async () => {
        if (products.length === 0 || isRefreshingAll) return;

        setIsRefreshingAll(true);
        stopRefreshRef.current = false;

        // Process one by one to avoid rate limits and too many parallel requests
        for (const product of products) {
            if (stopRefreshRef.current) break;

            try {
                // Skip if no name
                if (!product.name || product.name === 'Untitled Product') continue;

                const result = await enrichProduct(
                    product.name,
                    product.url || '',
                    axes,
                    activeXAxisId,
                    activeYAxisId,
                    products.filter(p => p.id !== product.id), // Exclude self from context
                    currentFileName,
                    constraints,
                    specifications
                );

                if (stopRefreshRef.current) break;

                // Update position
                updateProductAxisValues(product.id, {
                    [activeXAxisId]: result.xValue,
                    [activeYAxisId]: result.yValue
                });

                // Update all enriched data + timestamp for animation
                updateProduct(product.id, {
                    url: result.domain || product.url || '',
                    logoUrl: result.logoUrl,
                    reasoning: result.reasoning,
                    usps: result.usps,
                    specifications: result.specifications || {},
                    lastEnriched: Date.now()
                });

            } catch (err) {
                console.error(`Failed to refresh ${product.name}:`, err);
            }
        }

        setIsRefreshingAll(false);
        stopRefreshRef.current = false;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Axes</h2>
                <button
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="grid gap-4">
                {axes.map(axis => (
                    <AxisItem key={axis.id} axis={axis} updateAxis={updateAxis} deleteAxis={deleteAxis} />
                ))}

                {isAdding ? (
                    <div className="bg-white border-indigo-200 shadow-sm rounded-lg border p-3 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-3 mb-4">
                            <div>
                                <input
                                    value={newAxis.label}
                                    onChange={e => setNewAxis({ ...newAxis, label: e.target.value })}
                                    placeholder="Axis Name"
                                    className="font-bold text-slate-800 text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 rounded px-1.5 py-0.5 w-full focus:outline-none focus:bg-white transition-all mb-1"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2 px-1.5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From</label>
                                    <input
                                        value={newAxis.leftLabel}
                                        onChange={e => setNewAxis({ ...newAxis, leftLabel: e.target.value })}
                                        placeholder="Min Label"
                                        className="w-full text-sm text-slate-700 bg-white border border-transparent hover:border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To</label>
                                    <input
                                        value={newAxis.rightLabel}
                                        onChange={e => setNewAxis({ ...newAxis, rightLabel: e.target.value })}
                                        placeholder="Max Label"
                                        className="w-full text-sm text-slate-700 bg-white border border-transparent hover:border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-md font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!newAxis.label || !newAxis.leftLabel || !newAxis.rightLabel}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-xs font-medium"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium text-sm"
                    >
                        <Plus size={18} />
                        Add Axis
                    </button>
                )}
            </div>

            {/* Constraints Section */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-3">AI Constraints</h3>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newConstraint}
                            onChange={(e) => setNewConstraint(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddConstraint();
                                }
                            }}
                            placeholder="e.g. Must be B2B"
                            className="flex-1 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                        <button
                            onClick={handleAddConstraint}
                            disabled={!newConstraint.trim()}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {constraints.map((constraint, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium border border-indigo-100"
                            >
                                <span>{constraint}</span>
                                <button
                                    onClick={() => handleDeleteConstraint(index)}
                                    className="text-indigo-400 hover:text-indigo-600 p-0.5 rounded-full hover:bg-indigo-100 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {constraints.length === 0 && (
                            <div className="text-xs text-slate-400 italic px-1">
                                No constraints added.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Specifications Section */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Specifications</h3>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSpecification}
                            onChange={(e) => setNewSpecification(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSpecification();
                                }
                            }}
                            placeholder="e.g. Founded, Employees, Revenue"
                            className="flex-1 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                        <button
                            onClick={handleAddSpecification}
                            disabled={!newSpecification.trim()}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {specifications.map((spec, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium border border-indigo-100"
                            >
                                <span>{spec}</span>
                                <button
                                    onClick={() => handleDeleteSpecification(index)}
                                    className="text-indigo-400 hover:text-indigo-600 p-0.5 rounded-full hover:bg-indigo-100 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {specifications.length === 0 && (
                            <div className="text-xs text-slate-400 italic px-1">
                                No specifications added.
                            </div>
                        )}
                    </div>

                    {/* Checkboxes below tags */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={restrictToUserSpecs}
                                onChange={(e) => setRestrictToUserSpecs(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-600 font-medium">Only show these on cards</span>
                        </label>

                        <div className="pt-2">
                            <button
                                onClick={isRefreshingAll ? handleStopRefresh : handleRefreshAll}
                                disabled={!isRefreshingAll && products.length === 0}
                                className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium transition-all shadow-sm ${isRefreshingAll
                                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600'
                                    }`}
                            >
                                {isRefreshingAll ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Stop Refreshing</span>
                                    </>
                                ) : (
                                    <>
                                        <RotateCw size={14} />
                                        <span>Refresh All Products</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}

function AxisItem({ axis, updateAxis, deleteAxis }) {
    const [isEditing, setIsEditing] = useState(false);
    // We use local state to track changes before saving?
    // User said: "Make every click outside update the state."
    // This implies we can edit directly on the object or use local state and save on blur.
    // Given the previous pattern was direct update for title, let's try to make it consistent.
    // However, for "click outside update state", it usually means "commit".
    // If we update `axis` directly via `updateAxis` on every keystroke, then "click outside" doesn't need to do anything special.
    // But maybe the user wants to cancel? No, "Make every click outside update the state" implies commit.
    // So live updates are fine.
    // BUT, the expand/collapse logic is key.

    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsEditing(false);
            }
        };

        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing]);

    return (
        <div
            ref={containerRef}
            className={`rounded-lg - lg border transition - all duration - 200
                ${isEditing
                    ? 'bg-white border-indigo-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-indigo-200'
                }
`}
        >
            <div className="p-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <input
                            type="text"
                            value={axis.label}
                            onChange={(e) => updateAxis(axis.id, { ...axis, label: e.target.value })}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.target.blur();
                                }
                            }}
                            className="font-bold text-slate-800 text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 rounded px-1.5 py-0.5 w-full focus:outline-none focus:bg-white transition-all mb-1"
                            placeholder="Axis Name"
                        />

                        {/* Collapsed View: Summary - Hidden as requested */}
                        {!isEditing && (
                            <div
                                className="h-0" // Spacer to keep some height if needed, or just remove. Let's keep it minimal.
                                onClick={() => setIsEditing(true)}
                            >
                            </div>
                        )}

                        {/* Expanded View: Inline Inputs */}
                        {isEditing && (
                            <div className="mt-2 space-y-2 px-1.5 animate-in slide-in-from-top-1 duration-200">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From</label>
                                    <input
                                        type="text"
                                        value={axis.leftLabel}
                                        onChange={(e) => updateAxis(axis.id, { ...axis, leftLabel: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.target.blur();
                                            }
                                        }}
                                        className="w-full text-sm text-slate-700 bg-white border border-transparent hover:border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        placeholder="Min Label"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To</label>
                                    <input
                                        type="text"
                                        value={axis.rightLabel}
                                        onChange={(e) => updateAxis(axis.id, { ...axis, rightLabel: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.target.blur();
                                            }
                                        }}
                                        className="w-full text-sm text-slate-700 bg-white border border-transparent hover:border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        placeholder="Max Label"
                                    />
                                </div>

                                <div className="pt-2 flex justify-between items-center">
                                    <button
                                        onClick={() => deleteAxis(axis.id)}
                                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(!isEditing);
                        }}
                        className={`
p - 1.5 rounded - md transition - colors ml - 2 flex - shrink - 0
                            ${isEditing
                                ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }
`}
                    >
                        {isEditing ? <X size={18} /> : <Pencil size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
