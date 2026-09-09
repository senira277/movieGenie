import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full backdrop-blur-md bg-white/70 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="Genie of Movie logo"
            width={40}
            height={40}
            priority
            className="rounded-md"
          />
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            genieofmovie.com
          </span>
        </div>

      </div>
    </header>
  );
}
