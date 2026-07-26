import{readFileSync}from"node:fs";import{describe,expect,it}from"vitest";
const sql=readFileSync("supabase/migrations/20260726190000_private_personal_tools.sql","utf8");
describe("private personal tools migration",()=>{it("requires the authenticated owner for every operation without manager overrides",()=>{expect(sql).toContain("owner_user_id=auth.uid()");expect(sql.match(/create policy/g)).toHaveLength(8);expect(sql).not.toMatch(/current_member_role|household_manager|parent/);expect(sql).toContain("personal_brain_dump_notes");expect(sql).toContain("personal_wish_list_items")})});
