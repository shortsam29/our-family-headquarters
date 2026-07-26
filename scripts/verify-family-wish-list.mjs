import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const path of [".env.local", ".env.test.local"]) {
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "OFH_TEST_MANAGER_A_EMAIL", "OFH_TEST_MANAGER_A_PASSWORD", "OFH_TEST_CHILD_A_EMAIL", "OFH_TEST_CHILD_A_PASSWORD", "OFH_TEST_MANAGER_B_EMAIL", "OFH_TEST_MANAGER_B_PASSWORD"];
for (const name of required) if (!process.env[name]) throw new Error(`Missing ${name}`);

async function login(emailName, passwordName) {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const auth = await client.auth.signInWithPassword({ email: process.env[emailName], password: process.env[passwordName] });
  if (auth.error) throw new Error(`Authentication failed: ${emailName}`);
  const membership = await client.from("household_memberships").select("household_id,family_member_id").eq("user_id", auth.data.user.id).eq("status", "active").single();
  if (membership.error) throw new Error("Membership resolution failed");
  return { client, userId: auth.data.user.id, ...membership.data };
}
function assert(value, message) { if (!value) throw new Error(message); }
async function okay(query, label) { const result = await query; if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data; }

const samantha = await login("OFH_TEST_MANAGER_A_EMAIL", "OFH_TEST_MANAGER_A_PASSWORD");
const child = await login("OFH_TEST_CHILD_A_EMAIL", "OFH_TEST_CHILD_A_PASSWORD");
const otherHousehold = await login("OFH_TEST_MANAGER_B_EMAIL", "OFH_TEST_MANAGER_B_PASSWORD");
const member = await okay(samantha.client.from("family_members").select("display_name").eq("id", samantha.family_member_id).single(), "Read verification identity");
const originalName = member.display_name;
const samanthaWishId = randomUUID();
const childWishId = randomUUID();
try {
  await okay(samantha.client.from("family_members").update({ display_name: "Samantha Verification" }).eq("id", samantha.family_member_id), "Set Samantha identity");
  await okay(samantha.client.from("personal_wish_list_items").insert({ id: samanthaWishId, household_id: samantha.household_id, owner_user_id: samantha.userId, item_name: "Verification Book" }), "Create Samantha wish");
  await okay(child.client.from("personal_wish_list_items").insert({ id: childWishId, household_id: child.household_id, owner_user_id: child.userId, item_name: "Verification Shoes", store_website: "Fictional Store" }), "Create child wish");

  let dashboard = await okay(samantha.client.from("personal_wish_list_items").select("id,item_name,store_website").eq("household_id", samantha.household_id).in("id", [samanthaWishId, childWishId]), "Read family dashboard");
  assert(dashboard.length === 2, "Samantha could not read every household wish");
  await okay(child.client.from("personal_wish_list_items").update({ item_name: "Updated Verification Shoes" }).eq("id", childWishId), "Owner edit");
  dashboard = await okay(samantha.client.from("personal_wish_list_items").select("id,item_name").eq("id", childWishId), "Read live owner edit");
  assert(dashboard[0]?.item_name === "Updated Verification Shoes", "Dashboard did not reflect owner edit directly");

  const forbiddenEdit = await samantha.client.from("personal_wish_list_items").update({ item_name: "Forbidden edit" }).eq("id", childWishId).select("id");
  assert(!forbiddenEdit.error && forbiddenEdit.data.length === 0, "Dashboard viewer could edit another member's wish");
  const childRead = await okay(child.client.from("personal_wish_list_items").select("id").eq("id", samanthaWishId), "Ordinary member read boundary");
  assert(childRead.length === 0, "Ordinary member could read Samantha's wish");
  const crossHousehold = await okay(otherHousehold.client.from("personal_wish_list_items").select("id").in("id", [samanthaWishId, childWishId]), "Cross-household read boundary");
  assert(crossHousehold.length === 0, "Wish records crossed household boundary");
  console.log("Family wish-list verification passed: owner CRUD remains live, Samantha can read household wishes, the dashboard cannot edit them, ordinary members remain private, and household isolation holds.");
} finally {
  await samantha.client.from("personal_wish_list_items").delete().eq("id", samanthaWishId);
  await child.client.from("personal_wish_list_items").delete().eq("id", childWishId);
  await samantha.client.from("family_members").update({ display_name: originalName }).eq("id", samantha.family_member_id);
  await Promise.all([samantha.client.auth.signOut(), child.client.auth.signOut(), otherHousehold.client.auth.signOut()]);
}
