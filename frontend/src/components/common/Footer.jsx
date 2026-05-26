import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">MB</span>
              </div>
              <span className="text-xl font-bold text-white">MotoBikes</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Your trusted partner for premium motorcycles and exceptional service.
              Experience the thrill of the ride with us.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-red-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-red-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-red-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/motorcycles" className="hover:text-red-500 transition-colors">
                  Browse Motorcycles
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-red-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-red-500 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/my-bookings?open=testride" className="hover:text-red-500 transition-colors">
                  Book a Test Ride
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/my-orders" className="hover:text-red-500 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-red-500 transition-colors">
                  Warranty Information
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-red-500 transition-colors">
                  Maintenance Services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-red-500 transition-colors">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  123 Motorcycle Street, District 1<br />
                  Ho Chi Minh City, Vietnam
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm">+84 123 456 789</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm">info@motobikes.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {currentYear} MotoBikes. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm hover:text-red-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm hover:text-red-500 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm hover:text-red-500 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
