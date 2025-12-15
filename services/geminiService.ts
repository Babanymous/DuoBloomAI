import { GoogleGenAI, Chat } from "@google/genai";

let chatSession: Chat | null = null;

export const initializeOctoChat = (userName: string) => {
    // Check if key is missing or is still the default placeholder
    if (!process.env.API_KEY || process.env.API_KEY.includes('YOUR_GEMINI_API_KEY')) {
        console.error("Gemini API Key is invalid or missing!");
        return null;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-2.5-flash for speed and efficiency in chat
    chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `Du bist Octo, ein freundlicher Oktopus im Spiel DuoBloom.
            Der Spieler heißt ${userName}.
            Antworte immer kurz (maximal 2-3 Sätze), lustig und benutze viele Emojis (🐙, 🌱, 🌸).
            Du hilfst beim Gärtnern und motivierst den Spieler.
            Sprich Deutsch.`,
        }
    });
    return chatSession;
};

export const sendMessageToOcto = async (message: string): Promise<string> => {
    if (!chatSession) {
        return "Octo schläft... (API Key prüfen! Ist er in der .env Datei gesetzt?) 🐙";
    }

    try {
        const response = await chatSession.sendMessage({ message });
        return response.text || "Blub? (Ich habe keine Antwort)";
    } catch (error) {
        console.error("Octo Error:", error);
        return "Blub blub... mein Gehirn hat einen Knoten. (API Fehler) 🐙";
    }
};