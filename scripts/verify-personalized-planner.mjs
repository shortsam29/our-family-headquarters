import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const path of [".env.local", ".env.test.local"]) {
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "OFH_TEST_MANAGER_A_EMAIL",
  "OFH_TEST_MANAGER_A_PASSWORD",
  "OFH_TEST_MANAGER_B_EMAIL",
  "OFH_TEST_MANAGER_B_PASSWORD",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}

async function login(emailName, passwordName) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const auth = await client.auth.signInWithPassword({
    email: process.env[emailName],
    password: process.env[passwordName],
  });
  if (auth.error) throw new Error(`Authentication failed: ${emailName}`);
  const membership = await client
    .from("household_memberships")
    .select("household_id,family_member_id")
    .eq("user_id", auth.data.user.id)
    .eq("status", "active")
    .single();
  if (membership.error) throw new Error("Membership resolution failed");
  return { client, userId: auth.data.user.id, ...membership.data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function requireOkay(operation, label) {
  const result = await operation;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const managerA = await login(
  "OFH_TEST_MANAGER_A_EMAIL",
  "OFH_TEST_MANAGER_A_PASSWORD",
);
const managerB = await login(
  "OFH_TEST_MANAGER_B_EMAIL",
  "OFH_TEST_MANAGER_B_PASSWORD",
);
const member = await requireOkay(
  managerA.client
    .from("family_members")
    .select("display_name")
    .eq("id", managerA.family_member_id)
    .single(),
  "Read verification member",
);
const originalName = member.display_name;
const createdItemIds = [];
const createdEventIds = [];

async function renameVerificationMember(displayName) {
  await requireOkay(
    managerA.client
      .from("family_members")
      .update({ display_name: displayName })
      .eq("id", managerA.family_member_id),
    "Set verification identity",
  );
}

async function createItem(values) {
  const id = randomUUID();
  const data = await requireOkay(
    managerA.client
      .from("personal_planner_items")
      .insert({
        id,
        household_id: managerA.household_id,
        owner_user_id: managerA.userId,
        owner_member_id: managerA.family_member_id,
        ...values,
      })
      .select()
      .single(),
    `Create ${values.item_type}`,
  );
  createdItemIds.push(id);
  return data;
}

try {
  await renameVerificationMember("Samantha Verification");
  const reading = await createItem({
    item_type: "reading",
    title: "Verification Book",
    author: "Fictional Author",
    status: "want_to_read",
  });
  const editedReading = await requireOkay(
    managerA.client
      .from("personal_planner_items")
      .update({ notes: "Edited safely" })
      .eq("id", reading.id)
      .select()
      .single(),
    "Edit reading item",
  );
  assert(editedReading.notes === "Edited safely", "Reading edit did not persist");
  const completedReading = await requireOkay(
    managerA.client
      .from("personal_planner_items")
      .update({ status: "read", completed_at: new Date().toISOString() })
      .eq("id", reading.id)
      .select()
      .single(),
    "Mark reading item read",
  );
  assert(
    completedReading.status === "read" && completedReading.completed_at,
    "Reading completion did not persist",
  );

  const diy = await createItem({
    item_type: "diy",
    title: "Verification Shelf",
    materials: "Fictional materials",
    status: "active",
  });
  const completedDiy = await requireOkay(
    managerA.client
      .from("personal_planner_items")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", diy.id)
      .select()
      .single(),
    "Complete DIY item",
  );
  assert(completedDiy.status === "completed", "DIY completion did not persist");

  const hiddenFromB = await requireOkay(
    managerB.client
      .from("personal_planner_items")
      .select("id")
      .in("id", [reading.id, diy.id]),
    "Cross-household private read",
  );
  assert(hiddenFromB.length === 0, "Private Samantha records leaked");

  await renameVerificationMember("Jason Verification");
  const training = await createItem({
    item_type: "training",
    title: "Verification Fire Training",
    start_date: "2026-09-10",
    end_date: "2026-09-12",
    start_time: "09:00",
    end_time: "16:00",
    location: "Training Center",
    notes: "Verification only",
    status: "active",
  });
  assert(
    training.start_date === "2026-09-10" &&
      training.end_date === "2026-09-12",
    "Training multi-day dates shifted",
  );
  const fight = await createItem({
    item_type: "fight",
    title: "Verification Buhurt Event",
    start_date: "2026-10-03",
    end_date: "2026-10-04",
    start_time: "10:00",
    end_time: "18:00",
    location: "Fictional Arena",
    status: "active",
  });
  assert(fight.end_date === "2026-10-04", "Fight multi-day dates shifted");

  const firstLink = await requireOkay(
    managerA.client.rpc("link_personal_planner_item_to_schedule", {
      target_item: training.id,
      update_existing: false,
    }),
    "Create linked family event",
  );
  createdEventIds.push(firstLink);
  const secondLink = await requireOkay(
    managerA.client.rpc("link_personal_planner_item_to_schedule", {
      target_item: training.id,
      update_existing: false,
    }),
    "Repeat linked family event",
  );
  assert(firstLink === secondLink, "Duplicate prevention returned another event");

  const linkedEvents = await requireOkay(
    managerA.client
      .from("schedule_events")
      .select("id,household_id,title,starts_at,ends_at")
      .eq("id", firstLink),
    "Read linked event",
  );
  assert(linkedEvents.length === 1, "Linked schedule event is not unique");
  assert(
    linkedEvents[0].household_id === managerA.household_id,
    "Linked event has incorrect household",
  );
  const participants = await requireOkay(
    managerA.client
      .from("event_participants")
      .select("family_member_id")
      .eq("event_id", firstLink),
    "Read linked participant",
  );
  assert(
    participants.some(
      (participant) =>
        participant.family_member_id === managerA.family_member_id,
    ),
    "Jason was not retained as a participant",
  );

  await requireOkay(
    managerA.client
      .from("personal_planner_items")
      .update({ title: "Updated Verification Fire Training" })
      .eq("id", training.id),
    "Edit linked training",
  );
  const updatedLink = await requireOkay(
    managerA.client.rpc("link_personal_planner_item_to_schedule", {
      target_item: training.id,
      update_existing: true,
    }),
    "Update linked schedule event",
  );
  assert(updatedLink === firstLink, "Linked update created another event");
  const updatedEvent = await requireOkay(
    managerA.client
      .from("schedule_events")
      .select("title")
      .eq("id", firstLink)
      .single(),
    "Read updated linked event",
  );
  assert(
    updatedEvent.title === "Updated Verification Fire Training",
    "Explicit linked update did not persist",
  );

  const eventHiddenFromB = await requireOkay(
    managerB.client.from("schedule_events").select("id").eq("id", firstLink),
    "Cross-household schedule read",
  );
  assert(eventHiddenFromB.length === 0, "Linked event leaked households");
  const forbiddenWrite = await managerB.client
    .from("personal_planner_items")
    .update({ title: "Forbidden" })
    .eq("id", training.id)
    .select();
  assert(
    !forbiddenWrite.error && forbiddenWrite.data.length === 0,
    "Cross-household update was not denied",
  );

  await requireOkay(
    managerA.client
      .from("personal_planner_items")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", fight.id),
    "Complete fight",
  );
  console.log(
    "Live personalized planner verification passed: private CRUD, role identity, multi-day dates, explicit schedule confirmation RPC, duplicate prevention, participant linkage, linked update, and household isolation.",
  );
} finally {
  if (createdItemIds.length) {
    await managerA.client
      .from("personal_planner_items")
      .delete()
      .in("id", createdItemIds);
  }
  if (createdEventIds.length) {
    await managerA.client
      .from("schedule_events")
      .delete()
      .in("id", createdEventIds);
  }
  await renameVerificationMember(originalName);
  await managerA.client.auth.signOut();
  await managerB.client.auth.signOut();
}
