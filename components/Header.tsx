import { Clapperboard } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-6 h-6 text-black" />
          <span className="text-xl font-bold text-black">genieofmovie.com</span>
        </div>
      </div>
    </header>
  );
}
