import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "OFH_TEST_MANAGER_A_EMAIL",
  "OFH_TEST_MANAGER_A_PASSWORD",
  "OFH_TEST_MANAGER_B_EMAIL",
  "OFH_TEST_MANAGER_B_PASSWORD",
];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function clientFor(emailKey, passwordKey) {
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({
    email: process.env[emailKey],
    password: process.env[passwordKey],
  });
  if (error) throw new Error(`Authentication failed for ${emailKey}`);
  return client;
}

async function upsert(client, table, rows) {
  const { error } = await client.from(table).upsert(rows);
  if (error) throw new Error(`${table}: ${error.code}`);
}

function isoDay(offset = 0) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function monday() {
  const value = new Date();
  value.setDate(value.getDate() - (value.getDay() || 7) + 1);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

async function seedWillow(client) {
  const household = "a0000000-0000-4000-8000-000000000001";
  const member = "a1000000-0000-4000-8000-000000000001";
  await upsert(client, "recipes", [{ id: "a8000000-0000-4000-8000-000000000001", household_id: household, name: "Willow vegetable pasta", instructions: "Cook pasta and fold in vegetables.", servings: 4, created_by_member_id: member }]);
  await upsert(client, "recipe_ingredients", [{ id: "a8100000-0000-4000-8000-000000000001", household_id: household, recipe_id: "a8000000-0000-4000-8000-000000000001", name: "Pasta", quantity: 1, unit: "box" }]);
  await upsert(client, "meal_plans", [{ id: "a8200000-0000-4000-8000-000000000001", household_id: household, week_start: monday(), created_by_member_id: member }]);
  await upsert(client, "meal_plan_entries", [{ id: "a8300000-0000-4000-8000-000000000001", household_id: household, meal_plan_id: "a8200000-0000-4000-8000-000000000001", planned_date: isoDay(), meal_type: "dinner", name: "Willow vegetable pasta", recipe_id: "a8000000-0000-4000-8000-000000000001", status: "confirmed" }]);
  await upsert(client, "shopping_lists", [
    { id: "a8400000-0000-4000-8000-000000000001", household_id: household, name: "Groceries", list_type: "grocery", created_by_member_id: member },
    { id: "a8400000-0000-4000-8000-000000000002", household_id: household, name: "Household Shopping", list_type: "household", created_by_member_id: member },
  ]);
  await upsert(client, "shopping_list_items", [
    { id: "a8500000-0000-4000-8000-000000000001", household_id: household, shopping_list_id: "a8400000-0000-4000-8000-000000000001", name: "Pasta", quantity: 1, unit: "box", status: "needed", source_recipe_id: "a8000000-0000-4000-8000-000000000001", added_by_member_id: member },
    { id: "a8500000-0000-4000-8000-000000000002", household_id: household, shopping_list_id: "a8400000-0000-4000-8000-000000000002", name: "Paper towels", quantity: 1, unit: "pack", status: "needed", added_by_member_id: member },
  ]);
  await upsert(client, "pets", [{ id: "a8600000-0000-4000-8000-000000000001", household_id: household, name: "Maple", species: "Dog", breed: "Mixed breed" }]);
  await upsert(client, "pet_care_reminders", [{ id: "a8700000-0000-4000-8000-000000000001", household_id: household, pet_id: "a8600000-0000-4000-8000-000000000001", title: "Routine wellness visit", due_date: isoDay(14), status: "active" }]);
  await upsert(client, "household_contacts", [
    { id: "a8800000-0000-4000-8000-000000000001", household_id: household, name: "Neighborhood Clinic", category: "Emergency", phone: "555-0100", is_emergency: true, visibility: "household" },
    { id: "a8800000-0000-4000-8000-000000000002", household_id: household, name: "Home Service Contact", category: "Home", phone: "555-0101", is_emergency: false, visibility: "adults" },
  ]);
  await upsert(client, "vehicles", [{ id: "a8900000-0000-4000-8000-000000000001", household_id: household, name: "Family Car", make: "Fictional", model: "Wagon", model_year: 2022 }]);
  await upsert(client, "vehicle_reminders", [{ id: "a8a00000-0000-4000-8000-000000000001", household_id: household, vehicle_id: "a8900000-0000-4000-8000-000000000001", title: "Registration renewal", due_date: isoDay(21), reminder_type: "renewal", status: "active" }]);
  await upsert(client, "vault_documents", [
    { id: "a8b00000-0000-4000-8000-000000000001", household_id: household, title: "Family emergency plan", category: "Household", visibility: "household", owner_member_id: member },
    { id: "a8b00000-0000-4000-8000-000000000002", household_id: household, title: "Vehicle registration", category: "Vehicle", visibility: "adults", owner_member_id: member, expiration_date: isoDay(20) },
  ]);
  await upsert(client, "finance_obligations", [{ id: "a8c00000-0000-4000-8000-000000000001", household_id: household, title: "Home internet", kind: "bill", category: "Household", amount: 65, due_date: isoDay(7), recurrence: "Monthly", status: "upcoming" }]);
}

async function seedCedar(client) {
  const household = "b0000000-0000-4000-8000-000000000001";
  const member = "b1000000-0000-4000-8000-000000000001";
  await upsert(client, "recipes", [{ id: "b8000000-0000-4000-8000-000000000001", household_id: household, name: "Cedar soup", instructions: "Warm gently.", servings: 2, created_by_member_id: member }]);
  await upsert(client, "meal_plans", [{ id: "b8200000-0000-4000-8000-000000000001", household_id: household, week_start: monday(), created_by_member_id: member }]);
  await upsert(client, "meal_plan_entries", [{ id: "b8300000-0000-4000-8000-000000000001", household_id: household, meal_plan_id: "b8200000-0000-4000-8000-000000000001", planned_date: isoDay(), meal_type: "dinner", name: "Cedar soup", recipe_id: "b8000000-0000-4000-8000-000000000001", status: "planned" }]);
  await upsert(client, "shopping_lists", [{ id: "b8400000-0000-4000-8000-000000000001", household_id: household, name: "Groceries", list_type: "grocery", created_by_member_id: member }]);
  await upsert(client, "shopping_list_items", [{ id: "b8500000-0000-4000-8000-000000000001", household_id: household, shopping_list_id: "b8400000-0000-4000-8000-000000000001", name: "Soup vegetables", status: "needed", added_by_member_id: member }]);
  await upsert(client, "pets", [{ id: "b8600000-0000-4000-8000-000000000001", household_id: household, name: "Juniper", species: "Cat" }]);
  await upsert(client, "pet_care_reminders", [{ id: "b8700000-0000-4000-8000-000000000001", household_id: household, pet_id: "b8600000-0000-4000-8000-000000000001", title: "Care check", due_date: isoDay(10), status: "active" }]);
  await upsert(client, "household_contacts", [{ id: "b8800000-0000-4000-8000-000000000001", household_id: household, name: "Cedar Clinic", category: "Emergency", phone: "555-0200", is_emergency: true, visibility: "household" }]);
  await upsert(client, "vehicles", [{ id: "b8900000-0000-4000-8000-000000000001", household_id: household, name: "Cedar Car", make: "Fictional", model: "Hatch", model_year: 2021 }]);
  await upsert(client, "vehicle_reminders", [{ id: "b8a00000-0000-4000-8000-000000000001", household_id: household, vehicle_id: "b8900000-0000-4000-8000-000000000001", title: "Maintenance review", due_date: isoDay(28), status: "active" }]);
  await upsert(client, "vault_documents", [{ id: "b8b00000-0000-4000-8000-000000000001", household_id: household, title: "Cedar household plan", category: "Household", visibility: "household", owner_member_id: member }]);
  await upsert(client, "finance_obligations", [{ id: "b8c00000-0000-4000-8000-000000000001", household_id: household, title: "Cedar utility", kind: "bill", amount: 42, due_date: isoDay(8), status: "upcoming" }]);
}

const managerA = await clientFor("OFH_TEST_MANAGER_A_EMAIL", "OFH_TEST_MANAGER_A_PASSWORD");
const managerB = await clientFor("OFH_TEST_MANAGER_B_EMAIL", "OFH_TEST_MANAGER_B_PASSWORD");
await seedWillow(managerA);
await seedCedar(managerB);
await managerA.auth.signOut();
await managerB.auth.signOut();
console.log("Domain development data seeded for two isolated fictional households.");
