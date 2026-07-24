import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "OFH_TEST_MANAGER_A_EMAIL", "OFH_TEST_MANAGER_A_PASSWORD",
  "OFH_TEST_CHILD_A_EMAIL", "OFH_TEST_CHILD_A_PASSWORD",
  "OFH_TEST_MANAGER_B_EMAIL", "OFH_TEST_MANAGER_B_PASSWORD",
];
for (const name of required) if (!process.env[name]) throw new Error(`Missing ${name}`);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const checks = [];
function check(name, passed) {
  checks.push({ name, passed });
  if (!passed) throw new Error(`Verification failed: ${name}`);
}
async function signedIn(emailName, passwordName) {
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: process.env[emailName], password: process.env[passwordName] });
  check(`${emailName} authenticates`, !error);
  return client;
}
async function count(client, table, filters = []) {
  let query = client.from(table).select("id", { count: "exact", head: true });
  for (const [field, value] of filters) query = query.eq(field, value);
  const { count: value, error } = await query;
  if (error) throw new Error(`${table} read failed: ${error.code}`);
  return value ?? 0;
}

const anonymous = createClient(url, key, { auth: { persistSession: false } });
check("anonymous domain reads are denied", await count(anonymous, "pets") === 0);

const managerA = await signedIn("OFH_TEST_MANAGER_A_EMAIL", "OFH_TEST_MANAGER_A_PASSWORD");
const managerB = await signedIn("OFH_TEST_MANAGER_B_EMAIL", "OFH_TEST_MANAGER_B_PASSWORD");
const childA = await signedIn("OFH_TEST_CHILD_A_EMAIL", "OFH_TEST_CHILD_A_PASSWORD");

for (const table of ["recipes", "meal_plan_entries", "shopping_lists", "shopping_list_items", "pets", "pet_care_reminders", "household_contacts", "vehicles", "vehicle_reminders", "vault_documents", "finance_obligations"]) {
  check(`Willow manager reads ${table}`, await count(managerA, table) > 0);
  check(`Cedar manager reads ${table}`, await count(managerB, table) > 0);
}
check("Willow cannot read Cedar pet", await count(managerA, "pets", [["id", "b8600000-0000-4000-8000-000000000001"]]) === 0);
check("Cedar cannot read Willow pet", await count(managerB, "pets", [["id", "a8600000-0000-4000-8000-000000000001"]]) === 0);
check("child cannot read adult-only finance", await count(childA, "finance_obligations") === 0);
check("child reads only shared vault metadata", await count(childA, "vault_documents") === 1);
check("child cannot read adult contact", await count(childA, "household_contacts") === 1);
const denied = await childA.from("pets").insert({ household_id: "a0000000-0000-4000-8000-000000000001", name: "Denied", species: "Dog" });
check("child cannot create pet records", Boolean(denied.error));
const crossUpdate = await managerA.from("vehicles").update({ name: "Blocked" }).eq("id", "b8900000-0000-4000-8000-000000000001").select("id");
check("cross-household update changes no records", !crossUpdate.error && (crossUpdate.data?.length ?? 0) === 0);

const itemId = "a8500000-0000-4000-8000-000000000001";
let mutation = await childA.from("shopping_list_items").update({ status: "purchased", purchased_by_member_id: "a1000000-0000-4000-8000-000000000002", purchased_at: new Date().toISOString() }).eq("id", itemId);
check("shopping completion persists", !mutation.error);
let read = await childA.from("shopping_list_items").select("status").eq("id", itemId).single();
check("completed shopping state reads back", read.data?.status === "purchased");
mutation = await childA.from("shopping_list_items").update({ status: "needed", purchased_by_member_id: null, purchased_at: null }).eq("id", itemId);
check("shopping reopening persists", !mutation.error);
read = await childA.from("shopping_list_items").select("status").eq("id", itemId).single();
check("reopened shopping state reads back", read.data?.status === "needed");

const duplicateOnboarding = await managerA.rpc("create_first_household", { household_name: "Duplicate", member_display_name: "Duplicate", household_time_zone: "UTC" });
check("onboarding prevents duplicate active household", Boolean(duplicateOnboarding.error));

for (const client of [managerA, managerB, childA]) await client.auth.signOut();
console.log(JSON.stringify({ passed: checks.length, checks: checks.map(({ name }) => name) }, null, 2));
