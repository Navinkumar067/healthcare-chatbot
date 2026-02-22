import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure you have GEMINI_API_KEY in your .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message, profile } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key is missing" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // SYSTEM PROMPT: This is the "Brain" of the chatbot
        const systemPrompt = `
      You are HealthChat AI, a professional medical assistant.
      
      PATIENT CONTEXT:
      - Name: ${profile?.full_name || 'Unknown'}
      - Age: ${profile?.age || 'Unknown'}
      - Existing Diseases: ${profile?.existing_diseases || 'None reported'}
      - Allergies: ${profile?.allergies || 'None reported'}
      - Current Medications: ${profile?.current_medicines || 'None reported'}

      INSTRUCTIONS:
      1. Always address the user politely.
      2. Use their medical history (Diseases/Allergies) to make your advice specific.
      3. If the user mentions "chest pain", "difficulty breathing", "severe bleeding", or "stroke symptoms", 
         stop immediately and tell them to call 108 or go to the nearest ER.
      4. Keep responses clear, minimalist, and helpful.
      5. MANDATORY DISCLAIMER: End every response with: "NOTE: I am an AI, not a doctor. Please consult a professional for medical decisions."
    `;

        const result = await model.generateContent([systemPrompt, message]);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("Gemini Error:", error);
        return NextResponse.json({ error: "Failed to connect to AI" }, { status: 500 });
    }
}