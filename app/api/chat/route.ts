import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { message, imageUrl, history, profile } = await req.json();

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "GROQ_API_KEY is missing from .env.local file." },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        let recordsText = "No external medical files uploaded.";
        if (profile?.file_urls && Array.isArray(profile.file_urls) && profile.file_urls.length > 0) {
            const files = profile.file_urls.map((f: string) => {
                try { return JSON.parse(f).name; } catch { return "Unnamed Document"; }
            }).join(", ");
            recordsText = `Uploaded Medical Reports: ${files}`;
        }

        const systemPrompt = `
          You are HealthChat AI, a professional medical assistant.
          
          PATIENT CONTEXT:
          - Name: ${profile?.full_name || 'Unknown'}
          - Age: ${profile?.age || 'Unknown'}
          - Gender: ${profile?.gender || 'Unknown'}
          - Existing Diseases: ${profile?.existing_diseases || 'None reported'}
          - Allergies: ${profile?.allergies || 'None reported'}
          - Current Medications: ${profile?.current_medicines || 'None reported'}
          - ${recordsText}

          INSTRUCTIONS:
          1. If the user uploads an image, describe what you see visually, but gently remind them a physical exam is best for a real diagnosis.
          2. Analyze their diseases and allergies deeply before advising.
          3. If user mentions "chest pain", "difficulty breathing", "severe bleeding", or "stroke", tell them to call 108 immediately.
          4. TONE: Be warm, conversational, and direct. Do NOT use repetitive robotic phrases like "I recommend consulting a doctor for proper evaluation" in every single message. Instead, seamlessly weave in casual reminders that you are an AI assistant when appropriate, but focus primarily on answering their question.
        `;

        // Format history for Groq Vision Model
        const formattedHistory = (history || []).map((msg: any) => {
            if (msg.imageUrl) {
                return {
                    role: msg.role === 'bot' ? 'assistant' : 'user',
                    content: [
                        { type: "text", text: msg.content || "Here is an image." },
                        { type: "image_url", image_url: { url: msg.imageUrl } }
                    ]
                };
            }
            return {
                role: msg.role === 'bot' ? 'assistant' : 'user',
                content: msg.content
            };
        });

        // Add the current message
        let currentMessageContent: any = message;
        if (imageUrl) {
            currentMessageContent = [
                { type: "text", text: message || "Please analyze this image." },
                { type: "image_url", image_url: { url: imageUrl } }
            ];
        }

        // Call the new active Llama 4 Vision Model
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...formattedHistory,
                { role: "user", content: currentMessageContent }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.5,
        });

        const text = chatCompletion.choices[0]?.message?.content || "I couldn't generate a response.";

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("API Error Details:", error);
        return NextResponse.json(
            { error: error.message || "Failed to connect to the AI model." },
            { status: 500 }
        );
    }
}