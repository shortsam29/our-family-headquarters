import { Card } from "@/components/design-system";
import { addFamilyMember, updateFamilyMember } from "@/app/actions/family";
import styles from "./FamilyMemberManager.module.css";

type ManagedMember = {
  id: string;
  displayName: string;
  role: string;
  status: string;
};

const assignableRoles = ["parent", "child", "caregiver", "guest"] as const;

export function FamilyMemberManager({
  members,
  currentMemberId,
}: {
  members: ManagedMember[];
  currentMemberId: string;
}) {
  return (
    <div className={styles.manager}>
      <Card>
        <h3 className="type-card-heading">Add a family member</h3>
        <form action={addFamilyMember} className={styles.form}>
          <label>
            Display name
            <input name="displayName" required maxLength={100} />
          </label>
          <label>
            Household role
            <select name="role" defaultValue="child">
              {assignableRoles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>
          <button type="submit">Add member</button>
        </form>
      </Card>
      {members.map((member) => (
        <Card key={member.id}>
          <form action={updateFamilyMember} className={styles.form}>
            <input type="hidden" name="memberId" value={member.id} />
            <label>
              Display name
              <input name="displayName" defaultValue={member.displayName} required maxLength={100} />
            </label>
            <label>
              Household role
              <select name="role" defaultValue={member.role} disabled={member.id === currentMemberId}>
                {member.role === "household_manager" ? <option value="household_manager">household manager</option> : null}
                {assignableRoles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              {member.id === currentMemberId ? <input type="hidden" name="role" value={member.role} /> : null}
            </label>
            <label>
              Status
              <select name="status" defaultValue={member.status} disabled={member.id === currentMemberId}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
              {member.id === currentMemberId ? <input type="hidden" name="status" value="active" /> : null}
            </label>
            <button type="submit">Save member</button>
          </form>
        </Card>
      ))}
    </div>
  );
}
