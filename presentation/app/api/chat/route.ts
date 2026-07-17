import { openai, type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";
import {
  dashboardAssistantInstructions,
  sanitizeChatQuestion,
} from "@/lib/dashboard-assistant";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "The dashboard assistant is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const question = sanitizeChatQuestion(
    body && typeof body === "object" && "messages" in body
      ? (body as { messages: unknown }).messages
      : null,
  );

  if (!question) {
    return Response.json({ error: "Invalid chat messages." }, { status: 400 });
  }

  const result = streamText({
    model: openai.responses(process.env.OPENAI_MODEL ?? "gpt-5-mini"),
    system: dashboardAssistantInstructions,
    messages: await convertToModelMessages([question]),
    maxOutputTokens: 8192,
    providerOptions: {
      openai: {
        store: false,
        reasoningEffort: "low",
        textVerbosity: "medium",
      } satisfies OpenAILanguageModelResponsesOptions,
    },
  });

  return result.toUIMessageStreamResponse();
}
