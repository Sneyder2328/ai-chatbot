import type { TrpcContext } from "@ai-chatbot/trpc";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "db";
import { auth } from "../auth/auth";

export async function createContext({
  req,
}: CreateExpressContextOptions): Promise<TrpcContext> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return {
    db: prisma,
    user: session?.user ? { id: session.user.id } : null,
  };
}
