export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("TEST API Route called");
  
  return NextResponse.json({ 
    success: true, 
    message: "Test route working",
    timestamp: new Date().toISOString()
  });
}