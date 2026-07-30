import OpenAI from "openai";
import {
  getOpenAIConfiguration,
  type OpenAIConfiguration,
} from "@/lib/ai/environment";

export const KENZIE_CONNECTION_TEST_PROMPT =
  "Reply with exactly: Kenzie connection successful.";
export const KENZIE_CONNECTION_TEST_RESPONSE =
  "Kenzie connection successful.";

type ConnectionResponse = {
  output_text: string;
  _request_id?: string | null;
};

type ConnectionClient = {
  responses: {
    create: (request: {
      model: string;
      input: string;
      store: false;
      max_output_tokens: number;
      reasoning: { effort: "none" };
      text: { verbosity: "low" };
    }) => Promise<ConnectionResponse>;
  };
};

type ClientFactory = (
  configuration: Extract<OpenAIConfiguration, { configured: true }>,
) => ConnectionClient;

export type KenzieConnectionResult =
  | {
      ok: true;
      message: typeof KENZIE_CONNECTION_TEST_RESPONSE;
      model: string;
    }
  | {
      ok: false;
      code: "configuration" | "provider" | "unexpected-response";
      message: string;
    };

function createClient(
  configuration: Extract<OpenAIConfiguration, { configured: true }>,
): ConnectionClient {
  return new OpenAI({
    apiKey: configuration.apiKey,
    timeout: 10_000,
    maxRetries: 0,
    logLevel: "error",
  });
}

function safeErrorDetails(error: unknown) {
  if (error instanceof OpenAI.APIError) {
    return {
      name: error.name,
      status: error.status,
      requestId: error.requestID,
    };
  }
  if (error instanceof Error) {
    return { name: error.name };
  }
  return { name: "UnknownError" };
}

export async function testKenzieOpenAIConnection(
  source: Record<string, string | undefined> = process.env,
  clientFactory: ClientFactory = createClient,
): Promise<KenzieConnectionResult> {
  const configuration = getOpenAIConfiguration(source);
  if (!configuration.configured) {
    return {
      ok: false,
      code: "configuration",
      message: configuration.reason,
    };
  }

  try {
    const response = await clientFactory(configuration).responses.create({
      model: configuration.model,
      input: KENZIE_CONNECTION_TEST_PROMPT,
      store: false,
      max_output_tokens: 32,
      reasoning: { effort: "none" },
      text: { verbosity: "low" },
    });
    const output = response.output_text.trim();
    if (output !== KENZIE_CONNECTION_TEST_RESPONSE) {
      return {
        ok: false,
        code: "unexpected-response",
        message:
          "Kenzie reached the AI service, but the test response was not recognized.",
      };
    }

    return {
      ok: true,
      message: KENZIE_CONNECTION_TEST_RESPONSE,
      model: configuration.model,
    };
  } catch (error) {
    console.error(
      "Kenzie OpenAI connection test failed",
      safeErrorDetails(error),
    );
    return {
      ok: false,
      code: "provider",
      message:
        "Kenzie could not reach the AI service. Check the server configuration and try again.",
    };
  }
}
