export const AI_PROVIDER_IDS = ["openrouter"] as const

export type AiProviderId = (typeof AI_PROVIDER_IDS)[number]

export const AI_MODELS = [
  {
    id: "z-ai/glm-4.7-flash",
    providerId: "openrouter",
    label: "GLM-4.7 Flash",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "z-ai/glm-4.7",
    providerId: "openrouter",
    label: "GLM-4.7",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "google/gemini-3-pro-preview",
    providerId: "openrouter",
    label: "Gemini 3 Pro Preview",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "google/gemini-3-flash-preview",
    providerId: "openrouter",
    label: "Gemini 3 Flash Preview",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "openai/gpt-5-mini",
    providerId: "openrouter",
    label: "GPT-5 Mini",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "openai/gpt-5.2",
    providerId: "openrouter",
    label: "GPT-5.2",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "deepseek/deepseek-v3.2",
    providerId: "openrouter",
    label: "DeepSeek V3.2",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "moonshotai/kimi-k2-thinking",
    providerId: "openrouter",
    label: "Kimi K2 Thinking",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "x-ai/grok-code-fast-1",
    providerId: "openrouter",
    label: "Grok Code Fast 1",
    supportsVision: true,
    supportsImageGen: false,
  },
] as const

export type AiModelId = (typeof AI_MODELS)[number]["id"]

export type AiModelCatalogEntry = (typeof AI_MODELS)[number]

export const DEFAULT_AI_PROVIDER_ID: AiProviderId = "openrouter"
export const DEFAULT_AI_MODEL_ID: AiModelId = "openai/gpt-5-mini"

export function isAiProviderId(value: string): value is AiProviderId {
  return (AI_PROVIDER_IDS as readonly string[]).includes(value)
}

export function isAiModelId(value: string): value is AiModelId {
  return AI_MODELS.some((m) => m.id === value)
}

export function getAiModelCatalogEntry(
  modelId: AiModelId,
): AiModelCatalogEntry {
  const entry = AI_MODELS.find((m) => m.id === modelId)
  if (!entry) {
    // Should be impossible due to AiModelId type, but keeps runtime safe.
    throw new Error(`Unknown AI model id: ${modelId}`)
  }

  return entry
}

export function listAiModelsForProvider(providerId: AiProviderId) {
  return AI_MODELS.filter((m) => m.providerId === providerId)
}
