import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
                <div className="mb-8">
                    <Link to="/" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to App
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
                <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-slate max-w-none text-slate-600">
                    <p className="lead text-lg">
                        Welcome to usemap.io! We believe in keeping things simple and transparent.
                        By using our tool, you agree to these terms.
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">1. What We Do</h3>
                    <p>
                        usemap.io is a tool designed to help you visualize product landscapes and analyze competitors.
                        We provide the canvas; you bring the insights.
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">2. Your Data is Yours</h3>
                    <p>
                        You own the data you create and upload (like project names, product details, and axes).
                        We store this data securely using Supabase so you can access it from anywhere.
                        We don't sell your data to third parties.
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">3. AI Features</h3>
                    <p>
                        Our app uses OpenAI to provide smart suggestions for product positioning and enrichment.
                        When you use these features, relevant text data (like product names or URLs) is sent to OpenAI for processing.
                        Please don't submit sensitive personal information or confidential trade secrets to the AI.
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">4. Account & Security</h3>
                    <p>
                        We use Google Authentication to keep your account secure without requiring a separate password.
                        You are responsible for keeping your Google account secure.
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">5. Disclaimer</h3>
                    <p>
                        This tool is provided "as is." While we strive for reliability, we can't guarantee 100% uptime or that the AI suggestions will always be perfect.
                        Use your professional judgment when making business decisions based on the data.
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">6. Changes</h3>
                    <p>
                        We might update these terms as the app evolves. If we make significant changes, we'll do our best to let you know.
                    </p>
                </div>
            </div>
        </div>
    );
}
