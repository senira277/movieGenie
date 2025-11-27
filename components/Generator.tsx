'use client';

import { Film, Tv, Sparkles } from 'lucide-react';

const moods = ['Happy', 'Neutral', 'Sad', 'Nostalgic', 'Excited'];
const genres = ['Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Sci-Fi'];

export default function Generator() {
  return (
    <section className="glass-card rounded-3xl shadow-2xl p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Generate Your Recommendation
          </h2>
          <p className="text-gray-600 text-lg">
            Tell us what you're in the mood for
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Type
            </label>
            <div className="flex gap-4">
              <button className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-xl hover:border-black hover:bg-gray-50 transition-all">
                <Film className="w-5 h-5" />
                <span className="font-medium">Movie</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-xl hover:border-black hover:bg-gray-50 transition-all">
                <Tv className="w-5 h-5" />
                <span className="font-medium">TV Series</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Mood
            </label>
            <div className="flex flex-wrap gap-3">
              {moods.map((mood) => (
                <button
                  key={mood}
                  className="px-6 py-3 border-2 border-gray-300 rounded-full hover:border-black hover:bg-gray-50 transition-all font-medium"
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Genre
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {genres.map((genre) => (
                <button
                  key={genre}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-black hover:bg-gray-50 transition-all font-medium"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="rating"
              className="block text-sm font-semibold text-gray-700 mb-4"
            >
              Minimum IMDb Rating
            </label>
            <input
              type="number"
              id="rating"
              min="0"
              max="10"
              step="0.1"
              placeholder="e.g., 7.0"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-semibold text-gray-700 mb-4"
            >
              Custom Prompt
            </label>
            <input
              type="text"
              id="prompt"
              placeholder="Actor, style, vibe..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none transition-all"
            />
          </div>

          <button className="w-full bg-black text-white px-8 py-5 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl">
            <Sparkles className="w-5 h-5" />
            Generate
          </button>
        </div>
      </div>
    </section>
  );
}
