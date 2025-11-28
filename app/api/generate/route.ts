export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  
  try {
    // Rate limiting
    // --- RATE LIMIT CHECK ---
    const ip = getClientIp(req);
    const { success, remaining } = checkRateLimit(ip);
    if (!success) {
      return NextResponse.json(
        { error: true, message: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
    // Parse the request body
    const body = await req.json();
    const { prompt } = body;
    
    console.log("Received prompt:", prompt);

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing");
      return NextResponse.json(
        { error: true, message: "GEMINI_API_KEY is missing" },
        { status: 500 }
      );
    }

    if (!prompt) {
      console.error("No prompt provided");
      return NextResponse.json(
        { error: true, message: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log("Initializing GoogleGenAI...");
    const gemini = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("Sending request to Gemini...");
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash", // Use stable version instead of experimental
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              year: { type: "STRING" },
              trailerUrl: { type: "STRING" }
            },
            required: ["title", "year", "trailerUrl"]
          }
        }
      }
    });

    console.log("Gemini response received:", JSON.stringify(response, null, 2));

    // Extract text output - handle different possible response structures
    const textOutput = response.candidates?.[0]?.content?.parts?.[0]?.text || 
                      response.text;

    console.log("Extracted text output:", textOutput);

    if (!textOutput) {
      console.error("No text output found in response");
      return NextResponse.json(
        { error: true, message: "Gemini returned no output" },
        { status: 500 }
      );
    }

    // Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(textOutput);
    } catch (err) {
      console.error("JSON parse error:", err);
      // Try to clean the response
      const cleanedText = textOutput.replace(/```json\n?|\n?```/g, '').trim();
      try {
        parsed = JSON.parse(cleanedText);
        console.log("Successfully parsed after cleaning");
      } catch (secondErr) {
        console.error("Failed to parse even after cleaning:", secondErr);
        return NextResponse.json(
          { 
            error: true, 
            message: "Failed to parse Gemini JSON output", 
            raw: textOutput.substring(0, 500) // First 500 chars for debugging
          },
          { status: 500 }
        );
      }
    }

    // for each results, send the movie title & year to OMDB api to validate preferences


    console.log("Successfully parsed JSON:", parsed);
    return NextResponse.json({ success: true, data: parsed });

  } catch (err: any) {
    console.error("API ERROR:", err);
    console.error("Error stack:", err.stack);
    
    return NextResponse.json(
      { 
        error: true, 
        message: err.message || "Unknown error",
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}