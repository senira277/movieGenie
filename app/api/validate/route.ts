export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const OMDB_API_KEY = process.env.OMDB_API_KEY;

export async function POST(req: Request) {
  try {
    const { recommendations, preferences } = await req.json();

    if (!recommendations || !Array.isArray(recommendations)) {
      return NextResponse.json({ error: true, message: "Invalid recommendations format" }, { status: 400 });
    }

    // Process all movies in parallel using Promise.all
    const validatedPromises = recommendations.map(async (rec: any) => {
      try {
        // 1. Prepare Parameters for OMDb
        const titleEncoded = encodeURIComponent(rec.title.trim());

        // FIX FOR TV SERIES YEARS:
        // Gemini might return "2016-2020" or "2022–". 
        // OMDb requires ONLY the start year (e.g., "2016") to find the record.
        // We split by hyphen or en-dash and take the first part.
        let startYear = rec.year.split(/[-–]/)[0].trim();
        startYear = startYear.replace(/[^0-9]/g, ''); // Ensure it's just numbers

        // Map 'tv' to 'series' for OMDb
        const typeParam = preferences.type === 'tv' ? 'series' : 'movie';
        
        // Construct URL with Title, Start Year, and Type
        const omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${titleEncoded}&y=${startYear}&type=${typeParam}`;
        
        const response = await fetch(omdbUrl);
        const data = await response.json();

        // 2. Check if movie exists in OMDb
        if (data.Response === "False") {
          console.warn(`OMDb could not find: ${rec.title} (${startYear})`);
          // Optional: If specific year fails, you could try a fallback fetch without the year here
          return null; 
        }

        // --- VALIDATION LOGIC ---

        // A. Validate Genre
        const movieGenres = data.Genre 
          ? data.Genre.split(", ").map((g: string) => g.trim().toLowerCase()) 
          : [];
        
        const userGenres = preferences.genres 
          ? preferences.genres.map((g: string) => g.toLowerCase()) 
          : [];

        // Check intersection of arrays
        const hasMatchingGenre = userGenres.some((userGen: string) => 
          movieGenres.some((movieGen: string) => movieGen.includes(userGen) || userGen.includes(movieGen))
        );

        if (!hasMatchingGenre) {
          console.log(`Skipping "${rec.title}": Genre mismatch. Found: ${movieGenres}`);
          // UNCOMMENT THIS TO ENABLE STRICT GENRE FILTERING
          return null; 
        }

        // B. Validate Rating
        const minRating = parseFloat(preferences.rating);
        const movieRating = parseFloat(data.imdbRating);
        
        if (!isNaN(minRating) && !isNaN(movieRating)) {
          if (movieRating < minRating) {
            console.log(`Skipping "${rec.title}": Rating ${movieRating} < ${minRating}`);
            return null;
          }
        }

        // C. Validate Time Period
        if (preferences.timePeriod && preferences.timePeriod !== 'all') {
            const minYear = parseInt(preferences.timePeriod);
            
            // OMDb Year for series comes like "2011–2019" or "2011–"
            // We strip non-digits and take the first 4 characters (the start year)
            const omdbYearStr = data.Year.replace(/[^0-9–-]/g, '').split(/[-–]/)[0]; 
            const movieYear = parseInt(omdbYearStr);
            
            if (!isNaN(minYear) && !isNaN(movieYear)) {
                if (movieYear <= minYear) {
                     console.log(`Skipping "${rec.title}": Too old (${movieYear})`);
                     return null;
                }
            }
        }

        // --- SUCCESS ---
        return {
          ...rec,
          poster: data.Poster !== "N/A" ? data.Poster : null,
          imdbRating: data.imdbRating,
          plot: data.Plot,
          genre: data.Genre,
          actors: data.Actors,
          director: data.Director,
          awards: data.Awards,
          runtime: data.Runtime,
          rated: data.Rated
        };

      } catch (err) {
        console.error(`Error validating ${rec.title}:`, err);
        return null;
      }
    });

    const results = await Promise.all(validatedPromises);
    const validRecommendations = results.filter(r => r !== null);

    return NextResponse.json({ success: true, data: validRecommendations });

  } catch (error: any) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}