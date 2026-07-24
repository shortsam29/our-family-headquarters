import { getVaultFileRedirect } from "@/lib/data/vault-route";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getVaultFileRedirect(id, false);
}
