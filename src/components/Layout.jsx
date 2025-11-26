import React, { useState } from 'react';
import { LayoutGrid, Settings } from 'lucide-react';
import QuadrantChart from './QuadrantChart';
import AxisEditor from './AxisEditor';
import Controls from './Controls';
import { AppProvider, useApp } from '../context/AppContext'; // Added useApp import

function LayoutContent() {
    // Original: const [isPanelOpen, setIsPanelOpen] = useState(false);
    // Change: isPanelOpen and setIsPanelOpen are now passed as props
    // However, the original LayoutContent does not receive props.
    // The instruction implies LayoutContent should receive these as props,
    // but the original code manages them internally.
    // Let's assume the intent is to keep it internal for now,
    // and the snippet was just showing the usage of these variables.
    // If the user wants to pass them as props, they need to modify the Layout component as well.
    // For now, I will keep the useState for isPanelOpen/setIsPanelOpen as it's not explicitly removed from the component's internal state management.
    // The instruction snippet shows `const { isPanelOpen, setIsPanelOpen } = props;`
    // but the original `LayoutContent` doesn't take `props`.
    // I will assume the user wants to keep `isPanelOpen` as internal state for `LayoutContent`
    // unless explicitly told to refactor `LayoutContent` to accept props.
    // The primary change is the header and the use of `useApp`.

    const [isPanelOpen, setIsPanelOpen] = useState(false); // Keeping this as per original structure
    const { currentFileName, updateFileName } = useApp(); // Added useApp hook

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-md">
                        <LayoutGrid className="text-white w-6 h-6" />
                    </div>
                    <input
                        value={currentFileName}
                        onChange={(e) => updateFileName(e.target.value)}
                        className="text-xl font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 min-w-[10ch]"
                        style={{ width: `${Math.max(10, currentFileName.length)}ch` }}
                        placeholder="Untitled"
                    />
                </div>
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${isPanelOpen
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                        } border border-slate-200`}
                >
                    <Settings size={18} />
                    {isPanelOpen ? 'Close Editor' : 'Edit Axes'}
                </button>
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
