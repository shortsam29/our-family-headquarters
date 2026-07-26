"use client";

import { useActionState } from "react";
import { Card } from "@/components/design-system";
import { addFamilyMember, disableJoinCode, generateJoinCode, removeFamilyMember, updateFamilyMember, type InvitationActionState } from "@/app/actions/family";
import type { HouseholdInvitationSummary } from "@/lib/data/core";
import styles from "./FamilyMemberManager.module.css";

type ManagedMember = { id: string; displayName: string; role: string; status: string; linkedAccount: boolean };
const assignableRoles = ["parent", "child", "caregiver", "guest"] as const;
const initialInvitationState: InvitationActionState = {};

function InvitationControl({ member, invitation }: { member: ManagedMember; invitation?: HouseholdInvitationSummary }) {
  const [state, action, pending] = useActionState(generateJoinCode, initialInvitationState);
  if (member.linkedAccount) return <p className={styles.connection}>Account connected</p>;
  if (member.status !== "active") return <p className={styles.connection}>No active account access</p>;
  const active = invitation?.status === "active" && new Date(invitation.expiresAt) > new Date();
  return <div className={styles.invitation}>
    <p><strong>{active ? "Join code ready" : "No active join code"}</strong></p>
    <p className="type-supporting">Create a private, single-use code for this family member. It expires after seven days.</p>
    <form action={action}><input type="hidden" name="memberId" value={member.id} /><button type="submit" disabled={pending}>{active ? "Regenerate join code" : "Create join code"}</button></form>
    {state.memberId === member.id && state.code ? <div className={styles.code} role="status"><span>Share this code privately</span><strong>{state.code}</strong><span>It is shown only this time.</span></div> : null}
    {state.error ? <p role="alert">{state.error}</p> : null}
    {active ? <form action={disableJoinCode}><input type="hidden" name="memberId" value={member.id} /><button type="submit" className={styles.secondary}>Disable join code</button></form> : null}
  </div>;
}

export function FamilyMemberManager({ members, currentMemberId, invitations }: { members: ManagedMember[]; currentMemberId: string; invitations: HouseholdInvitationSummary[] }) {
  return <div className={styles.manager}>
    <Card><h3 className="type-card-heading">Add a family member</h3><p className="type-supporting">Create their family profile first, then make a private join code when they need their own account.</p><form action={addFamilyMember} className={styles.form}>
      <label>Display name<input name="displayName" required maxLength={100} /></label>
      <label>Household role<select name="role" defaultValue="child">{assignableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
      <button type="submit">Add member</button>
    </form></Card>
    {members.map((member) => <Card key={member.id}><form action={updateFamilyMember} className={styles.form}>
      <input type="hidden" name="memberId" value={member.id} />
      <label>Display name<input name="displayName" defaultValue={member.displayName} required maxLength={100} /></label>
      <label>Household role<select name="role" defaultValue={member.role} disabled={member.id === currentMemberId}>{member.role === "household_manager" ? <option value="household_manager">household manager</option> : null}{assignableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select>{member.id === currentMemberId ? <input type="hidden" name="role" value={member.role} /> : null}</label>
      <label>Status<select name="status" defaultValue={member.status} disabled={member.id === currentMemberId}><option value="active">active</option><option value="inactive">inactive</option><option value="archived">archived</option></select>{member.id === currentMemberId ? <input type="hidden" name="status" value="active" /> : null}</label>
      <button type="submit">Save member</button>
    </form>
    {member.role !== "household_manager" ? <InvitationControl member={member} invitation={invitations.find((item) => item.familyMemberId === member.id)} /> : null}
    {member.id !== currentMemberId && member.role !== "household_manager" ? <form action={removeFamilyMember} className={styles.removeForm} onSubmit={(event) => { if (!window.confirm(`Remove ${member.displayName} from this household? Their historical records will be preserved.`)) event.preventDefault(); }}><input type="hidden" name="memberId" value={member.id} /><button type="submit">Remove from household</button></form> : null}
    </Card>)}
  </div>;
}