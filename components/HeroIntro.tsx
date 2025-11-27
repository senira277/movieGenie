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
          Exhausted of searching through Google for movies?
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Our AI engine will find the best movies for you within seconds!
        </p>

        <button
          onClick={scrollToGenerator}
          className="px-8 py-4 rounded-full bg-black text-white text-lg font-semibold hover:bg-gray-800 transition-all shadow-lg"
        >
          Start
        </button>
      </div>
    </section>
  );
}
