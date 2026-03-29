import Groq from "groq-sdk";
import { NextResponse } from "next/server";

// Helper function: Strictly convert image URL to Base64 to bypass Cloudflare/Bot blocks
async function getSafeBase64Image(url: string) {
    if (!url) return null;
    if (url.startsWith('data:image')) return url; // Already base64

    try {
        const response = await fetch(url, {
            // ESSENTIAL: Disguise the server request as a Chrome browser so Supabase doesn't block it
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase Server blocked the request with status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';

        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (err: any) {
        console.error("Backend Image Download Error:", err.message);
        throw new Error(`Server failed to download image. Reason: ${err.message}`);
    }
}

export async function POST(req: Request) {
    try {
        const { message, imageUrl, history, profile, language } = await req.json();

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: "GROQ_API_KEY is missing from .env.local file." }, { status: 500 });
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
            'en-IN': 'English', 'hi-IN': 'Hindi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu',
            'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi', 'bn-IN': 'Bengali',
            'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi', 'or-IN': 'Odia', 'ur-IN': 'Urdu'
        };
        const targetLanguage = languageMap[language] || 'English';

        const systemPrompt = `
You are HealthChat AI, a highly professional medical assistant.

*** EMERGENCY PROTOCOL ***
If the user mentions ANY life-threatening symptoms, YOU MUST PREPEND YOUR RESPONSE WITH THIS EXACT ENGLISH TAG: [EMERGENCY]
**************************

*** REMINDER PROTOCOL ***
If the user explicitly agrees and provides a time (e.g., "Yes, at 9 AM"), you MUST append this exact English tag at the very end of your response:
[SET_REMINDER: Medicine Name | Time]
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
4. CRITICAL LANGUAGE RULE: You MUST write your ENTIRE response ONLY in the native script of ${targetLanguage}. Do not use English alphabets for ${targetLanguage} words (e.g., no Tanglish/Hinglish). Translate all medical terms into easily understandable ${targetLanguage}.
5. FORMATTING: Do NOT use markdown formatting like asterisks (**), hashes (#), or underscores in your response, as this text will be read aloud by a screen reader. Keep the text clean and natural.
`;

        // Safely map history and convert any past images to base64
        const formattedHistory = await Promise.all((history || []).map(async (msg: any) => {
            if (msg.imageUrl) {
                try {
                    const safeImg = await getSafeBase64Image(msg.imageUrl);
                    return {
                        role: msg.role === 'bot' ? 'assistant' : 'user',
                        content: [
                            { type: "text", text: msg.content || "Here is an image." },
                            { type: "image_url", image_url: { url: safeImg } }
                        ]
                    };
                } catch (e) {
                    // If an old image fails to load, degrade gracefully to text so we don't break the whole chat
                    return { role: msg.role === 'bot' ? 'assistant' : 'user', content: msg.content };
                }
            }
            return {
                role: msg.role === 'bot' ? 'assistant' : 'user',
                content: msg.content
            };
        }));

        let currentMessageContent: any = message;

        // Convert the NEWLY uploaded image to base64. 
        // If this fails, it will safely throw an error to your frontend instead of crashing Groq.
        if (imageUrl) {
            const safeImg = await getSafeBase64Image(imageUrl);
            currentMessageContent = [
                { type: "text", text: message || "Please analyze this image." },
                { type: "image_url", image_url: { url: safeImg } }
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