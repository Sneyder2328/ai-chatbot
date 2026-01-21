import { protectedProcedure, router } from "@ai-chatbot/trpc"
import {
  AI_MODELS,
  AI_PROVIDER_IDS,
  DEFAULT_AI_MODEL_ID,
  DEFAULT_AI_PROVIDER_ID,
} from "../../ai"

export const aiRouter = router({
  catalog: protectedProcedure.query(() => {
    return {
      providers: AI_PROVIDER_IDS,
      models: AI_MODELS,
      defaults: {
        providerId: DEFAULT_AI_PROVIDER_ID,
        modelId: DEFAULT_AI_MODEL_ID,
      },
    }
  }),
})
