import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, X, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AxisEditor({ onClose }) {
    const { axes, addAxis, updateAxis, deleteAxis } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [newAxis, setNewAxis] = useState({ label: '', leftLabel: '', rightLabel: '' });

    const handleAdd = () => {
        if (newAxis.label && newAxis.leftLabel && newAxis.rightLabel) {
            addAxis(newAxis);
            setNewAxis({ label: '', leftLabel: '', rightLabel: '' });
            setIsAdding(false);
        }
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
                    <div className="bg-slate-50 p-4 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                                <input
                                    value={newAxis.label}
                                    onChange={e => setNewAxis({ ...newAxis, label: e.target.value })}
                                    placeholder="e.g. Price"
                                    className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Min Label</label>
                                    <input
                                        value={newAxis.leftLabel}
                                        onChange={e => setNewAxis({ ...newAxis, leftLabel: e.target.value })}
                                        placeholder="Low"
                                        className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Max Label</label>
                                    <input
                                        value={newAxis.rightLabel}
                                        onChange={e => setNewAxis({ ...newAxis, rightLabel: e.target.value })}
                                        placeholder="High"
                                        className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium text-sm"
                    >
                        <Plus size={18} />
                        Add Axis
                    </button>
                )}
            </div>

            {/* Reset Onboarding (Dev/Admin Tool) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                    onClick={() => {
                        localStorage.removeItem('hasSeenOnboarding');
                        window.location.reload();
                    }}
                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
                >
                    Reset Onboarding
                </button>
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
            className={`
                rounded-lg border transition-all duration-200
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
                                className="h-4" // Spacer to keep some height if needed, or just remove. Let's keep it minimal.
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
                            p-1.5 rounded-md transition-colors ml-2 flex-shrink-0
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
