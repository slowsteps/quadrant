import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
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
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {isAdding && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                                <input
                                    value={newAxis.label}
                                    onChange={e => setNewAxis({ ...newAxis, label: e.target.value })}
                                    placeholder="e.g. Price"
                                    className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                )}

                {axes.map(axis => (
                    <AxisItem key={axis.id} axis={axis} updateAxis={updateAxis} deleteAxis={deleteAxis} />
                ))}
            </div>
        </div>
    );
}

function AxisItem({ axis, updateAxis, deleteAxis }) {
    const [isEditing, setIsEditing] = useState(false);
    const [edited, setEdited] = useState(axis);

    const handleSave = () => {
        updateAxis(axis.id, edited);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="bg-slate-50 p-3 rounded-lg border border-indigo-200 shadow-sm">
                <div className="space-y-2 mb-3">
                    <input
                        value={edited.label}
                        onChange={e => setEdited({ ...edited, label: e.target.value })}
                        className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            value={edited.leftLabel}
                            onChange={e => setEdited({ ...edited, leftLabel: e.target.value })}
                            className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Min"
                        />
                        <input
                            value={edited.rightLabel}
                            onChange={e => setEdited({ ...edited, rightLabel: e.target.value })}
                            className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Max"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="p-1 text-slate-500 hover:bg-slate-200 rounded"
                    >
                        <X size={16} />
                    </button>
                    <button
                        onClick={handleSave}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                        <Save size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
            <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">{axis.label}</div>
                <div className="text-xs text-slate-500 truncate">
                    {axis.leftLabel} <span className="text-slate-300 mx-1">↔</span> {axis.rightLabel}
                </div>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                    <PencilIcon />
                </button>
                <button
                    onClick={() => deleteAxis(axis.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

function PencilIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </svg>
    );
}
