export const AI_PROVIDER_IDS = ["openrouter"] as const

export type AiProviderId = (typeof AI_PROVIDER_IDS)[number]

export const AI_MODELS = [
  {
    id: "openai/gpt-4o-mini",
    providerId: "openrouter",
    label: "GPT-4o mini",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    providerId: "openrouter",
    label: "Claude 3.5 Sonnet",
    supportsVision: true,
    supportsImageGen: false,
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    providerId: "openrouter",
    label: "Llama 3.1 70B Instruct",
    supportsVision: false,
    supportsImageGen: false,
  },
] as const

export type AiModelId = (typeof AI_MODELS)[number]["id"]

export type AiModelCatalogEntry = (typeof AI_MODELS)[number]

export const DEFAULT_AI_PROVIDER_ID: AiProviderId = "openrouter"
export const DEFAULT_AI_MODEL_ID: AiModelId = "openai/gpt-4o-mini"

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
