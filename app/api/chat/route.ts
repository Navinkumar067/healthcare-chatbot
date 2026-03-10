import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { message, imageUrl, history, profile, language } = await req.json();

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

        const languageMap: Record<string, string> = {
            'en-IN': 'English',
            'hi-IN': 'Hindi',
            'ta-IN': 'Tamil',
            'te-IN': 'Telugu',
            'kn-IN': 'Kannada',
            'ml-IN': 'Malayalam',
            'mr-IN': 'Marathi',
            'bn-IN': 'Bengali',
            'gu-IN': 'Gujarati',
            'pa-IN': 'Punjabi',
            'or-IN': 'Odia',
            'ur-IN': 'Urdu'
        };
        const targetLanguage = languageMap[language] || 'English';

        // UPDATED SYSTEM PROMPT: Added REMINDER PROTOCOL
        const systemPrompt = `
You are HealthChat AI, a highly professional medical assistant.

*** EMERGENCY PROTOCOL ***
If the user mentions ANY life-threatening symptoms (e.g., severe chest pain, difficulty breathing, severe bleeding, stroke symptoms), YOU MUST PREPEND YOUR RESPONSE WITH THIS EXACT ENGLISH TAG: [EMERGENCY]
**************************

*** REMINDER PROTOCOL ***
If you explain a medication dosage or the user asks to be reminded to take a medicine, you MUST ask them: "Would you like me to set a daily reminder for this medicine? If so, what time?"
If the user explicitly agrees and provides a time (e.g., "Yes, at 9 AM" or "Remind me for Paracetamol at 8 PM"), you MUST append this exact English tag at the very end of your response:
[SET_REMINDER: Medicine Name | Time]
Example: [SET_REMINDER: Paracetamol | 08:00 PM]
Do not translate this tag. Keep it in English.
**************************
          
PATIENT CONTEXT:
- Name: ${profile?.full_name || 'Unknown'}
- Age: ${profile?.age || 'Unknown'}
- Gender: ${profile?.gender || 'Unknown'}
- Existing Diseases: ${profile?.existing_diseases || 'None reported'}
- Allergies: ${profile?.allergies || 'None reported'}
- Current Medications: ${profile?.current_medicines || 'None reported'}
- ${recordsText}

INSTRUCTIONS:
1. PRESCRIPTION OCR: If the user uploads a prescription image, extract the handwritten medicine names. Provide a clear list of the medicines and explain the exact dosage. ALWAYS end by asking if they want a reminder set.
2. Analyze their diseases and allergies deeply before advising.
3. TONE: Be warm, conversational, and direct. Do NOT use repetitive robotic phrases.
4. CRITICAL LANGUAGE RULE: You MUST generate your entire response ONLY in ${targetLanguage}. However, keep the [EMERGENCY] and [SET_REMINDER] tags entirely in English.
`;

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

        let currentMessageContent: any = message;
        if (imageUrl) {
            currentMessageContent = [
                { type: "text", text: message || "Please analyze this image." },
                { type: "image_url", image_url: { url: imageUrl } }
            ];
        }

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