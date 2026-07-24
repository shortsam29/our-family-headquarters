import { Badge, Card, EmptyState } from "@/components/design-system";
import { createCareReminder, createRecipe, removeRecipe, setCareReminderStatus } from "@/app/actions/related-domains";
import type { RelatedRecord } from "@/lib/data/related-domains";
import type { DomainRecord, DomainSlug } from "@/types/domains";
import styles from "./RelatedDomainSection.module.css";

export function RelatedDomainSection({ slug, records, owners, canManage }: { slug: DomainSlug; records: RelatedRecord[]; owners: DomainRecord[]; canManage: boolean }) {
  if (!["meals", "pets", "vehicles"].includes(slug)) return null;
  const isRecipe = slug === "meals";
  const kind = slug as "pets" | "vehicles";
  return (
    <div className={styles.section}>
      {canManage ? (
        <Card>
          <h2 className="type-section-heading">{isRecipe ? "Add a basic recipe" : "Add a care reminder"}</h2>
          {isRecipe ? (
            <form action={createRecipe} className={styles.form}>
              <label>Recipe name<input name="name" required maxLength={160} /></label>
              <label>Servings<input name="servings" type="number" min="1" max="100" /></label>
              <label className={styles.wide}>Ingredients, separated by commas<input name="ingredients" maxLength={2000} /></label>
              <label className={styles.wide}>Instructions<textarea name="instructions" rows={4} maxLength={5000} /></label>
              <button type="submit">Save recipe</button>
            </form>
          ) : (
            <form action={createCareReminder.bind(null, kind)} className={styles.form}>
              <label>{slug === "pets" ? "Pet" : "Vehicle"}<select name="ownerId" required><option value="">Choose one</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.title}</option>)}</select></label>
              <label>Due date<input name="dueDate" type="date" /></label>
              <label className={styles.wide}>Reminder<input name="title" required maxLength={160} /></label>
              <label className={styles.wide}>Notes<textarea name="notes" rows={3} maxLength={2000} /></label>
              <button type="submit" disabled={!owners.length}>Save reminder</button>
            </form>
          )}
        </Card>
      ) : null}
      {records.length ? (
        <ul className={styles.list}>
          {records.map((record) => <li key={record.id}><Card><div className={styles.heading}><div><Badge>{isRecipe ? "Recipe" : record.ownerName ?? "Reminder"}</Badge><h3 className="type-card-heading">{record.title}</h3></div>{record.status ? <Badge variant={record.status === "completed" ? "success" : "sage"}>{record.status}</Badge> : null}</div>{record.detail ? <p>{record.detail}</p> : null}{record.date ? <time dateTime={record.date}>{record.date}</time> : null}{canManage ? <form action={isRecipe ? removeRecipe.bind(null, record.id) : setCareReminderStatus.bind(null, kind, record.id, record.status !== "completed")}><button type="submit">{isRecipe ? "Remove recipe" : record.status === "completed" ? "Reopen reminder" : "Mark complete"}</button></form> : null}</Card></li>)}
        </ul>
      ) : <EmptyState title={isRecipe ? "No recipes yet" : "No care reminders"} description={isRecipe ? "Save the recipes your household returns to." : "Nothing needs attention right now."} />}
    </div>
  );
}
