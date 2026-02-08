import { motion, useScroll, useSpring } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import HeroSection from "../components/landing/HeroSection";
import AboutSection from "../components/landing/AboutSection";
import HowItWorks from "../components/landing/HowItWorks";
import FeaturesSection from "../components/landing/FeaturesSection";
import PremiumSection from "../components/landing/PremiumSection";
import Footer from "../components/layout/Footer";
import FloatingAssistant from "../components/assistant/FloatingAssistant";

const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="bg-[#050B14] text-white min-h-screen overflow-x-hidden relative selection:bg-cyan-500/30">
      
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-linear-to-r from-cyan-500 to-purple-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
          {/* Grid Pattern overlay would go here if we had the SVG, using CSS radial gradient for now */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px] opacity-20" /> 
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="relative z-10 pt-20">

        {/* Home / Hero */}
        <section id="home" className="min-h-screen flex items-center">
          <HeroSection />
        </section>

        {/* About */}
        <section id="about" className="py-6">
          <AboutSection />
        </section>

        {/* Workflow */}
        <section id="workflow" className="py-6 bg-black/20 backdrop-blur-sm">
          <HowItWorks />
        </section>

        {/* Features */}
        <section id="features" className="py-6">
          <FeaturesSection />
        </section>

        {/* Premium */}
        <section id="premium" className="py-6">
          <PremiumSection />
        </section>

      </main>

      {/* Footer */}
      <Footer />

      {/* Floating AI Assistant */}
      <FloatingAssistant />

    </div>
  );
};

export default LandingPage;
