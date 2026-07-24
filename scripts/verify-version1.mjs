import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function load(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
load(".env.local"); load(".env.test.local");
const required = ["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","OFH_TEST_MANAGER_A_EMAIL","OFH_TEST_MANAGER_A_PASSWORD","OFH_TEST_CHILD_A_EMAIL","OFH_TEST_CHILD_A_PASSWORD","OFH_TEST_MANAGER_B_EMAIL","OFH_TEST_MANAGER_B_PASSWORD"];
for (const name of required) if (!process.env[name]) throw new Error(`Missing required variable: ${name}`);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
async function signedIn(emailName, passwordName) {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await client.auth.signInWithPassword({ email: process.env[emailName], password: process.env[passwordName] });
  if (result.error) throw new Error(`Authentication failed for ${emailName}`);
  return client;
}
function assert(condition, message) { if (!condition) throw new Error(message); }
async function upsert(client, table, rows, options) {
  const result = await client.from(table).upsert(rows, options);
  if (result.error) throw new Error(`${table} seed failed: ${result.error.code}`);
}

const managerA = await signedIn("OFH_TEST_MANAGER_A_EMAIL", "OFH_TEST_MANAGER_A_PASSWORD");
const childA = await signedIn("OFH_TEST_CHILD_A_EMAIL", "OFH_TEST_CHILD_A_PASSWORD");
const managerB = await signedIn("OFH_TEST_MANAGER_B_EMAIL", "OFH_TEST_MANAGER_B_PASSWORD");
const A = "a0000000-0000-4000-8000-000000000001", AM = "a1000000-0000-4000-8000-000000000001";
const B = "b0000000-0000-4000-8000-000000000001", BM = "b1000000-0000-4000-8000-000000000001";
await upsert(managerA, "household_memories", [
  { id: "aa000000-0000-4000-8000-000000000001", household_id: A, category: "favorite_meal", label: "Easy family dinner", value: "Vegetable pasta", visibility: "household", created_by_member_id: AM },
  { id: "aa000000-0000-4000-8000-000000000002", household_id: A, category: "family_note", label: "Parent planning note", value: "Keep weekly planning gentle.", visibility: "adults", created_by_member_id: AM },
], { onConflict: "id" });
await upsert(managerA, "kenzie_preferences", [{ household_id: A, greeting_style: "warm", reminder_style: "gentle", planning_behavior: "balanced", updated_by_member_id: AM }], { onConflict: "household_id" });
await upsert(managerB, "household_memories", [{ id: "bb000000-0000-4000-8000-000000000001", household_id: B, category: "favorite_activity", label: "Quiet family activity", value: "Reading together", visibility: "household", created_by_member_id: BM }], { onConflict: "id" });
await upsert(managerB, "kenzie_preferences", [{ household_id: B, greeting_style: "brief", reminder_style: "minimal", planning_behavior: "minimal", updated_by_member_id: BM }], { onConflict: "household_id" });

const aMemory = await managerA.from("household_memories").select("household_id,visibility");
const bMemory = await managerB.from("household_memories").select("household_id");
const childMemory = await childA.from("household_memories").select("household_id,visibility");
assert(!aMemory.error && aMemory.data.every((row) => row.household_id === A), "Manager A household isolation failed");
assert(!bMemory.error && bMemory.data.every((row) => row.household_id === B), "Manager B household isolation failed");
assert(!childMemory.error && childMemory.data.every((row) => row.household_id === A && row.visibility === "household"), "Child memory visibility failed");
const childWrite = await childA.from("household_memories").insert({ household_id: A, category: "family_note", label: "Unauthorized", value: "No", visibility: "household", created_by_member_id: AM });
assert(Boolean(childWrite.error), "Child unexpectedly wrote household memory");
const crossPlan = await childA.from("kenzie_tomorrow_plans").insert({ household_id: A, plan_date: "2099-01-01", items: [{ category: "Task", title: "Unauthorized" }], approved_by_member_id: AM });
assert(Boolean(crossPlan.error), "Child unexpectedly approved a tomorrow plan");

const objectPath = `${A}/verification/${Date.now()}-version1-check.txt`;
const upload = await managerA.storage.from("family-vault").upload(objectPath, new Blob(["Version 1 storage verification"], { type: "text/plain" }), { upsert: false });
assert(!upload.error, `Authorized Family Vault upload failed: ${upload.error?.statusCode ?? "unknown"} ${upload.error?.message ?? ""}`);
const vaultId = "aa000000-0000-4000-8000-000000000099";
const metadata = await managerA.from("vault_documents").upsert({ id: vaultId, household_id: A, title: "Storage verification", category: "Other", visibility: "household", owner_member_id: AM, storage_path: objectPath, file_name: "version1-check.txt", mime_type: "text/plain", file_size: 30 }, { onConflict: "id" });
assert(!metadata.error, "Vault metadata verification failed");
const allowedRead = await childA.storage.from("family-vault").createSignedUrl(objectPath, 30);
const deniedRead = await managerB.storage.from("family-vault").createSignedUrl(objectPath, 30);
assert(!allowedRead.error, "Household-visible vault read failed");
assert(Boolean(deniedRead.error), "Cross-household vault read unexpectedly succeeded");
await managerA.storage.from("family-vault").remove([objectPath]);
await managerA.from("vault_documents").delete().eq("id", vaultId);

await Promise.all([managerA.auth.signOut(), childA.auth.signOut(), managerB.auth.signOut()]);
console.log("Version 1 live verification passed: memory, preferences, approval boundaries, tenant isolation, and private Family Vault storage.");
