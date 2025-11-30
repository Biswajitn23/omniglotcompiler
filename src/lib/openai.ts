const OPENAI_API_URL = "https://api.perplexity.ai/chat/completions";
const DEFAULT_MODEL = import.meta.env.VITE_OPENAI_MODEL || "sonar";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface OpenAIOptions {
  temperature?: number;
  model?: string;
}

const normalizeContent = (content: unknown) => {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part) return "";
        if (typeof part === "string") return part;
        if (typeof part === "object" && "text" in part) {
          return (part as { text?: string }).text || "";
        }
        return "";
      })
      .join("")
      .trim();
  }

  return content ? String(content).trim() : "";
};

export const callOpenAI = async (
  messages: ChatMessage[],
  options: OpenAIOptions = {},
) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === "your-openai-api-key-here") {
    throw new Error("Perplexity API key not configured");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      temperature: options.temperature ?? 0.4,
      messages,
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorBody = await response.json();
      errorDetail = errorBody?.error?.message || errorDetail;
      
      // Handle specific error cases
      if (response.status === 429) {
        if (errorDetail.includes("quota")) {
          throw new Error("Perplexity API quota exceeded. Please check your usage at https://www.perplexity.ai/settings/api");
        }
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      
      if (response.status === 401) {
        throw new Error("Invalid Perplexity API key. Please check your VITE_OPENAI_API_KEY in .env file.");
      }
      
    } catch (parseError: any) {
      // If it's already our custom error, re-throw it
      if (parseError.message?.includes("quota") || parseError.message?.includes("Rate limit") || parseError.message?.includes("Invalid")) {
        throw parseError;
      }
      // ignore JSON parse errors otherwise
    }
    throw new Error(`Perplexity API request failed: ${errorDetail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const normalized = normalizeContent(content);

  if (!normalized) {
    throw new Error("Perplexity API returned an empty response");
  }

  return normalized;
};

