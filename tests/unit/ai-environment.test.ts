import { describe, expect, it } from "vitest";
import { getOpenAIConfiguration } from "@/lib/ai/environment";

describe("OpenAI environment validation", () => {
  it("accepts server-only API key and configurable model values", () => {
    expect(
      getOpenAIConfiguration({
        OPENAI_API_KEY: "test-key-that-is-long-enough",
        OPENAI_MODEL: "gpt-5.6-luna",
      }),
    ).toEqual({
      configured: true,
      apiKey: "test-key-that-is-long-enough",
      model: "gpt-5.6-luna",
    });
  });

  it("fails safely when the API key is missing", () => {
    expect(
      getOpenAIConfiguration({
        OPENAI_MODEL: "gpt-5.6-luna",
      }),
    ).toEqual({
      configured: false,
      reason: "Kenzie AI has not been configured for this environment.",
    });
  });

  it("does not accept a public browser variable in place of the key", () => {
    expect(
      getOpenAIConfiguration({
        NEXT_PUBLIC_OPENAI_API_KEY: "test-key-that-is-long-enough",
        OPENAI_MODEL: "gpt-5.6-luna",
      }),
    ).toEqual({
      configured: false,
      reason: "Kenzie AI has not been configured for this environment.",
    });
  });
});
