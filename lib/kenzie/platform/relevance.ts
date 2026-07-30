import {
  calendarProvider,
  choreProvider,
  mealProvider,
  shoppingProvider,
} from "@/lib/kenzie/platform/providers";
import type { KenzieContextProvider } from "@/lib/kenzie/platform/types";

const routes: Array<{ pattern: RegExp; provider: KenzieContextProvider }> = [
  [/\b(calendar|schedule|event|appointment|tomorrow|saturday|sunday)\b/i, calendarProvider],
  [/\b(chore|chores|task|tasks|responsibilit|homework due)\b/i, choreProvider],
  [/\b(shop|shopping|grocery|groceries|buy|list|milk)\b/i, shoppingProvider],
  [/\b(meal|meals|dinner|lunch|breakfast|menu|eat)\b/i, mealProvider],
].map(([pattern, provider]) => ({ pattern: pattern as RegExp, provider: provider as KenzieContextProvider }));

export function selectRelevantProviders(message: string) {
  const selected = routes.filter((route) => route.pattern.test(message)).map((route) => route.provider);
  return [...new Map(selected.map((provider) => [provider.id, provider])).values()];
}
