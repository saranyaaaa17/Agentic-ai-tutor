const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10 py-16 px-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <h3 className="text-xl font-bold">
            AI Tutor
          </h3>

          <p className="text-gray-400 mt-3">
            Multi-agent AI ecosystem for personalized learning mastery.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Concept Mastery</li>
            <li>Problem Solving</li>
            <li>Exam Preparation</li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="font-semibold mb-3">Resources</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Documentation</li>
            <li>Learning Guides</li>
            <li>Support</li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Privacy Policy</li>
            <li>Terms</li>
          </ul>
        </div>

      </div>

      <p className="text-center text-gray-500 mt-10 text-sm">
        © 2026 Multi-Agent AI Tutor
      </p>

    </footer>
  );
};

export default Footer;
