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
                <div className="flex items-center gap-3 flex-1">
                    <input
                        type="text"
                        value={page.title}
                        onChange={(e) => updatePage(page.id, { title: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className={`font-bold text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 rounded px-1.5 py-0.5 w-full focus:outline-none focus:bg-white transition-all ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}
                        placeholder="Page Title"
                    />
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

            {isEditing && (
                <div className="px-3 pb-3 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200 cursor-default" onClick={e => e.stopPropagation()}>
                    <div className="h-px bg-indigo-100 mb-3" />

                    <div className="flex flex-col gap-3 items-center w-full">
                        <div className="w-full relative">
                            <select
                                value={page.xAxisId}
                                onChange={(e) => updatePage(page.id, { xAxisId: e.target.value })}
                                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-indigo-300 transition-colors text-center cursor-pointer"
                                style={{ textAlignLast: 'center' }}
                            >
                                {axes.filter(a => a.id !== page.yAxisId).map(axis => (
                                    <option key={axis.id} value={axis.id}>{axis.label}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">vs</span>

                        <div className="w-full relative">
                            <select
                                value={page.yAxisId}
                                onChange={(e) => updatePage(page.id, { yAxisId: e.target.value })}
                                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-indigo-300 transition-colors text-center cursor-pointer"
                                style={{ textAlignLast: 'center' }}
                            >
                                {axes.filter(a => a.id !== page.xAxisId).map(axis => (
                                    <option key={axis.id} value={axis.id}>{axis.label}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
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
