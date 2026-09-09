import { Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  // TODO: Replace with your actual email address
  const contactEmail = "genieofmovie@gmail.com"; 

  return (
    <footer className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-gray-700">
          <p className="text-sm">
            &copy; {currentYear} - GenieOfMovie - All rights reserved.
          </p>

          <div className="flex gap-6">
            <a
              href={`mailto:${contactEmail}?subject=Inquiry for GenieOfMovie`}
              className="flex items-center gap-2 text-sm hover:text-black transition-colors font-medium group"
              aria-label="Send email for inquiries"
            >
              <div className="p-2 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                <Mail size={18} />
              </div>
              <span>For Inquiries</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}