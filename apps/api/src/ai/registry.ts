import type { LanguageModel } from "ai"
import {
  type AiModelId,
  type AiProviderId,
  getAiModelCatalogEntry,
} from "./catalog"
import { getOpenRouterModel } from "./providers/openrouter"

export async function getAiLanguageModel(params: {
  providerId: AiProviderId
  modelId: AiModelId
}): Promise<LanguageModel> {
  const catalogEntry = getAiModelCatalogEntry(params.modelId)

  if (catalogEntry.providerId !== params.providerId) {
    throw new Error(
      `Model "${params.modelId}" is not available for provider "${params.providerId}"`,
    )
  }

  switch (params.providerId) {
    case "openrouter": {
      return getOpenRouterModel(params.modelId)
    }
  }
}
