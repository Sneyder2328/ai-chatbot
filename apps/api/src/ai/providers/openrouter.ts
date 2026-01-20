import type { LanguageModel } from "ai"
import { env } from "../../env"
import type { AiModelId } from "../catalog"

type OpenRouterProvider = (modelId: string) => LanguageModel

let openRouterProviderPromise: Promise<OpenRouterProvider> | null = null

function buildOpenRouterHeaders(): Record<string, string> | undefined {
  const headers: Record<string, string> = {}

  if (env.openrouterAppUrl) {
    headers["HTTP-Referer"] = env.openrouterAppUrl
  }

  if (env.openrouterAppName) {
    headers["X-Title"] = env.openrouterAppName
  }

  return Object.keys(headers).length > 0 ? headers : undefined
}

async function getOpenRouterProvider(): Promise<OpenRouterProvider> {
  if (!openRouterProviderPromise) {
    openRouterProviderPromise = (async () => {
      const { createOpenAI } = await import("@ai-sdk/openai")

      const openai = createOpenAI({
        apiKey: env.openrouterApiKey,
        baseURL: env.openrouterBaseUrl,
        headers: buildOpenRouterHeaders(),
      })

      return (modelId: string) => openai(modelId)
    })()
  }

  return openRouterProviderPromise
}

export async function getOpenRouterModel(
  modelId: AiModelId,
): Promise<LanguageModel> {
  const provider = await getOpenRouterProvider()
  return provider(modelId)
}
