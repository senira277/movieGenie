'use client';

import { useEffect, useState, useRef } from 'react';
import { Film, Tv, Sparkles, Clapperboard, RotateCcw, Shuffle, ArrowRight, Frown, Calendar, Star, X, Clock, Trophy, Users, User } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const moods = ['Happy', 'Neutral', 'Sad', 'Nostalgic', 'Excited'];
const genres = ['Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Sci-Fi'];
const timePeriods = [
  { label: 'Last 10 Years (>2015)', value: '2015' },
  { label: 'Last 15 Years (>2010)', value: '2010' },
  { label: 'Last 25 Years (>2000)', value: '2000' },
  { label: 'No Preference', value: 'all' }
];

const loadingMessages = [
  "Analysing your mood...",
  "Scanning the archives...",
  "Populating watch list...",
  "Curating the perfect pick...",
  "Checking IMDb ratings...",
  "Fetching posters..."
];

interface Recommendation {
  title: string;
  year: string;
  trailerUrl: string;
  poster?: string;
  imdbRating?: string;
  plot?: string;
  genre?: string;
  actors?: string;
  director?: string;
  awards?: string;
  runtime?: string;
  rated?: string;
}

export default function Generator() {
  const topRef = useRef<HTMLElement>(null);

  const [prefs, setPrefs] = useState({
    type: 'movie',
    mood: '',
    genres: [] as string[],
    timePeriod: 'all',
    rating: '',
    customPrompt: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false); // <--- NEW STATE
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [seenHistory, setSeenHistory] = useState<{ title: string, year: string }[]>([]);
  
  const [selectedMovie, setSelectedMovie] = useState<Recommendation | null>(null);

  // Scroll to top on results
  useEffect(() => {
    if (!isLoading && recommendations.length > 0) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading, recommendations]);

  // Load preferences
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem('moviegen-preferences');
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        setPrefs(prev => ({ 
          ...prev, 
          ...parsed,
          timePeriod: parsed.timePeriod || 'all' 
        }));
      }
      
      const savedHistory = localStorage.getItem('moviegen-seen');
      if(savedHistory) setSeenHistory(JSON.parse(savedHistory));

    } catch (e) {
      console.error('Error parsing stored data', e);
    }
  }, []);

  const handleGenerate = async (isJumble = false) => {
    if (!prefs.mood || prefs.genres.length === 0) {
      toast.error('Please select at least a mood and one genre');
      return;
    }

    if (!isJumble) {
      setSeenHistory([]);
      localStorage.removeItem('moviegen-seen');
      setHasGenerated(true); // Mark as generated
    }

    localStorage.setItem('moviegen-preferences', JSON.stringify(prefs));
    
    setIsLoading(true);
    setErrorMsg('');
    
    if (!isJumble) setRecommendations([]); 

    try {
      const exclusionList = isJumble ? seenHistory : [];
      const excludeString = exclusionList.length > 0
        ? `IMPORTANT: You MUST exclude these exact titles from your recommendations: ${exclusionList.map(i => `${i.title} (${i.year})`).join(', ')}.`
        : '';

      const timeConstraint = prefs.timePeriod !== 'all' 
        ? `Released strictly after the year ${prefs.timePeriod}`
        : '';

      const userPrompt = `
        Recommend 5 ${prefs.type}s that match the following criteria:
        Mood: ${prefs.mood}
        Genres: ${prefs.genres.join(', ')} (don't be strict on these just somet genre that alligns with the movie)
        ${timeConstraint}
        ${prefs.rating ? `Minimum Rating: ${prefs.rating}/10` : ''}
        ${prefs.customPrompt ? `Additional preferences: ${prefs.customPrompt}` : ''}
        
        ${excludeString}

        Prioritize matches for the custom prompt if provided.
        Ensure diversity. There is a lot of ${prefs.type}s out there!
        
        Return a JSON array of objects with exactly these fields:
        - title (string)
        - year (string)
        - trailerUrl (string - provide only youtube search link )
      `;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error("Daily limit reached! Come back tomorrow.", {
            duration: 5000,
            style: { border: '1px solid red', color: 'red' }
        });
        throw new Error("Rate limit reached");
      }

      if (!res.ok) throw new Error(data.message || `HTTP error! status: ${res.status}`);
      if (data.success && Array.isArray(data.data)) {
        const rawRecs = data.data;

        const validRes = await fetch("/api/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recommendations: rawRecs, preferences: prefs }),
        });

        const validationData = await validRes.json();
        if (!validRes.ok) throw new Error(validationData.message || "Validation failed");
        
        const finalRecs = validationData.data || [];

        if (finalRecs.length === 0 && rawRecs.length > 0) {
             throw new Error("Matches found, but they didn't meet your strict rating/year criteria.");
        }

        setRecommendations(finalRecs);
        setHasGenerated(true); // Ensure this is true on success

        if (finalRecs.length > 0) {
          const newHistory = [...(isJumble ? seenHistory : []), ...finalRecs.map((r: Recommendation) => ({ title: r.title, year: r.year }))];
          setSeenHistory(newHistory);
          localStorage.setItem('moviegen-seen', JSON.stringify(newHistory));
        }
      } else {
        throw new Error("Invalid response format from API");
      }

    } catch (error: any) {
      console.error("Generation error:", error);
      if (error.message !== "Rate limit reached") {
          setErrorMsg(error.message || "Failed to generate recommendations");
      }
      if (isJumble && recommendations.length === 0) setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations([]);
    setSeenHistory([]);
    setHasGenerated(false); // Reset this so the form shows again
    localStorage.removeItem('moviegen-seen');
    setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const toggleType = (value: string) => setPrefs((p) => ({ ...p, type: value }));
  const toggleMood = (value: string) => setPrefs((p) => ({ ...p, mood: value }));
  const toggleGenre = (value: string) => {
    setPrefs((p) => {
      const exists = p.genres.includes(value);
      return { ...p, genres: exists ? p.genres.filter((g) => g !== value) : [...p.genres, value] };
    });
  };
  const toggleTimePeriod = (value: string) => setPrefs((p) => ({ ...p, timePeriod: value }));

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500); 
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <section 
      ref={topRef}
      className="glass-card rounded-3xl shadow-2xl p-6 md:p-12 transition-all duration-500 ease-in-out min-h-[600px] flex items-center justify-center relative"
    >
      <Toaster position="top-center" richColors />

      {/* --- DETAILS MODAL --- */}
      {selectedMovie && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedMovie(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedMovie(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto w-full h-full flex flex-col md:flex-row">
              <div className="md:w-2/5 h-64 md:h-auto relative bg-gray-900 flex-shrink-0">
                 {selectedMovie.poster ? (
                   <img src={selectedMovie.poster} alt={selectedMovie.title} className="w-full h-full object-cover opacity-90" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-500"><Film size={48}/></div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r" />
              </div>

              <div className="p-8 md:p-10 md:w-3/5 flex flex-col text-left">
                 <div className="mb-6">
                   <div className="flex flex-wrap gap-2 mb-3">
                      {selectedMovie.rated && <span className="px-2 py-1 text-xs font-bold border border-gray-300 rounded text-gray-600">{selectedMovie.rated}</span>}
                      {selectedMovie.runtime && <span className="px-2 py-1 text-xs font-bold bg-gray-100 rounded text-gray-600 flex items-center gap-1"><Clock size={12}/> {selectedMovie.runtime}</span>}
                      <span className="px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 rounded flex items-center gap-1"><Star size={12} className="fill-yellow-800"/> {selectedMovie.imdbRating}/10</span>
                   </div>
                   
                   <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-2 pr-8">{selectedMovie.title}</h2>
                   <div className="flex items-center gap-3 text-gray-500 font-medium">
                      <span>{selectedMovie.year}</span>
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"/>
                      <span>{selectedMovie.genre}</span>
                   </div>
                 </div>

                 <p className="text-gray-700 text-lg leading-relaxed mb-8">
                   {selectedMovie.plot || "No plot summary available."}
                 </p>

                 <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-2xl">
                   {selectedMovie.director && (
                     <div className="flex gap-3">
                       <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                       <div>
                         <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Director</span>
                         <span className="text-gray-900 font-medium">{selectedMovie.director}</span>
                       </div>
                     </div>
                   )}
                   {selectedMovie.actors && (
                     <div className="flex gap-3">
                       <Users className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                       <div>
                         <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Cast</span>
                         <span className="text-gray-900 font-medium">{selectedMovie.actors}</span>
                       </div>
                     </div>
                   )}
                   {selectedMovie.awards && selectedMovie.awards !== "N/A" && (
                     <div className="flex gap-3">
                       <Trophy className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                       <div>
                         <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Awards</span>
                         <span className="text-gray-900 font-medium">{selectedMovie.awards}</span>
                       </div>
                     </div>
                   )}
                 </div>

                 <div className="mt-auto">
                   {selectedMovie.trailerUrl && (
                      <a 
                        href={selectedMovie.trailerUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Film size={18} /> Watch Trailer
                      </a>
                   )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto">
        {isLoading ? (
          /* LOADING STATE */
          <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
             <div className="relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 opacity-25"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-black border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="bg-gray-50 p-8 rounded-full shadow-inner relative z-10">
                {prefs.type === 'tv' ? <Tv className="w-12 h-12 text-gray-800 animate-pulse" /> : <Clapperboard className="w-12 h-12 text-gray-800 animate-pulse" />}
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 min-w-[280px]">{loadingMessages[loadingMsgIndex]}</h3>
              <p className="text-gray-500">
                {seenHistory.length > 0 ? "Digging deeper..." : "Consulting the movie gods..."}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Curated For You</h2>
              <p className="text-gray-500">Based on {prefs.mood} mood and {prefs.genres.join(', ')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((rec, i) => (
                <div key={i} className="group flex flex-col sm:flex-row bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="sm:w-40 h-60 sm:h-auto bg-gray-100 flex-shrink-0 relative overflow-hidden cursor-pointer" onClick={() => setSelectedMovie(rec)}>
                     {rec.poster ? (
                        <img 
                          src={rec.poster} 
                          alt={rec.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                     ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                           <Film size={32} />
                        </div>
                     )}
                     {rec.imdbRating && rec.imdbRating !== "N/A" && (
                        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                           <Star size={10} className="text-yellow-400 fill-yellow-400" />
                           {rec.imdbRating}
                        </div>
                     )}
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900 leading-tight cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setSelectedMovie(rec)}>
                          {rec.title}
                        </h3>
                        <span className="text-sm font-medium text-gray-500 border border-gray-200 px-2 py-0.5 rounded">{rec.year}</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
                        {rec.genre}
                      </p>

                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {rec.plot || "No plot summary available."}
                      </p>
                    </div>

                    <div className="flex gap-3 mt-auto">
                      {rec.trailerUrl && (
                        <a href={rec.trailerUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gray-900 text-white text-xs sm:text-sm font-semibold py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                          <Film size={14} /> Trailer
                        </a>
                      )}
                      <button 
                        onClick={() => setSelectedMovie(rec)} 
                        className="flex-1 border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold py-2 rounded-lg hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
                      >
                         Details <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-gray-100">
              <button onClick={handleReset} className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-black hover:text-black transition-all flex items-center justify-center gap-2">
                <RotateCcw size={18} /> Change Preferences
              </button>
              <button onClick={() => handleGenerate(true)} className="px-8 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                <Shuffle size={18} /> Jumble / Load New
              </button>
            </div>
          </div>
        ) : recommendations.length === 0 && hasGenerated && !isLoading ? (
          /* EMPTY STATE (ONLY if hasGenerated is true) */
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Frown className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Hmm, no more matches!</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">We've exhausted the best matches. Try lowering the IMDb rating or changing genres.</p>
            <button onClick={handleReset} className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2">
              <RotateCcw size={18} /> Reset & Try Again
            </button>
          </div>
        ) : (
          /* MAIN FORM CONTENT */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Generate Your Recommendation</h2>
              <p className="text-gray-600 text-lg">Tell us what you're in the mood for</p>
            </div>

            <div className="space-y-8">
              {/* TYPE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">Type</label>
                <div className="flex gap-4">
                  <button onClick={() => toggleType('movie')} className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-xl transition-all ${prefs.type === 'movie' ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}>
                    <Film className="w-5 h-5" /> Movie
                  </button>
                  <button onClick={() => toggleType('tv')} className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-xl transition-all ${prefs.type === 'tv' ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}>
                    <Tv className="w-5 h-5" /> TV Series
                  </button>
                </div>
              </div>

              {/* MOOD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">Mood</label>
                <div className="flex flex-wrap gap-3">
                  {moods.map((mood) => (
                    <button key={mood} onClick={() => toggleMood(mood)} className={`px-6 py-3 border-2 rounded-full transition-all font-medium ${prefs.mood === mood ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}>
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* GENRES */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">Genre {prefs.genres.length > 0 ? `(${prefs.genres.length} selected)` : 'Select all that apply'}</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {genres.map((genre) => (
                    <button key={genre} onClick={() => toggleGenre(genre)} className={`px-6 py-3 border-2 rounded-xl transition-all font-medium ${prefs.genres.includes(genre) ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}>
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* TIME PERIOD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">In which time period would you like your {prefs.type} to be made?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {timePeriods.map((period) => (
                    <button key={period.value} onClick={() => toggleTimePeriod(period.value)} className={`px-6 py-3 border-2 rounded-xl transition-all font-medium text-left flex items-center justify-between ${prefs.timePeriod === period.value ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}>
                      {period.label}
                      {prefs.timePeriod === period.value && <Calendar size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* RATING */}
              <div>
                <label htmlFor="rating" className="block text-sm font-semibold text-gray-700 mb-4">Minimum IMDb Rating (Optional)</label>
                <input type="number" id="rating" min={0} max={10} step={0.1} value={prefs.rating} onChange={(e) => {
                    let value = parseFloat(e.target.value);
                    if (isNaN(value)) { setPrefs((p) => ({ ...p, rating: '' })); return; }
                    if (value > 10) value = 10;
                    if (value < 0) value = 0;
                    setPrefs((p) => ({ ...p, rating: value.toString() }));
                  }} placeholder="e.g., 7.0" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none transition-all" />
              </div>

              {/* CUSTOM PROMPT */}
              <div>
                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-4">Custom Prompt (Optional)</label>
                <input type="text" id="prompt" value={prefs.customPrompt} onChange={(e) => setPrefs((p) => ({ ...p, customPrompt: e.target.value }))} placeholder="Actor, style, vibe..." className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none transition-all" />
              </div>

              {/* GENERATE BUTTON */}
              <div className="space-y-3">
                <button className="w-full bg-black text-white px-8 py-5 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => handleGenerate(false)} disabled={isLoading}>
                  <Sparkles className="w-5 h-5" /> Generate
                </button>
                {errorMsg && <p className="text-red-500 text-center text-sm font-medium animate-in fade-in slide-in-from-top-1">{errorMsg}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}