import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AiPrediction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialPrediction = async (
  transactions: Transaction[],
  currentMonth: string
): Promise<AiPrediction> => {
  try {
    const recentTransactions = transactions.slice(-50); // Analyze last 50 transactions to keep context manageable but relevant
    
    // Prepare data for the model
    const dataSummary = JSON.stringify(recentTransactions.map(t => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      category: t.category
    })));

    const prompt = `Analyzuj tieto finančné transakcie domácnosti a predikuj výdavky na nasledujúci mesiac. Dátum je ${currentMonth}.
    Data: ${dataSummary}
    
    Vráť odpoveď v JSON formáte podľa schémy.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedTotal: { type: Type.NUMBER, description: "Odhadovaná suma výdavkov na ďalší mesiac." },
            reasoning: { type: Type.STRING, description: "Krátke vysvetlenie predikcie v slovenčine." },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 praktické tipy na šetrenie v slovenčine na základe kategórií."
            }
          },
          required: ["predictedTotal", "reasoning", "tips"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AiPrediction;
    }
    
    throw new Error("No data returned");

  } catch (error) {
    console.error("Gemini AI Prediction Error:", error);
    return {
      predictedTotal: 0,
      reasoning: "Nepodarilo sa vygenerovať predikciu. Skúste to prosím neskôr.",
      tips: ["Skontrolujte svoje pripojenie."]
    };
  }
};
