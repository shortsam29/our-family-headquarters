import type { FamilyWishListGroup } from "@/lib/data/personal-tools";
import styles from "./FamilyWishListDashboard.module.css";


function addedDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function FamilyWishListDashboard({ groups }: { groups: FamilyWishListGroup[] }) {
  return (
    <div className={styles.grid}>
      {groups.map((group) => (
        <article className={styles.card} key={group.memberId} aria-labelledby={`wish-list-${group.memberId}`}>
          <h3 id={`wish-list-${group.memberId}`}>⭐ {group.displayName}&apos;s Wish List</h3>
          {group.items.length ? (
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <strong>{item.itemName}</strong>
                  {item.storeWebsite ? <span>{item.storeWebsite}</span> : null}
                  {item.notes ? <p>{item.notes}</p> : null}
                  <time dateTime={item.createdAt}>Added {addedDate(item.createdAt)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No wish list items yet.</p>
          )}
        </article>
      ))}
    </div>
  );
}
