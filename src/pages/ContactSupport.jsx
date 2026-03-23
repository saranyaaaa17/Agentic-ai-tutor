import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { motion } from "framer-motion";

const ContactSupport = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate form submission
        setTimeout(() => {
            setSubmitted(true);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#050B14] text-slate-300 font-sans selection:bg-cyan-500/30">
            <Navbar />

            <div className="max-w-4xl mx-auto pt-32 px-6 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Contact Support</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Need help with your learning plan? Found a bug? Or just want to say hi?
                        Our support team (and AI assistants) are here to help.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12">
                    
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4">Direct Channels</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Email Us</p>
                                        <a href="mailto:support@agentictutor.ai" className="text-white hover:text-cyan-400 transition">support@agentictutor.ai</a>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Live Chat</p>
                                        <p className="text-white">Available in Dashboard</p>
                                        <p className="text-xs text-slate-500 mt-1">Mon-Fri, 9am - 6pm EST</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                         <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4">FAQ</h3>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li className="hover:text-cyan-400 cursor-pointer transition">• How do I reset my progress?</li>
                                <li className="hover:text-cyan-400 cursor-pointer transition">• Can I change my learning track?</li>
                                <li className="hover:text-cyan-400 cursor-pointer transition">• Is the certificate valid for jobs?</li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/10">
                        {submitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                <p className="text-slate-400">We'll get back to you within 24 hours.</p>
                                <button 
                                    onClick={() => setSubmitted(false)}
                                    className="mt-8 text-cyan-400 hover:text-cyan-300 font-medium text-sm"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Subject</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    >
                                        <option value="">Select a topic</option>
                                        <option value="technical">Technical Issue</option>
                                        <option value="account">Account Support</option>
                                        <option value="billing">Billing</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Message</label>
                                    <textarea 
                                        required
                                        rows="4"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600 resize-none"
                                        placeholder="How can we help you?"
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    />
                                </div>
                                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20">
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ContactSupport;
