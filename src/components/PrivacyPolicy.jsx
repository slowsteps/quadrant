import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
                <div className="mb-8">
                    <Link to="/" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to App
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
                <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-slate max-w-none text-slate-600">
                    <p className="lead text-lg">
                        We respect your privacy. This policy explains what data we collect and how we handle it.
                        In short: We only collect what's needed to make the app work.
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">1. Information We Collect</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Account Info:</strong> When you sign in with Google, we receive your email address and basic profile info (like your name and avatar) to create your account.</li>
                        <li><strong>Project Data:</strong> We store the quadrants, products, and configurations you create so you can save and load your work.</li>
                    </ul>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">2. How We Use Your Data</h3>
                    <p>
                        We use your data solely to provide the usemap.io service.
                        <ul>
                            <li>To authenticate you and save your projects.</li>
                            <li>To improve the app's functionality.</li>
                        </ul>
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">3. Third-Party Services</h3>
                    <p>
                        We rely on trusted third-party providers to run our app:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Supabase:</strong> Used for secure database hosting and authentication. Your data is stored in their secure cloud infrastructure.</li>
                        <li><strong>OpenAI:</strong> Used for AI features. When you request a suggestion or enrichment, the specific text you provide is sent to OpenAI's API. We do not use your data to train OpenAI's models.</li>
                        <li><strong>Google:</strong> Used for authentication. We never see or store your Google password.</li>
                    </ul>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">4. Data Retention</h3>
                    <p>
                        We keep your data as long as you have an account. You can delete your projects at any time within the app.
                    </p>

                    <h3 className="text-slate-900 font-semibold mt-8 mb-4 text-xl">5. Contact Us</h3>
                    <p>
                        If you have any questions about your data or this policy, please reach out to us.
                    </p>
                </div>
            </div>
        </div>
    );
}
