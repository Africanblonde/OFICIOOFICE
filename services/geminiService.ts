import { GoogleGenAI, Type } from "@google/genai";
import { InventoryRecord, Requisition, Item, Location } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeSupplyChain = async (
  inventory: InventoryRecord[],
  requisitions: Requisition[],
  items: Item[],
  locations: Location[]
) => {
  const client = getClient();
  if (!client) {
    return {
      summary: "API Key ausente. Configure a chave para obter insights.",
      risks: [],
      optimizations: []
    };
  }

  // Prepare data summary for the prompt
  const dataSummary = {
    inventoryCount: inventory.length,
    pendingRequests: requisitions.filter(r => r.status === 'PENDING').length,
    lowStockItems: inventory.filter(i => i.quantity < 5).map(i => {
      const item = items.find(it => it.id === i.itemId);
      const loc = locations.find(l => l.id === i.locationId);
      return `${item?.name} at ${loc?.name} (Qty: ${i.quantity})`;
    }),
    recentRequests: requisitions.slice(0, 5).map(r => {
      const item = items.find(it => it.id === r.itemId);
      const target = locations.find(l => l.id === r.targetLocationId);
      return `${r.quantity}x ${item?.name} for ${target?.name} [${r.status}]`;
    })
  };

  const prompt = `
    Atue como um especialista em Logística e Cadeia de Suprimentos.
    Analise os seguintes dados operacionais de uma empresa florestal com hierarquia (Central -> Filial -> Campo):
    ${JSON.stringify(dataSummary, null, 2)}

    Forneça uma análise estruturada em JSON contendo:
    1. 'summary': Um resumo executivo curto (máx 200 caracteres).
    2. 'risks': Uma lista de 2-3 riscos potenciais (ex: ruptura de estoque, gargalos).
    3. 'optimizations': Uma lista de 2-3 sugestões de otimização.

    Seja direto e profissional.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizations: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Attempt parse
    try {
        const parsed = JSON.parse(text);
        // Ensure structure to prevent "undefined map" errors in UI
        return {
          summary: parsed.summary || "Análise concluída.",
          risks: Array.isArray(parsed.risks) ? parsed.risks : [],
          optimizations: Array.isArray(parsed.optimizations) ? parsed.optimizations : []
        };
    } catch (parseError) {
        console.error("JSON Parse Error. Raw text received:", text);
        return {
          summary: "Erro ao processar resposta da IA.",
          risks: ["Formato de resposta inválido"],
          optimizations: []
        };
    }

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      summary: "Erro ao analisar dados. Tente novamente mais tarde.",
      risks: ["Indisponibilidade do serviço de IA"],
      optimizations: []
    };
  }
};