import { describe, expect, it, vi } from "vitest";
import {
  KENZIE_CONNECTION_TEST_PROMPT,
  testKenzieOpenAIConnection,
} from "@/lib/ai/openai";

const environment = {
  OPENAI_API_KEY: "test-key-that-is-long-enough",
  OPENAI_MODEL: "gpt-5.6-luna",
};

describe("Kenzie OpenAI service", () => {
  it("sends only the harmless connection prompt with safe request limits", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: "Kenzie connection successful.",
      _request_id: "request-test",
    });

    const result = await testKenzieOpenAIConnection(environment, () => ({
      responses: { create },
    }));

    expect(result).toEqual({
      ok: true,
      message: "Kenzie connection successful.",
      model: "gpt-5.6-luna",
    });
    expect(create).toHaveBeenCalledWith({
      model: "gpt-5.6-luna",
      input: KENZIE_CONNECTION_TEST_PROMPT,
      store: false,
      max_output_tokens: 32,
      reasoning: { effort: "none" },
      text: { verbosity: "low" },
    });
  });

  it("rejects an unexpected response", async () => {
    const result = await testKenzieOpenAIConnection(environment, () => ({
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: "Something different",
        }),
      },
    }));

    expect(result).toEqual({
      ok: false,
      code: "unexpected-response",
      message:
        "Kenzie reached the AI service, but the test response was not recognized.",
    });
  });

  it("returns a sanitized provider error without exposing the key", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await testKenzieOpenAIConnection(environment, () => ({
      responses: {
        create: vi.fn().mockRejectedValue(new Error("provider unavailable")),
      },
    }));

    expect(result).toEqual({
      ok: false,
      code: "provider",
      message:
        "Kenzie could not reach the AI service. Check the server configuration and try again.",
    });
    expect(JSON.stringify(result)).not.toContain(environment.OPENAI_API_KEY);
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      environment.OPENAI_API_KEY,
    );
    log.mockRestore();
  });

  it("fails safely before creating a client when configuration is missing", async () => {
    const factory = vi.fn();
    const result = await testKenzieOpenAIConnection(
      { OPENAI_MODEL: "gpt-5.6-luna" },
      factory,
    );

    expect(factory).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: "configuration",
      message: "Kenzie AI has not been configured for this environment.",
    });
  });
});
