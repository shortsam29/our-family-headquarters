import { FeaturePage, FeaturePageHeader, FeatureSection } from "@/components/features/FeaturePage";
import { VaultManager } from "@/components/vault/VaultManager";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getVaultDocuments } from "@/lib/data/vault";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string }> }) {
  const context = await requireCurrentHouseholdContext();
  const params = await searchParams;
  const data = await getVaultDocuments(context, params.q);
  const canManage = context.role === "household_manager" || context.role === "parent";
  return <FeaturePage>
    <FeaturePageHeader eyebrow="Family Vault" title="Documents" description="A secure, searchable home for the household’s important files and renewal dates." />
    {params.status ? <p role="status">The Family Vault was updated.</p> : null}
    {params.error || data.error ? <p role="alert">{data.error ?? "That Vault change could not be completed. Please review the file and try again."}</p> : null}
    <FeatureSection title="Find a document">
      <form action="/family-hub/documents" role="search"><label htmlFor="vault-search">Search titles, categories, and notes</label><input id="vault-search" name="q" defaultValue={params.q} /><button type="submit">Search</button></form>
    </FeatureSection>
    <FeatureSection title="Household documents" description="Parents control visibility. Household-visible files remain available only to signed-in household members.">
      <VaultManager documents={data.documents} canManage={canManage} />
    </FeatureSection>
  </FeaturePage>;
}
