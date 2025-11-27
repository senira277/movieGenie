export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-gray-700">
          <p className="text-sm">
            &copy; {currentYear} - GenieOfMovie - All rights reserved.
          </p>

          <div className="flex gap-6">
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-black transition-colors font-medium"
            >
              TikTok
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-black transition-colors font-medium"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
