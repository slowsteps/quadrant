import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Car, ShoppingBag, FilePlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const { loadData, newProject } = useApp();

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hasSeenOnboarding', 'true');
    };

    const loadFashionExample = () => {
        const data = {
            axes: [
                { id: 'price', label: 'Price', leftLabel: 'Mass Market', rightLabel: 'Luxury' },
                { id: 'style', label: 'Style', leftLabel: 'Classic', rightLabel: 'Trendy' },
            ],
            products: [
                { id: 'p1', name: 'Zara', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=zara.com&sz=128', axisValues: { price: 40, style: 85 } },
                { id: 'p2', name: 'H&M', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=hm.com&sz=128', axisValues: { price: 20, style: 60 } },
                { id: 'p3', name: 'Gucci', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=gucci.com&sz=128', axisValues: { price: 95, style: 75 } },
                { id: 'p4', name: 'Uniqlo', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=uniqlo.com&sz=128', axisValues: { price: 30, style: 20 } },
                { id: 'p5', name: 'Louis Vuitton', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=louisvuitton.com&sz=128', axisValues: { price: 98, style: 40 } },
            ],
            pages: [
                { id: 'default', title: 'Fashion Landscape', xAxisId: 'price', yAxisId: 'style', backgroundColor: '#f8fafc' }
            ]
        };
        loadData(data, 'Fashion Brands');
        handleClose();
    };

    const loadCarsExample = () => {
        const data = {
            axes: [
                { id: 'performance', label: 'Performance', leftLabel: 'Commuter', rightLabel: 'Sport' },
                { id: 'price', label: 'Price', leftLabel: 'Budget', rightLabel: 'Premium' },
            ],
            products: [
                { id: 'c1', name: 'Toyota Corolla', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=toyota.com&sz=128', axisValues: { performance: 20, price: 30 } },
                { id: 'c2', name: 'Porsche 911', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=porsche.com&sz=128', axisValues: { performance: 95, price: 90 } },
                { id: 'c3', name: 'Tesla Model 3', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=tesla.com&sz=128', axisValues: { performance: 70, price: 50 } },
                { id: 'c4', name: 'Honda Civic', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=honda.com&sz=128', axisValues: { performance: 30, price: 25 } },
                { id: 'c5', name: 'Ferrari F8', color: 'bg-white border-slate-200', logoUrl: 'https://www.google.com/s2/favicons?domain=ferrari.com&sz=128', axisValues: { performance: 98, price: 98 } },
            ],
            pages: [
                { id: 'default', title: 'Automotive Market', xAxisId: 'price', yAxisId: 'performance', backgroundColor: '#f8fafc' }
            ]
        };
        loadData(data, 'Car Market');
        handleClose();
    };

    const startEmpty = () => {
        newProject();
        handleClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to usemap.io</h2>
                                    <p className="text-slate-500 text-lg">Private Beta</p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <p className="text-slate-600 mb-4 text-lg leading-relaxed">
                                Create interactive quadrant charts to visualize your product landscape.
                                Map competitors, analyze market gaps, and share your insights.
                            </p>

                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-8 space-y-2">
                                <p className="text-sm text-indigo-800">
                                    <strong>Note:</strong> You'll need to sign in with Google to save your projects to the cloud.
                                </p>
                                <p className="text-sm text-indigo-800">
                                    <strong>Note:</strong> Not optimized for phones.
                                </p>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-4">Example Projects</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <button
                                    onClick={loadFashionExample}
                                    className="flex flex-col items-center gap-4 p-6 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group text-center"
                                >
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 mb-1">Fashion Brands</div>
                                        <div className="text-xs text-slate-500">Price vs Style</div>
                                    </div>
                                </button>

                                <button
                                    onClick={loadCarsExample}
                                    className="flex flex-col items-center gap-4 p-6 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group text-center"
                                >
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 mb-1">Car Market</div>
                                        <div className="text-xs text-slate-500">Price vs Performance</div>
                                    </div>
                                </button>

                                <button
                                    onClick={startEmpty}
                                    className="flex flex-col items-center gap-4 p-6 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group text-center"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FilePlus size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 mb-1">Empty Project</div>
                                        <div className="text-xs text-slate-500">Start from scratch</div>
                                    </div>
                                </button>
                            </div>

                            <div className="text-center pt-6 border-t border-slate-100">
                                <p className="text-sm text-slate-400">
                                    Have feedback? We'd love to hear from you at{' '}
                                    <a href="mailto:peter@wungi.com" className="text-indigo-600 hover:underline font-medium">
                                        peter@wungi.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
