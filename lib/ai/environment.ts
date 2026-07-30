import { z } from "zod";

const openAIEnvironmentSchema = z.object({
  OPENAI_API_KEY: z.string().trim().min(20),
  OPENAI_MODEL: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9._:-]+$/),
});

export type OpenAIConfiguration =
  | {
      configured: true;
      apiKey: string;
      model: string;
    }
  | {
      configured: false;
      reason: string;
    };

export function getOpenAIConfiguration(
  source: Record<string, string | undefined> = process.env,
): OpenAIConfiguration {
  const result = openAIEnvironmentSchema.safeParse(source);
  if (!result.success) {
    return {
      configured: false,
      reason: "Kenzie AI has not been configured for this environment.",
    };
  }

  return {
    configured: true,
    apiKey: result.data.OPENAI_API_KEY,
    model: result.data.OPENAI_MODEL,
  };
}
