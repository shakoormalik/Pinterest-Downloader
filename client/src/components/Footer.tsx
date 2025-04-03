import { Link } from "wouter";
import { FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-primary text-2xl transform -rotate-45">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" transform="rotate(135 12 12)"></path>
                </svg>
              </span>
              <span className="font-bold text-xl">PinDown</span>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              The fastest, easiest way to download Pinterest videos and images in high quality.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-primary transition duration-200">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary transition duration-200">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary transition duration-200">
                <FaInstagram size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="text-neutral-400 hover:text-primary transition duration-200">Home</a></li>
              <li><a href="#features" className="text-neutral-400 hover:text-primary transition duration-200">Features</a></li>
              <li><a href="#how-it-works" className="text-neutral-400 hover:text-primary transition duration-200">How It Works</a></li>
              <li><a href="#faq" className="text-neutral-400 hover:text-primary transition duration-200">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-primary transition duration-200">Blog</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-primary transition duration-200">Help Center</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-primary transition duration-200">Contact Us</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-primary transition duration-200">Feedback</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-primary transition duration-200">Terms of Service</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-primary transition duration-200">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-primary transition duration-200">Cookie Policy</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-primary transition duration-200">DMCA</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-12 pt-8 text-center text-neutral-400 text-sm">
          <p>© {new Date().getFullYear()} PinDown. All rights reserved. Not affiliated with Pinterest.</p>
        </div>
      </div>
    </footer>
  );
}
