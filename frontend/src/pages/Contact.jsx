import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Address</h3>
                  <p className="text-gray-600">123 Motorcycle Street, District 1<br />Ho Chi Minh City, Vietnam</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <p className="text-gray-600">+84 123 456 789</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-gray-600">info@motobikes.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form className="space-y-4">
              <input type="text" placeholder="Your Name" className="input" />
              <input type="email" placeholder="Your Email" className="input" />
              <textarea rows="4" placeholder="Your Message" className="input"></textarea>
              <button type="submit" className="btn btn-primary w-full">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
