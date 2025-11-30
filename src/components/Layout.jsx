import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Settings, Save, History, Loader2, ChevronDown, FilePlus } from 'lucide-react';
import QuadrantChart from './QuadrantChart';
import AxisEditor from './AxisEditor';
import PageEditor from './PageEditor';
import Controls from './Controls';
import { AppProvider, useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthProvider';
import OnboardingModal from './OnboardingModal';

function LayoutContent() {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const {
        currentFileName, updateFileName,
        pages, activePageId, setActivePageId,
        isDirty, saveToCloud, fetchQuadrants, loadQuadrant, newProject,
        axes, activeXAxisId, activeYAxisId
    } = useApp();
    const { user, signInWithGoogle, signOut } = useAuth();

    // Recent (Cloud Load) State
    const [showRecent, setShowRecent] = useState(false);
    const [cloudFiles, setCloudFiles] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const recentRef = useRef(null);
    const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

    // Page Menu State
    const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
    const pageMenuRef = useRef(null);

    // Auto-load most recent project on sign-in
    useEffect(() => {
        const autoLoad = async () => {
            if (user && !hasAutoLoaded) {
                try {
                    const files = await fetchQuadrants();
                    if (files.length > 0) {
                        await loadQuadrant(files[0].id);
                        console.log('Auto-loaded most recent project:', files[0].name);
                    }
                } catch (err) {
                    console.error('Failed to auto-load project:', err);
                } finally {
                    setHasAutoLoaded(true);
                }
            }
        };
        autoLoad();
    }, [user, hasAutoLoaded, fetchQuadrants, loadQuadrant]);

    // Handle click outside for Recent
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (recentRef.current && !recentRef.current.contains(event.target)) {
                setShowRecent(false);
            }
        };

        if (showRecent) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showRecent]);

    // Handle click outside for Page Menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pageMenuRef.current && !pageMenuRef.current.contains(event.target)) {
                setIsPageMenuOpen(false);
            }
        };

        if (isPageMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPageMenuOpen]);

    const handleSave = async () => {
        if (user) {
            try {
                setIsSaving(true);
                await saveToCloud();
            } catch (err) {
                console.error(err);
                alert('Failed to save to Supabase');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleRecentClick = async () => {
        if (!showRecent) {
            try {
                const files = await fetchQuadrants();
                setCloudFiles(files);
                setShowRecent(true);
            } catch (err) {
                console.error(err);
                alert('Failed to fetch files');
            }
        } else {
            setShowRecent(false);
        }
    };

    const loadCloudFile = async (id) => {
        try {
            await loadQuadrant(id);
            setShowRecent(false);
        } catch (err) {
            console.error(err);
            alert('Failed to load file');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
            <OnboardingModal />
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-md">
                            <LayoutGrid className="text-white w-6 h-6" />
                        </div>
                        <input
                            value={currentFileName}
                            onChange={(e) => updateFileName(e.target.value)}
                            className="text-xl font-bold text-slate-800 bg-transparent border-none hover:bg-white/50 focus:bg-white focus:ring-0 focus:outline-none transition-all px-2 py-1 rounded min-w-[10ch] cursor-pointer focus:cursor-text"
                            style={{ width: `${Math.max(10, currentFileName.length)}ch` }}
                            placeholder="Untitled"
                        />
                    </div>

                    {/* Chunky Page Selector (Moved from Controls) */}
                    <div className="h-8 w-px bg-slate-200"></div>

                    <div className="relative" ref={pageMenuRef}>
                        <button
                            onClick={() => setIsPageMenuOpen(!isPageMenuOpen)}
                            className={`
                                flex items-center gap-3 px-4 py-2 rounded-xl transition-all border text-left min-w-[200px]
                                ${isPageMenuOpen
                                    ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                }
                            `}
                        >
                            <div className="flex-1">
                                <div className="font-bold text-slate-800 text-sm">
                                    {pages.find(p => p.id === activePageId)?.title || 'Untitled Page'}
                                </div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">
                                    {axes.find(a => a.id === activeXAxisId)?.label} vs {axes.find(a => a.id === activeYAxisId)?.label}
                                </div>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isPageMenuOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                        </button>

                        {/* Page Dropdown */}
                        {isPageMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Switch Page
                                </div>
                                {pages.map(page => (
                                    <button
                                        key={page.id}
                                        onClick={() => {
                                            setActivePageId(page.id);
                                            setIsPageMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                                            ${page.id === activePageId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}
                                        `}
                                    >
                                        {/* Removed color swatch as requested */}
                                        <div className="flex-1 truncate font-medium">
                                            {page.title}
                                        </div>
                                        {page.id === activePageId && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Save & Recent (Only if logged in) */}
                    {user && (
                        <>
                            <button
                                onClick={newProject}
                                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                                title="New Project"
                            >
                                <FilePlus size={18} />
                                New Project
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!isDirty || isSaving}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isDirty
                                    ? 'text-indigo-600 hover:bg-indigo-50'
                                    : 'text-slate-400'
                                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={isDirty ? `Save changes` : 'No changes to save'}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>

                            <div className="relative" ref={recentRef}>
                                <button
                                    onClick={handleRecentClick}
                                    className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                                    title="Recent Files"
                                >
                                    <History size={18} />
                                    Recent
                                </button>

                                {showRecent && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                                        <div className="p-2">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Recent Quadrants</h3>
                                            {cloudFiles.length === 0 ? (
                                                <div className="text-sm text-slate-400 px-2 py-1">No recent files</div>
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
                            <div className="h-8 w-px bg-slate-200 mx-2"></div>
                        </>
                    )}

                    {user ? (
                        <div className="flex items-center gap-3">
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt={user.email}
                                    className="w-8 h-8 rounded-full border border-slate-200"
                                    title={user.email}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200" title={user.email}>
                                    {user.email[0].toUpperCase()}
                                </div>
                            )}
                            <button
                                onClick={signOut}
                                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={signInWithGoogle}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Sign In
                        </button>
                    )}
                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                    <button
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${isPanelOpen
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                            } border border-slate-200`}
                    >
                        <Settings size={18} />
                        {isPanelOpen ? 'Close Editor' : 'Edit'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Chart Area */}
                <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                    <div className="border-b border-slate-200 bg-white px-6 py-3 shrink-0">
                        <Controls />
                    </div>
                    <div className="flex-1 p-6 overflow-hidden bg-slate-50/50 relative">
                        <QuadrantChart />
                    </div>
                </div>

                {/* Side Panel */}
                <div
                    className={`border-l border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col ${isPanelOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full opacity-0'
                        }`}
                >
                    <div className="flex-1 overflow-y-auto p-6 min-w-[24rem]">
                        <AxisEditor onClose={() => setIsPanelOpen(false)} />
                        <PageEditor />
                    </div>
                </div>
            </main>
        </div >
    );
}

export default function Layout() {
    return (
        <AppProvider>
            <LayoutContent />
        </AppProvider>
    );
}
