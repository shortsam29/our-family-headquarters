import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const path of [".env.local", ".env.test.local"]) { if (!existsSync(path)) continue; for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, ""); } }
for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "OFH_TEST_MANAGER_A_EMAIL", "OFH_TEST_MANAGER_A_PASSWORD", "OFH_TEST_MANAGER_B_EMAIL", "OFH_TEST_MANAGER_B_PASSWORD"]) if (!process.env[name]) throw new Error(`Missing ${name}`);
async function login(emailName, passwordName) { const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); const auth = await client.auth.signInWithPassword({ email: process.env[emailName], password: process.env[passwordName] }); if (auth.error) throw new Error(`Authentication failed: ${emailName}`); const membership = await client.from("household_memberships").select("household_id,family_member_id").eq("user_id", auth.data.user.id).eq("status", "active").single(); if (membership.error) throw new Error("Membership resolution failed"); return { client, ...membership.data }; }
const managerA = await login("OFH_TEST_MANAGER_A_EMAIL", "OFH_TEST_MANAGER_A_PASSWORD");
const managerB = await login("OFH_TEST_MANAGER_B_EMAIL", "OFH_TEST_MANAGER_B_PASSWORD");
const title = "Doctor appointment persistence verification";
let eventId;
let allDayId;
try {
  const created = await managerA.client.from("schedule_events").insert({ household_id: managerA.household_id, created_by_member_id: managerA.family_member_id, title, category: "appointment", starts_at: "2026-08-03T15:00:00.000Z", ends_at: "2026-08-03T16:00:00.000Z", is_all_day: false }).select("id,household_id,title,starts_at,ends_at").single();
  if (created.error) throw new Error(`Timed insert rejected: ${created.error.code}`);
  eventId = created.data.id;
  const participant = await managerA.client.from("event_participants").insert({ event_id: eventId, family_member_id: managerA.family_member_id });
  if (participant.error) throw new Error(`Participant insert rejected: ${participant.error.code}`);
  const read = await managerA.client.from("schedule_events").select("id,household_id,title,starts_at,ends_at,event_participants(family_member_id)").eq("id", eventId).single();
  if (read.error || read.data.household_id !== managerA.household_id || read.data.starts_at !== "2026-08-03T15:00:00+00:00" || read.data.event_participants.length !== 1) throw new Error("Timed event read-back did not preserve household, time, or participant");
  const projectedDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(read.data.starts_at)).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
  const localDate = `${projectedDate.year}-${projectedDate.month}-${projectedDate.day}`;
  const day = localDate === "2026-08-03";
  const week = localDate >= "2026-08-03" && localDate <= "2026-08-09";
  const month = localDate.startsWith("2026-08");
  const upcoming = localDate > "2026-07-26";
  if (!day || !week || !month || !upcoming) throw new Error("Saved event failed a calendar projection");
  const updated = await managerA.client.from("schedule_events").update({ title: `${title} updated`, starts_at: "2026-08-04T16:30:00.000Z", ends_at: "2026-08-04T17:30:00.000Z" }).eq("id", eventId).select("id,title,starts_at").single();
  if (updated.error || updated.data.id !== eventId || !updated.data.title.endsWith("updated")) throw new Error("Event update did not persist to the same record");
  const deniedRead = await managerB.client.from("schedule_events").select("id").eq("id", eventId);
  const deniedUpdate = await managerB.client.from("schedule_events").update({ title: "Denied" }).eq("id", eventId).select("id");
  if (deniedRead.error || deniedRead.data.length || deniedUpdate.error || deniedUpdate.data.length) throw new Error("Cross-household event isolation failed");
  const allDay = await managerA.client.from("schedule_events").insert({ household_id: managerA.household_id, created_by_member_id: managerA.family_member_id, title: "All-day persistence verification", category: "family", all_day_date: "2026-08-31", is_all_day: true }).select("id,all_day_date,starts_at,ends_at").single();
  if (allDay.error || allDay.data.all_day_date !== "2026-08-31" || allDay.data.starts_at || allDay.data.ends_at) throw new Error("All-day date preservation failed");
  allDayId = allDay.data.id;
  console.log("Live schedule verification passed: create/read, household assignment, participant persistence, local date/time, Day/Week/Month/Upcoming projections, same-record edit, all-day preservation, and cross-household denial.");
} finally {
  if (eventId) { const deleted = await managerA.client.from("schedule_events").delete().eq("id", eventId).select("id"); if (deleted.error || deleted.data.length !== 1) throw new Error("Verification event cleanup failed"); }
  if (allDayId) { const deleted = await managerA.client.from("schedule_events").delete().eq("id", allDayId).select("id"); if (deleted.error || deleted.data.length !== 1) throw new Error("All-day verification cleanup failed"); }
  await Promise.all([managerA.client.auth.signOut(), managerB.client.auth.signOut()]);
}