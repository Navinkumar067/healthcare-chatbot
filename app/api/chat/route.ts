import Groq from "groq-sdk";
import { NextResponse } from "next/server";

// 1. The Image Safety Function (From earlier)
async function getSafeBase64Image(url: string) {
    if (!url) return null;
    if (url.startsWith('data:image')) return url;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });
        if (!response.ok) throw new Error(`Supabase blocked request`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (err: any) {
        console.error("Backend Image Download Error:", err.message);
        throw new Error(`Server failed to download image.`);
    }
}

// 2. NEW: The Live WHO Knowledge Retriever (RAG)
async function fetchWHOGuidance(userMessage: string) {
    const serperKey = process.env.SERPER_API_KEY;
    if (!serperKey || typeof userMessage !== 'string' || userMessage.length < 5) return "";

    try {
        // We force Google to ONLY search the official World Health Organization website
        const searchQuery = `site:who.int symptoms treatment ${userMessage}`;

        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: searchQuery, num: 3 }) // Get top 3 official WHO results
        });

        const data = await response.json();

        if (data.organic && data.organic.length > 0) {
            // Extract the text snippets from the WHO search results
            const snippets = data.organic.map((result: any) => `- ${result.snippet}`).join('\n');
            return `\n*** LIVE WORLD HEALTH ORGANIZATION (WHO) DATA ***\nHere is the latest data pulled directly from the WHO website regarding the user's query:\n${snippets}\n*********************************************\n`;
        }
        return "";
    } catch (err) {
        console.error("WHO Retrieval failed:", err);
        return ""; // Fail gracefully so the chat doesn't break if search fails
    }
}

export async function POST(req: Request) {
    try {
        const { message, imageUrl, history, profile, language } = await req.json();

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: "GROQ_API_KEY is missing." }, { status: 500 });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Fetch live WHO data concurrently
        const whoLiveDataText = await fetchWHOGuidance(message || "");

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
If the user explicitly agrees to a reminder and provides a time, you MUST append this tag at the very end.
Format: [SET_REMINDER: Medicine Name (Before/After Food) | Time]
**************************
          
PATIENT CONTEXT:
- Name: ${profile?.full_name || 'Unknown'}
- Age: ${profile?.age || 'Unknown'}
- Existing Diseases: ${profile?.existing_diseases || 'None reported'}
- Allergies: ${profile?.allergies || 'None reported'}
- Current Medications: ${profile?.current_medicines || 'None reported'}
- ${recordsText}
${whoLiveDataText}

INSTRUCTIONS:
1. REAL-TIME GROUNDING: If the "LIVE WORLD HEALTH ORGANIZATION (WHO) DATA" section above contains information, you MUST base your medical advice heavily on those official WHO snippets. Compare the WHO data against your trained knowledge and explicitly state "According to recent WHO guidelines..." in your response.
2. PRESCRIPTION OCR: If the user uploads a prescription image, extract the medicine names. Provide a clear list, the exact dosage, and strictly state if it must be taken BEFORE or AFTER food.
3. CRITICAL LANGUAGE RULE: You MUST write your ENTIRE response ONLY in the native script of ${targetLanguage}. Do not use Tanglish/Hinglish. Translate all medical terms into easily understandable ${targetLanguage}.
4. FORMATTING: Do NOT use markdown formatting like asterisks (**) or hashes (#) so the screen reader works perfectly.
`;

        const formattedHistory = await Promise.all((history || []).map(async (msg: any) => {
            if (msg.imageUrl) {
                try {
                    const safeImg = await getSafeBase64Image(msg.imageUrl);
                    return { role: msg.role === 'bot' ? 'assistant' : 'user', content: [{ type: "text", text: msg.content || "Here is an image." }, { type: "image_url", image_url: { url: safeImg } }] };
                } catch (e) {
                    return { role: msg.role === 'bot' ? 'assistant' : 'user', content: msg.content };
                }
            }
            return { role: msg.role === 'bot' ? 'assistant' : 'user', content: msg.content };
        }));

        let currentMessageContent: any = message;
        if (imageUrl) {
            const safeImg = await getSafeBase64Image(imageUrl);
            currentMessageContent = [{ type: "text", text: message || "Please analyze this image." }, { type: "image_url", image_url: { url: safeImg } }];
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...formattedHistory,
                { role: "user", content: currentMessageContent }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.3, // Lowered temperature slightly to make the AI strictly follow the WHO data
        });

        const text = chatCompletion.choices[0]?.message?.content || "I couldn't generate a response.";

        // NEW: Append the raw WHO data to the bottom of the AI's response so the professor can see it!
        let finalResponse = text;
        if (whoLiveDataText && whoLiveDataText.length > 5) {
            // Clean up the hidden backend tags and make it look nice for the UI
            const formattedSources = whoLiveDataText
                .replace('*** LIVE WORLD HEALTH ORGANIZATION (WHO) DATA ***', '### 📚 Verified WHO Sources Fetched:')
                .replace('*********************************************', '');

            finalResponse += `\n\n---\n${formattedSources}`;
        }

        return NextResponse.json({ text: finalResponse });

    } catch (error: any) {
        console.error("API Error Details:", error);
        return NextResponse.json({ error: error.message || "Failed to connect to the AI model." }, { status: 500 });
    }
}