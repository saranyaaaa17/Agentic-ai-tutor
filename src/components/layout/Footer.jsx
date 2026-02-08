const Footer = () => {
  return (
    <footer className="py-16 px-8 bg-[#0B1120] border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row
                      justify-between items-center gap-6">

        <div className="text-sm text-[#9CA3AF]">
          © 2026 Multi-Agent AI Tutor
        </div>

        <div className="flex gap-6 text-sm text-[#9CA3AF]">
          <a href="#" className="hover:text-white transition">Privacy</a>
          <a href="#" className="hover:text-white transition">Terms</a>
          <a href="#" className="hover:text-white transition">Contact</a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
