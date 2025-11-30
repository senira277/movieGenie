// app/page.tsx

import type { Metadata } from "next";
import Header from '@/components/Header';
import HeroIntro from '@/components/HeroIntro';
import HeroSlider from '@/components/HeroSlider';
import Generator from '@/components/Generator';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';



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
