const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * VoiceAIService - Handles intent parsing for voice commands.
 * Supports Hinglish (Hindi + English) mixed inputs.
 */
class VoiceAIService {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.actionIntents = [
            "SHOW_EXPENSES", "CHECK_BALANCE", "SHOW_ALERTS", 
            "EMERGENCY", "SHOW_BUDGET", "UNKNOWN"
        ];
    }

    async parseCommand(text) {
        if (!text) return { action: "UNKNOWN" };

        const prompt = `
            You are a Financial AI assistant. Convert the user's spoken voice command into a structured JSON object.
            The user might speak in English, Hindi, or Hinglish (mixed).
            
            Actions:
            - SHOW_EXPENSES: User wants to see spending (e.g., "Mera kharcha dikhao", "How much did I spend?")
            - CHECK_BALANCE: User wants to know current balance (e.g., "Balance kitna hai", "Show my balance")
            - SHOW_ALERTS: User wants to see fraud or suspicious alerts (e.g., "Koi fraud hai kya?", "Show alerts")
            - EMERGENCY: User is in danger or needs help (e.g., "Help me", "Emergency", "SOS", "Bachao")
            - SHOW_BUDGET: User wants to see limit or budget (e.g., "Limit kitni bachi hai?", "Show my budget")
            
            Return ONLY a JSON object in this format:
            {
                "action": "ACTION_NAME",
                "amount": number or null,
                "category": string or null,
                "confidence": number (0-1)
            }
            
            User Input: "${text}"
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const output = response.text().trim();
            
            // Extract JSON from potential markdown wrapping
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { action: "UNKNOWN" };
        } catch (error) {
            console.error("[VoiceAI] Parsing Error:", error);
            // Fallback for emergency keywords even if AI fails
            if (this.isEmergencyFallback(text)) {
                return { action: "EMERGENCY", confidence: 1 };
            }
            return { action: "UNKNOWN" };
        }
    }

    isEmergencyFallback(text) {
        const keywords = ['help', 'emergency', 'sos', 'bachao', 'danger', 'khatra', 'police'];
        const lowText = text.toLowerCase();
        return keywords.some(k => lowText.includes(k));
    }
}

module.exports = new VoiceAIService();
