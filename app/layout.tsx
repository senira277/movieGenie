import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "GenieOfMovie – AI Movie & TV Show Recommendation Engine",
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
    "best movies to watch",
    "tv show suggestions",
    "movie discovery",
    "best action movies",
    "romantic comedies",
    "sci-fi movies",
    "horror movie recommendations",
    "family movies",
    "top rated movies",
    "IMDb based recommendations",
    "mood based movie suggestions",
    "genre based movie finder",
    "custom movie prompts",
    "instant movie recommendations",
    "movie recommendation engine",
    "movies to watch",
    "tv shows to watch",
    "high rated movies",
    "critically acclaimed films",
    "hidden gem movies",
  ],
  openGraph: {
    title: "MovieGen – AI Movie & TV Show Recommendation Engine",
    description:
      "Instant AI-powered movie and TV show recommendations. Mood-based, genre-based, IMDb-based filters. Stop scrolling. Start watching.",
    url: "https://genieofmovie.com",
    siteName: "MovieGen",
    images: [
      {
        url: "https://genieofmovie.com/og-image.jpg", // Make sure this image exists in your public folder!
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
    images: ["https://genieofmovie.com/og-image.jpg"],
  },
  alternates: {
    canonical: "https://genieofmovie.com",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Google Analytics - Load in background */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NZMMK0HYE5"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-NZMMK0HYE5');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}