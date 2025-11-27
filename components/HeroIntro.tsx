'use client';

export default function HeroIntro() {
  const scrollToGenerator = () => {
    const section = document.getElementById('generator');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-32 pb-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Exhausted of searching through Google for movies/series?
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Our AI engine will find the best movies and series for you within seconds!
        </p>

        <button
          onClick={scrollToGenerator}
          className="px-8 py-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-lg font-bold transition-all duration-500 hover:from-yellow-300 hover:to-orange-400 shadow-2xl animate-cinematic-pulse relative overflow-hidden group"
        >
          {/* Film strip effect */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-4 h-1 bg-black"></div>
            <div className="absolute top-0 right-0 w-4 h-1 bg-black"></div>
            <div className="absolute bottom-0 left-0 w-4 h-1 bg-black"></div>
            <div className="absolute bottom-0 right-0 w-4 h-1 bg-black"></div>
          </div>
          
          <span className="relative flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
            🎭 Start
            <span className="text-xl group-hover:scale-125 transition-transform">✨</span>
          </span>
        </button>

        <style jsx>{`
          @keyframes cinematic-pulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 40px rgba(245, 158, 11, 0.8), 0 0 60px rgba(249, 115, 22, 0.4);
            }
          }
          .animate-cinematic-pulse {
            animation: cinematic-pulse 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    </section>
  );
}