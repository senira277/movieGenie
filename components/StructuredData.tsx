"use client";

export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MovieGen",
    url: "https://yourdomain.com",
    applicationCategory: "EntertainmentApplication",
    description:
      "AI-powered movie and TV show recommendation engine based on mood, genre, IMDb rating, and custom preferences.",
    operatingSystem: "All",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
