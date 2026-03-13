import { DEFAULT_FALLBACK_MODELS, DEFAULT_PRIMARY_MODEL, GROQ_MODELS } from "@/lib/aiModels";

interface CopilotContext {
  userId: string;
  prompt: string;
  currentBookTitle?: string;
  preferredGenres?: string[];
  allowSpoilers?: boolean;
  model?: string;
  fallbackModels?: string[];
}

interface CachedCopilotResponse {
  value: string;
  createdAt: number;
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const DAILY_LIMIT = 12;

const normalizeEnvValue = (value?: string) => {
  if (!value) return "";
  return value.replace(/^['"]|['"]$/g, "").trim();
};

const resolveGroqApiKey = () => normalizeEnvValue(import.meta.env.VITE_GROQ_API_KEY);

const toBase64Utf8 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const uniqueModels = (models: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const model of models) {
    const normalized = model.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};

const getCacheKey = (userId: string, prompt: string, currentBookTitle?: string, model?: string) =>
  `rq:copilot:cache:${userId}:${toBase64Utf8(
    JSON.stringify({
      prompt: prompt.slice(0, 500),
      currentBookTitle: currentBookTitle ?? "",
      model: model ?? "",
    }),
  )}`;

const getDailyUsageKey = (userId: string) => {
  const day = new Date().toISOString().slice(0, 10);
  return `rq:copilot:usage:${userId}:${day}`;
};

const readCache = (key: string): CachedCopilotResponse | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCopilotResponse;
    if (!parsed?.createdAt || !parsed?.value) return null;
    if (Date.now() - parsed.createdAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedCopilotResponse = {
      value,
      createdAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // best effort
  }
};

const getUsage = (userId: string) => {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(getDailyUsageKey(userId));
    if (!raw) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};

const incUsage = (userId: string) => {
  if (typeof window === "undefined") return;
  try {
    const next = getUsage(userId) + 1;
    localStorage.setItem(getDailyUsageKey(userId), String(next));
  } catch {
    // best effort
  }
};

const buildSystemPrompt = (genres: string[], allowSpoilers: boolean) =>
  [
    "Voce e um copiloto de leitura objetivo e inspirador.",
    allowSpoilers
      ? "Responda em portugues do Brasil com clareza. Spoilers sao permitidos quando necessarios."
      : "Responda em portugues do Brasil com clareza, sem spoilers.",
    "Priorize acoes pequenas e praticas para manter consistencia.",
    "Se nao houver contexto suficiente, peca 1 pergunta de clarificacao curta.",
    genres.length ? `Generos preferidos do usuario: ${genres.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

const shouldFallbackForStatus = (status: number) => {
  if ([408, 409, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  // Some providers return 400/404 for unavailable model aliases.
  if (status === 400 || status === 404) return true;
  return false;
};

const isModelAvailabilityError = (text: string) => {
  const lower = text.toLowerCase();
  return (
    lower.includes("model") &&
    (lower.includes("not found") ||
      lower.includes("unsupported") ||
      lower.includes("unavailable") ||
      lower.includes("does not exist") ||
      lower.includes("invalid"))
  );
};

export const generateReadingCopilotReply = async ({
  userId,
  prompt,
  currentBookTitle,
  preferredGenres = [],
  allowSpoilers = false,
  model,
  fallbackModels = [],
}: CopilotContext): Promise<string> => {
  const trimmedPrompt = prompt.trim().slice(0, 1000);
  if (trimmedPrompt.length < 2) throw new Error("Escreva uma pergunta mais completa.");

  const requestedModel = model?.trim() || import.meta.env.VITE_GROQ_MODEL || DEFAULT_PRIMARY_MODEL;

  const cacheKey = getCacheKey(userId, trimmedPrompt, currentBookTitle, requestedModel);
  const cached = readCache(cacheKey);
  if (cached) return cached.value;

  if (getUsage(userId) >= DAILY_LIMIT) {
    throw new Error("Limite diario do copiloto atingido. Tente novamente amanha.");
  }

  const apiKey = resolveGroqApiKey();
  if (!apiKey) {
    throw new Error(
      "Configure VITE_GROQ_API_KEY no .env.local e reinicie o servidor de desenvolvimento.",
    );
  }

  const candidates = uniqueModels([
    requestedModel,
    ...fallbackModels,
    ...DEFAULT_FALLBACK_MODELS,
    ...GROQ_MODELS,
  ]);

  const failed: Array<{ model: string; status: number; detail: string }> = [];

  for (const candidateModel of candidates) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: candidateModel,
        temperature: 0.5,
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(preferredGenres, allowSpoilers),
          },
          {
            role: "user",
            content: [
              currentBookTitle ? `Livro atual: ${currentBookTitle}` : "",
              `Pergunta: ${trimmedPrompt}`,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      }),
    });

    if (response.ok) {
      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const answer = json.choices?.[0]?.message?.content?.trim();
      if (!answer) {
        failed.push({ model: candidateModel, status: 200, detail: "empty_answer" });
        continue;
      }

      incUsage(userId);
      writeCache(cacheKey, answer);
      return answer;
    }

    const errorBody = await response.text();

    if (response.status === 401 || response.status === 403) {
      throw new Error("API key da Groq invalida ou sem permissao para o modelo configurado.");
    }

    failed.push({
      model: candidateModel,
      status: response.status,
      detail: errorBody.slice(0, 180),
    });

    const canRetryAnotherModel =
      shouldFallbackForStatus(response.status) || isModelAvailabilityError(errorBody);

    if (!canRetryAnotherModel) {
      throw new Error("Nao foi possivel obter resposta da IA no momento.");
    }
  }

  const tried = failed
    .map((item) => `${item.model} (${item.status})`)
    .slice(0, 6)
    .join(", ");
  throw new Error(
    `Nao foi possivel responder com os modelos disponiveis no momento. Tentativas: ${tried}`,
  );
};
