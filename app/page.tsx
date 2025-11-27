// app/page.tsx

import type { Metadata } from "next";
import Header from '@/components/Header';
import HeroIntro from '@/components/HeroIntro';
import HeroSlider from '@/components/HeroSlider';
import Generator from '@/components/Generator';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';

export const metadata: Metadata = {
  title: "MovieGen – AI Movie & TV Show Recommendation Engine",
  description:
    "Find the perfect movie or TV series instantly using AI. Filter by mood, genre, IMDb rating, and more. Fast, simple, frustration-free movie discovery.",
  keywords: [
    "movie recommendation",
    "tv series recommendation",
    "AI movie suggestions",
    "what to watch",
    "movie finder",
    "recommend me a movie",
    "AI film recommendations",
  ],
  openGraph: {
    title: "MovieGen – AI Movie & TV Show Recommendation Engine",
    description:
      "Instant AI-powered movie and TV show recommendations. Mood-based, genre-based, IMDb-based filters. Stop scrolling. Start watching.",
    url: "https://yourdomain.com",
    siteName: "MovieGen",
    images: [
      {
        url: "https://yourdomain.com/og-image.jpg", // add later
        width: 1200,
        height: 630,
        alt: "MovieGen AI Recommendation Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieGen – Find What to Watch Instantly",
    description:
      "AI-powered movie and TV series recommendations based on mood, genre, IMDb rating, and custom prompts.",
    images: ["https://yourdomain.com/og-image.jpg"], // add later
  },
  alternates: {
    canonical: "https://yourdomain.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <StructuredData />
      <header>
        <Header />
      </header>
      
      <section>
        <HeroIntro />
        <HeroSlider />
      </section>
      
      

      {/* Improve SEO: semantic section */}
      <section id="generator" className="max-w-6xl mx-auto px-4 py-16" aria-labelledby="movie-generator-section">
        <h2 id="movie-generator-section" className="sr-only">Movie Recommendation Generator</h2>
        <Generator />
      </section>

      <Footer />
    </main>
  );
}
