
import React, { useRef, useState } from 'react';
import { Plus, Save, CloudDownload, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthProvider';

export default function Controls() {
    const {
        axes,
        activeXAxisId, setActiveXAxisId,
        activeYAxisId, setActiveYAxisId,
        addProduct,
        products,
        loadData,
        currentFileName, setCurrentFileName,
        fileHandle, setFileHandle,
        activeXAxisId: xId, activeYAxisId: yId,
        isDirty, setIsDirty,
        saveToCloud, fetchQuadrants, loadQuadrant
    } = useApp();

    const { user } = useAuth();
    const [showCloudLoad, setShowCloudLoad] = useState(false);
    const [cloudFiles, setCloudFiles] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (user) {
            try {
                setIsSaving(true);
                await saveToCloud();
                // Success is indicated by button state returning to normal (or we could keep a brief success state)
                // But user asked for spinner next to disabled save button.
            } catch (err) {
                console.error(err);
                alert('Failed to save to Supabase');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleCloudLoadClick = async () => {
        if (!showCloudLoad) {
            try {
                const files = await fetchQuadrants();
                setCloudFiles(files);
                setShowCloudLoad(true);
            } catch (err) {
                console.error(err);
                alert('Failed to fetch files');
            }
        } else {
            setShowCloudLoad(false);
        }
    };

    const loadCloudFile = async (id) => {
        try {
            await loadQuadrant(id);
            setShowCloudLoad(false);
        } catch (err) {
            console.error(err);
            alert('Failed to load file');
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Horizontal (X)</label>
                    <select
                        value={activeXAxisId}
                        onChange={(e) => setActiveXAxisId(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-2.5 pr-8 shadow-sm"
                    >
                        {axes.filter(a => a.id !== activeYAxisId).map(axis => (
                            <option key={axis.id} value={axis.id}>{axis.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vertical (Y)</label>
                    <select
                        value={activeYAxisId}
                        onChange={(e) => setActiveYAxisId(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-2.5 pr-8 shadow-sm"
                    >
                        {axes.filter(a => a.id !== activeXAxisId).map(axis => (
                            <option key={axis.id} value={axis.id}>{axis.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-2 border-l border-slate-200 pl-4 ml-2">
                <button
                    onClick={() => addProduct('Untitled product')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                >
                    <Plus size={16} />
                    Add Product
                </button>

                <div className="h-8 w-px bg-slate-200 mx-2"></div>

                <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDirty
                        ? 'text-indigo-600 hover:bg-indigo-50'
                        : 'text-slate-400'
                        }`}
                    title={isDirty ? `Save changes` : 'No changes to save'}
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save
                </button>
            </div>

            {user && (
                <div className="relative">
                    <button
                        onClick={handleCloudLoadClick}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                        title="Load from Cloud"
                    >
                        <CloudDownload size={18} />
                        Cloud Load
                    </button>

                    {showCloudLoad && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                            <div className="p-2">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Saved Quadrants</h3>
                                {cloudFiles.length === 0 ? (
                                    <div className="text-sm text-slate-400 px-2 py-1">No saved files</div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {cloudFiles.map(file => (
                                            <button
                                                key={file.id}
                                                onClick={() => loadCloudFile(file.id)}
                                                className="text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors truncate"
                                            >
                                                {file.name}
                                                <span className="block text-xs text-slate-400">
                                                    {new Date(file.updated_at).toLocaleDateString()}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
