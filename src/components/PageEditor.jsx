import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function PageEditor() {
    const {
        pages, activePageId, setActivePageId, addPage, updatePage, deletePage,
        axes
    } = useApp();

    return (
        <div className="space-y-6 mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Pages</h2>
            </div>

            <div className="space-y-4">
                {pages.map(page => (
                    <PageItem
                        key={page.id}
                        page={page}
                        isActive={page.id === activePageId}
                        setActivePageId={setActivePageId}
                        updatePage={updatePage}
                        deletePage={deletePage}
                        axes={axes}
                        canDelete={pages.length > 1}
                    />
                ))}

                <button
                    onClick={addPage}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium text-sm"
                >
                    <Plus size={18} />
                    Add Page
                </button>
            </div>
        </div>
    );
}

function PageItem({ page, isActive, setActivePageId, updatePage, deletePage, axes, canDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const containerRef = useRef(null);

    const colors = [
        '#f8fafc', // Slate 50
        '#f1f5f9', // Slate 100 (Grey)
        '#f0f9ff', // Sky 50
        '#f0fdf4', // Green 50
        '#fef2f2', // Red 50
        '#fff7ed', // Orange 50
        '#faf5ff', // Purple 50
        '#fff1f2', // Rose 50
        '#ffffff', // White
    ];

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
                rounded-xl border transition-all duration-200 overflow-hidden
                ${isActive
                    ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md bg-white'
                    : 'border-slate-200 hover:border-indigo-300 bg-slate-50'
                }
            `}
        >
            <div
                onClick={() => setActivePageId(page.id)}
                className="p-3 flex items-center justify-between cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                        style={{ backgroundColor: page.backgroundColor }}
                    />
                    <span className={`font-medium text-sm ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {page.title}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(!isEditing);
                    }}
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
                <div className="px-3 pb-3 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200 cursor-default" onClick={e => e.stopPropagation()}>
                    <div className="h-px bg-indigo-100 mb-3" />

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title</label>
                        <input
                            type="text"
                            value={page.title}
                            onChange={(e) => updatePage(page.id, { title: e.target.value })}
                            className="font-medium text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-slate-300"
                            placeholder="Page Title"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">X Axis</label>
                            <select
                                value={page.xAxisId}
                                onChange={(e) => updatePage(page.id, { xAxisId: e.target.value })}
                                className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {axes.filter(a => a.id !== page.yAxisId).map(axis => (
                                    <option key={axis.id} value={axis.id}>{axis.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Y Axis</label>
                            <select
                                value={page.yAxisId}
                                onChange={(e) => updatePage(page.id, { yAxisId: e.target.value })}
                                className="w-full rounded-md border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {axes.filter(a => a.id !== page.xAxisId).map(axis => (
                                    <option key={axis.id} value={axis.id}>{axis.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Background</label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => updatePage(page.id, { backgroundColor: color })}
                                    className={`
                                        w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110
                                        ${page.backgroundColor === color ? 'ring-2 ring-offset-1 ring-indigo-500 border-transparent' : 'border-slate-200'}
                                    `}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        {canDelete ? (
                            <button
                                onClick={() => deletePage(page.id)}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        ) : (
                            <div />
                        )}
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium"
                        >
                            <Save size={14} />
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
