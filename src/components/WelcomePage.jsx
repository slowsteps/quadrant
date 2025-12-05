import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

import logo from '../assets/logocat.png';

export default function WelcomePage() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 overflow-hidden p-2">
                    <img src={logo} alt="usemap.io logo" className="w-full h-full object-contain bg-white" />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    usemap.io
                </h1>

                <p className="text-slate-600 mb-8 text-lg">
                    Visualize your product landscape, analyze competitors, and make data-driven decisions.
                </p>

                <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 px-6 py-3.5 rounded-xl transition-all font-medium text-base shadow-sm group"
                >
                    <img
                        src="https://www.google.com/favicon.ico"
                        alt="Google"
                        className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                    Continue with Google
                </button>


            </div>

            <footer className="mt-12 text-center text-sm text-slate-400">
                <div className="flex gap-6 justify-center">
                    <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
                </div>
                <p className="mt-4 opacity-70">&copy; {new Date().getFullYear()} usemap.io</p>
            </footer>
        </div>
    );
}
