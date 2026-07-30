"use client";

import { useActionState } from "react";
import { saveKenzieProfileAssociation, type KenzieProfileAssignmentState } from "@/app/actions/kenzie-profiles";
import type { ManagedFamilyMember } from "@/lib/data/core";
import type { KenzieProfileKey } from "@/lib/kenzie/profiles/registry";

const profileLabels: Record<KenzieProfileKey, string> = {
  samantha: "Samantha",
  jason: "Jason",
  robbie: "Robbie",
  braeden: "Braeden",
  fran: "Fran",
};

function AssignmentForm({ member, current }: { member: ManagedFamilyMember; current?: KenzieProfileKey }) {
  const [state, action, pending] = useActionState<KenzieProfileAssignmentState, FormData>(
    saveKenzieProfileAssociation,
    {},
  );
  return (
    <form action={action}>
      <input type="hidden" name="memberId" value={member.id} />
      <label>
        {member.displayName}
        <select name="profileKey" defaultValue={current ?? ""} disabled={pending}>
          <option value="">Safe default</option>
          {Object.entries(profileLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save personalization"}</button>
      {state.saved ? <p role="status">Kenzie personalization saved.</p> : null}
      {state.error ? <p role="alert">{state.error}</p> : null}
    </form>
  );
}

export function KenzieProfileManager({
  members,
  associations,
}: {
  members: ManagedFamilyMember[];
  associations: Record<string, KenzieProfileKey>;
}) {
  const eligible = members.filter((member) => member.status === "active" && member.linkedAccount);
  if (!eligible.length) return <p>No active signed-in household members are ready for Kenzie personalization.</p>;
  return (
    <div>
      <p>Assign a friendly Kenzie communication profile after a family member has joined and signed in. Clearing the choice restores the safe default.</p>
      {eligible.map((member) => <AssignmentForm key={member.id} member={member} current={associations[member.id]} />)}
    </div>
  );
}
