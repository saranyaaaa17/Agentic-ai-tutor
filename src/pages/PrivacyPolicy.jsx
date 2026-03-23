import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#050B14] text-slate-300 font-sans selection:bg-cyan-500/30">
      <Navbar />
      
      <div className="max-w-4xl mx-auto pt-32 px-6 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-12">Last updated: February 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information you provide directly to us when you create an account, update your profile, or communicate with our support team. This may include your name, email address, and learning preferences. We also automatically collect usage data to improve our AI tutoring algorithms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="leading-relaxed">
              We use the collected information to:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>Provide, maintain, and improve our services.</li>
              <li>Personalize your learning experience and assessment feedback.</li>
              <li>Send you technical notices, updates, and support messages.</li>
              <li>Monitor and analyze trends and usage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Protection</h2>
            <p className="leading-relaxed">
              We implement industry-standard security measures to protect your personal data. Your progress and assessment results are stored securely using encryption. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cookies</h2>
            <p className="leading-relaxed">
              We use cookies to authenticate your session and remember your preferences. You can control cookie settings through your browser, but disabling them may affect the functionality of our platform.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
             <p className="leading-relaxed">
               If you have any questions about this Privacy Policy, please contact us at privacy@agentic-tutor.ai.
             </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
