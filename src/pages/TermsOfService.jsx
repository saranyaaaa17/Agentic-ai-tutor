import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-[#050B14] text-slate-300 font-sans selection:bg-cyan-500/30">
      <Navbar />
      
      <div className="max-w-4xl mx-auto pt-32 px-6 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-12">Last updated: February 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using the Multi-Agent AI Tutor platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Account Responsibility</h2>
            <p className="leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Educational Content</h2>
            <p className="leading-relaxed">
              The content provided on this platform is for educational purposes only. While our AI agents strive for accuracy, we cannot guarantee that all information is free from errors. The assessments are simulations and do not constitute official certifications unless explicitly stated.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. User Conduct</h2>
            <p className="leading-relaxed">
              You agree not to use the platform for any unlawful purpose or to interfere with the operation of the service. You will not attempt to reverse engineer our AI models or scrape data from our website.
            </p>
          </section>

          <section>
             <h2 className="text-2xl font-bold text-white mb-4">5. Termination</h2>
             <p className="leading-relaxed">
               We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users or us.
             </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;
