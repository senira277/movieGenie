'use client';

import { useEffect, useState } from 'react';
import { Film, Tv, Sparkles, Clapperboard, RotateCcw, Shuffle, ArrowRight, Frown } from 'lucide-react';

const moods = ['Happy', 'Neutral', 'Sad', 'Nostalgic', 'Excited'];
const genres = ['Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Sci-Fi'];
const loadingMessages = [
  "Analysing your mood...",
  "Scanning the archives...",
  "Populating watch list...",
  "Curating the perfect pick..."
];

interface Recommendation {
  title: string;
  year: string;
  trailerUrl: string;
}

export default function Generator() {
  const [prefs, setPrefs] = useState({
    type: 'movie',
    mood: '',
    genres: [] as string[],
    rating: '',
    customPrompt: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Track seen movies to exclude them in future "jumbles"
  const [seenHistory, setSeenHistory] = useState<{ title: string, year: string }[]>([]);

  // Load ONLY preferences from localStorage on mount. 
  useEffect(() => {
    try {
      // Clear any stale history on reload
      localStorage.removeItem('moviegen-seen');

      const saved = localStorage.getItem('moviegen-preferences');
      if (saved) setPrefs(JSON.parse(saved));
    } catch (e) {
      console.error('Error parsing stored preferences', e);
    }
  }, []);

  const handleGenerate = async (isJumble = false) => {
    // Validate required fields
    if (!prefs.mood || prefs.genres.length === 0) {
      setErrorMsg('Please select at least a mood and one genre');
      return;
    }

    // Reset history if starting fresh
    if (!isJumble) {
      setSeenHistory([]);
      localStorage.removeItem('moviegen-seen');
    }

    localStorage.setItem('moviegen-preferences', JSON.stringify(prefs));
    console.log('Preferences saved, generating...', prefs);

    setIsLoading(true);
    setErrorMsg('');
    if (!isJumble) setRecommendations([]); // Clear view for fresh start

    try {
      // Construct exclusion list for prompt
      const exclusionList = isJumble ? seenHistory : [];
      const excludeString = exclusionList.length > 0
        ? `IMPORTANT: You MUST exclude these exact titles from your recommendations: ${exclusionList.map(i => `${i.title} (${i.year})`).join(', ')}.`
        : '';

      const userPrompt = `
        Recommend maximum of 5 ${prefs.type}s that match(can be less than 5 if not enough found) the following criteria:
        Mood: ${prefs.mood}
        Genres: ${prefs.genres.join(', ')}
        ${prefs.rating ? `Minimum Rating: ${prefs.rating}/10` : ''}
        ${prefs.customPrompt ? `Additional preferences: ${prefs.customPrompt}` : ''}
        
        ${excludeString}

        if actors(include ${prefs.type}s in which actors contribute) or specific styles are mentioned in the custom prompt, prioritize those.
        Ensure the recommendations are diverse within the given criteria. if not found, return 0 its fine.
        
        Return a JSON array of objects with exactly these fields:
        - title (string)
        - year (string)
        - trailerUrl (string - YouTube URL if available)
      `;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      const data = await res.json();
      console.log("API Response:", data);

      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }

      if (data.error) {
        throw new Error(data.message || "API returned an error");
      }

      if (data.success && Array.isArray(data.data)) {
        const newRecs = data.data;
        setRecommendations(newRecs);

        // Update History
        if (newRecs.length > 0) {
          const newHistory = [...(isJumble ? seenHistory : []), ...newRecs.map((r: Recommendation) => ({ title: r.title, year: r.year }))];
          setSeenHistory(newHistory);
          localStorage.setItem('moviegen-seen', JSON.stringify(newHistory));
        }
      } else {
        throw new Error("Invalid response format from API");
      }

    } catch (error: any) {
      console.error("Generation error:", error);
      setErrorMsg(error.message || "Failed to generate recommendations");
      if (isJumble) {
        // If jumble fails (e.g., no more results), clear recommendations to show empty state
        setRecommendations([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations([]);
    setSeenHistory([]);
    localStorage.removeItem('moviegen-seen');
  };

  // Handlers
  const toggleType = (value: string) => {
    setPrefs((p) => ({ ...p, type: value }));
  };

  const toggleMood = (value: string) => {
    setPrefs((p) => ({ ...p, mood: value }));
  };

  const toggleGenre = (value: string) => {
    setPrefs((p) => {
      const exists = p.genres.includes(value);
      return {
        ...p,
        genres: exists
          ? p.genres.filter((g) => g !== value)
          : [...p.genres, value],
      };
    });
  };

  // Cycle loading messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <section className="glass-card rounded-3xl shadow-2xl p-8 md:p-12 transition-all duration-500 ease-in-out min-h-[600px] flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto">
        {isLoading ? (
          /* LOADING STATE */
          <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 opacity-25"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-black border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>

              <div className="bg-gray-50 p-8 rounded-full shadow-inner relative z-10">
                {prefs.type === 'tv' ? (
                  <Tv className="w-12 h-12 text-gray-800 animate-pulse" />
                ) : (
                  <Clapperboard className="w-12 h-12 text-gray-800 animate-pulse" />
                )}
              </div>

              <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-yellow-400 animate-bounce delay-100" />
              <Film className="absolute -bottom-2 -left-4 w-6 h-6 text-gray-400 animate-bounce delay-300" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 min-w-[280px]">
                {loadingMessages[loadingMsgIndex]}
              </h3>
              <p className="text-gray-500">
                {seenHistory.length > 0 ? "Looking for hidden gems..." : `Finding matches based on ${prefs.genres.length > 0 ? prefs.genres.join(', ') : 'your preferences'}...`}
              </p>
            </div>

            <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full animate-[loading_2s_ease-in-out_infinite] w-1/2"></div>
            </div>
          </div>
        ) : recommendations.length > 0 ? (
          /* RESULTS STATE */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Curated For You
              </h2>
              <p className="text-gray-500">Click details to view more or watch the trailer</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, i) => (
                <div key={i} className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                        <a href={`/${prefs.type === 'movie' ? 'movies' : 'tvshow'}/${encodeURIComponent(rec.title)}&${rec.year}`} className="hover:underline">
                          {rec.title}
                        </a>
                      </h3>
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
                        {rec.year}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    {rec.trailerUrl && (
                      <a
                        href={rec.trailerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Film size={16} />
                        Trailer
                      </a>
                    )}
                    <a
                      href={`/${prefs.type === 'movie' ? 'movies' : 'tvshow'}/${encodeURIComponent(rec.title)}&${rec.year}`}
                      className="flex-1 border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                      Details
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-gray-100">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Change Preferences
              </button>

              <button
                onClick={() => handleGenerate(true)}
                className="px-8 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Shuffle size={18} />
                Jumble / Load New
              </button>
            </div>
          </div>
        ) : recommendations.length === 0 && seenHistory.length > 0 && !isLoading ? (
          /* EMPTY STATE (After Jumble returns nothing) */
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Frown className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Hmm, no more matches!</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              We've exhausted the best matches for your current criteria. Try tweaking your preferences.
            </p>
            <button
              onClick={handleReset}
              className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
            >
              <RotateCcw size={18} />
              Reset & Try Again
            </button>
          </div>
        ) : (
          /* MAIN FORM CONTENT */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Generate Your Recommendation
              </h2>
              <p className="text-gray-600 text-lg">Tell us what you're in the mood for</p>
            </div>

            <div className="space-y-8">
              {/* TYPE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Type
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleType('movie')}
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-xl transition-all 
                      ${prefs.type === 'movie'
                        ? 'border-black bg-gray-100'
                        : 'border-gray-300 hover:border-black hover:bg-gray-50'}
                    `}
                  >
                    <Film className="w-5 h-5" />
                    Movie
                  </button>

                  <button
                    onClick={() => toggleType('tv')}
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-xl transition-all 
                      ${prefs.type === 'tv'
                        ? 'border-black bg-gray-100'
                        : 'border-gray-300 hover:border-black hover:bg-gray-50'}
                    `}
                  >
                    <Tv className="w-5 h-5" />
                    TV Series
                  </button>
                </div>
              </div>

              {/* MOOD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Mood
                </label>
                <div className="flex flex-wrap gap-3">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => toggleMood(mood)}
                      className={`px-6 py-3 border-2 rounded-full transition-all font-medium
                        ${prefs.mood === mood
                          ? 'border-black bg-gray-100'
                          : 'border-gray-300 hover:border-black hover:bg-gray-50'}
                      `}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* GENRES */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Genre {prefs.genres.length > 0 ? `(${prefs.genres.length} selected)` : 'Select all that apply'}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-6 py-3 border-2 rounded-xl transition-all font-medium
                        ${prefs.genres.includes(genre)
                          ? 'border-black bg-gray-100'
                          : 'border-gray-300 hover:border-black hover:bg-gray-50'}
                      `}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* RATING */}
              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-semibold text-gray-700 mb-4"
                >
                  Minimum IMDb Rating (Optional)
                </label>
                <input
                  type="number"
                  id="rating"
                  min={0}
                  max={10}
                  step={0.1}
                  value={prefs.rating}
                  onChange={(e) => {
                    let value = parseFloat(e.target.value);

                    // Clamp value between 0 and 10
                    if (isNaN(value)) {
                      setPrefs((p) => ({ ...p, rating: '' }));
                      return;
                    }

                    if (value > 10) value = 10;
                    if (value < 0) value = 0;

                    setPrefs((p) => ({ ...p, rating: value.toString() }));
                  }}
                  placeholder="e.g., 7.0"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none transition-all"
                />

              </div>

              {/* CUSTOM PROMPT */}
              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-semibold text-gray-700 mb-4"
                >
                  Custom Prompt (Optional)
                </label>
                <input
                  type="text"
                  id="prompt"
                  value={prefs.customPrompt}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, customPrompt: e.target.value }))
                  }
                  placeholder="Actor, style, vibe..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none transition-all"
                />
              </div>

              {/* GENERATE BUTTON */}
              <div className="space-y-3">
                <button
                  className="w-full bg-black text-white px-8 py-5 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleGenerate(false)}
                  disabled={isLoading}
                >
                  <Sparkles className="w-5 h-5" />
                  Generate
                </button>
                {errorMsg && (
                  <p className="text-red-500 text-center text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    {errorMsg}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}