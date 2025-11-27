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
        </div>
    );
}

function AxisItem({ axis, updateAxis, deleteAxis }) {
    const [isEditing, setIsEditing] = useState(false);
    const [edited, setEdited] = useState(axis);
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

    const handleSave = () => {
        updateAxis(axis.id, edited);
        setIsEditing(false);
    };

    return (
        <div
            ref={containerRef}
            className={`
                rounded-lg border transition-all duration-200
                ${isEditing
                    ? 'bg-slate-50 border-indigo-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-indigo-200'
                }
            `}
        >
            <div className="p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-sm truncate">{axis.label}</div>
                    <div className="text-xs text-slate-500 truncate">
                        {axis.leftLabel} <span className="text-slate-300 mx-1">vs</span> {axis.rightLabel}
                    </div>
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`
                        p-1.5 rounded-md transition-colors ml-2
                        ${isEditing
                            ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }
                    `}
                >
                    {isEditing ? <X size={18} /> : <Pencil size={18} />}
                </button>
            </div>

            {isEditing && (
                <div className="px-3 pb-3 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="h-px bg-indigo-100 mb-3" />

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                            <input
                                type="text"
                                value={edited.label}
                                onChange={(e) => setEdited({ ...edited, label: e.target.value })}
                                className="font-medium text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-slate-300"
                                placeholder="Axis Label"
                                autoFocus
                            />
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <input
                                    type="text"
                                    value={edited.leftLabel}
                                    onChange={(e) => setEdited({ ...edited, leftLabel: e.target.value })}
                                    className="text-xs text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:border-slate-300"
                                    placeholder="Min Label"
                                />
                                <input
                                    type="text"
                                    value={edited.rightLabel}
                                    onChange={(e) => setEdited({ ...edited, rightLabel: e.target.value })}
                                    className="text-xs text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:border-slate-300 text-right"
                                    placeholder="Max Label"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <button
                            onClick={() => deleteAxis(axis.id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium"
                        >
                            <Save size={14} />
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
