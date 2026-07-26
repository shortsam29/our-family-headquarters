import { Badge, Card, EmptyState } from "@/components/design-system";
import { clearCompletedShoppingItems, createDomainRecord, removeDomainRecord, toggleFinanceStatus, toggleShoppingItem, updateDomainRecord } from "@/app/actions/domains";
import type { DomainRecord, DomainSlug } from "@/types/domains";
import styles from "./DomainRoom.module.css";

const copy: Record<DomainSlug, { title: string; add: string; empty: string }> = {
  meals: { title: "Meal", add: "Plan a meal", empty: "No meals are planned yet. A simple week can begin whenever you’re ready." },
  shopping: { title: "Item", add: "Add an item", empty: "The lists are clear. Nothing is waiting to be purchased." },
  pets: { title: "Pet", add: "Add a pet", empty: "No pet profiles have been added." },
  contacts: { title: "Contact", add: "Add a contact", empty: "No contacts are available to this family member." },
  vehicles: { title: "Vehicle", add: "Add a vehicle", empty: "No household vehicles have been added." },
  documents: { title: "Document", add: "Add document metadata", empty: "No document summaries are available to this family member." },
  finance: { title: "Bill or subscription", add: "Add a financial item", empty: "No upcoming household obligations are recorded." },
};

function ExtraFields({ slug }: { slug: DomainSlug }) {
  if (slug === "meals") return <><label>Planned date<input name="date" type="date" required /></label><label>Meal type<select name="mealType" defaultValue="dinner"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label></>;
  if (slug === "shopping") return <><label>List name<input name="listName" placeholder="Groceries" maxLength={100} /></label><label>List type<select name="listType" defaultValue="grocery"><option value="grocery">Grocery</option><option value="household">Household shopping</option></select></label><label>Quantity<input name="quantity" maxLength={40} /></label><label>Category or aisle<input name="category" maxLength={80} /></label><label>Priority<select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label></>;
  if (slug === "pets") return <><label>Species<input name="species" required maxLength={80} /></label><label>Breed (optional)<input name="breed" maxLength={100} /></label></>;
  if (slug === "contacts") return <><label>Category<input name="category" required defaultValue="Emergency" maxLength={80} /></label><label>Phone<input name="phone" type="tel" /></label><label>Email<input name="email" type="email" /></label><label>Visibility<select name="visibility" defaultValue="household"><option value="household">Household</option><option value="adults">Adults only</option></select></label><label className={styles.check}><input name="emergency" type="checkbox" /> Emergency contact</label></>;
  if (slug === "vehicles") return <><label>Make<input name="make" maxLength={80} /></label><label>Model<input name="model" maxLength={80} /></label><label>Year<input name="year" type="number" min="1886" max="2200" /></label></>;
  if (slug === "documents") return <><label>Category<input name="category" required defaultValue="Household" maxLength={80} /></label><label>Expiration or renewal date<input name="date" type="date" /></label><label>Visibility<select name="visibility" defaultValue="adults"><option value="adults">Adults only</option><option value="household">Household</option></select></label><p className={styles.hint}>Secure file uploads are available in Family Vault. Open the Documents room to add the file itself.</p></>;
  return <><label>Type<select name="kind" defaultValue="bill"><option value="bill">Bill</option><option value="subscription">Subscription</option></select></label><label>Category<input name="category" maxLength={80} /></label><label>Amount (optional)<input name="amount" type="number" min="0" step="0.01" /></label><label>Due date<input name="date" type="date" /></label><label>Recurrence<input name="recurrence" placeholder="Monthly, yearly, or one-time" maxLength={80} /></label></>;
}

export function DomainRoom({ slug, records, canManage }: { slug: DomainSlug; records: DomainRecord[]; canManage: boolean }) {
  const canCreate = canManage || slug === "shopping";
  return (
    <div className={styles.room}>
      {canCreate ? (
        <Card>
          <h2 className="type-section-heading">+ {copy[slug].add}</h2>
          <form action={createDomainRecord.bind(null, slug)} className={styles.form}>
            <label>{copy[slug].title}<input name="title" required maxLength={160} /></label>
            <ExtraFields slug={slug} />
            <label className={styles.wide}>Notes (optional)<textarea name="notes" rows={3} maxLength={2000} /></label>
            <button type="submit">{copy[slug].add}</button>
          </form>
        </Card>
      ) : <p className={styles.permission}>You can view this room. A parent or household manager manages its records.</p>}

      {slug === "shopping" && records.some((record) => record.status === "purchased") ? <details><summary>Clear completed items</summary><p>This permanently removes purchased items from these lists.</p><form action={clearCompletedShoppingItems}><button className={styles.secondary} type="submit">Confirm clear completed</button></form></details> : null}
      {records.length === 0 ? <EmptyState title="This room is calm" description={copy[slug].empty} /> : (
        <ul className={styles.list}>
          {records.map((record) => (
            <li key={record.id}>
              <Card className={styles.record}>
                <div className={styles.recordHeader}>
                  <div><Badge>{record.kind}</Badge><h2 className="type-card-heading">{record.title}</h2></div>
                  {record.status ? <Badge variant={record.status === "purchased" || record.status === "paid" ? "success" : "sage"}>{record.status}</Badge> : null}
                </div>
                {record.detail ? <p>{record.detail}</p> : null}
                {record.date ? <p><time dateTime={record.date}>{record.date}</time></p> : null}
                {record.notes ? <p className={styles.notes}>{record.notes}</p> : null}
                {slug === "finance" && canManage ? <form action={toggleFinanceStatus.bind(null, record.id, record.status !== "paid")}><button type="submit" className={styles.secondary}>{record.status === "paid" ? "Mark unpaid" : "Mark paid"}</button></form> : null}
                {slug === "shopping" ? (
                  <form action={toggleShoppingItem.bind(null, record.id, record.status !== "purchased")}>
                    <button type="submit" className={styles.secondary}>{record.status === "purchased" ? "Mark needed" : "Mark purchased"}</button>
                  </form>
                ) : null}
                {(canManage || slug === "shopping") ? (
                  <details>
                    <summary>Edit {copy[slug].title.toLowerCase()}</summary>
                    <form action={updateDomainRecord.bind(null, slug, record.id)} className={styles.editForm}>
                      <label>Title<input name="title" defaultValue={record.title} required maxLength={160} /></label>
                      <label>Notes<textarea name="notes" defaultValue={record.notes} rows={2} maxLength={2000} /></label>
                      <button type="submit">Save changes</button>
                      {canManage ? <button className={styles.danger} formAction={removeDomainRecord.bind(null, slug, record.id)} type="submit">Remove</button> : null}
                    </form>
                  </details>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
