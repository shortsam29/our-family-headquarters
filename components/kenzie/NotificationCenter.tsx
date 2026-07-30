import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { Card } from "@/components/design-system";
import type { InternalNotification } from "@/lib/kenzie/notifications/service";

const kindLabel: Record<InternalNotification["kind"], string> = {
  kenzie_note: "Note from Kenzie",
  reminder: "Reminder",
  chore: "Chore",
  shopping: "Shopping",
  meal: "Meal plan",
  calendar: "Calendar",
};

export function NotificationCenter({ notifications }: { notifications: InternalNotification[] }) {
  const unread = notifications.filter((item) => !item.read).length;
  if (!notifications.length) {
    return <Card><p>You are all caught up. New notes and reminders will appear here.</p></Card>;
  }
  return (
    <div>
      {unread ? (
        <form action={markAllNotificationsRead}>
          <button type="submit">Mark all as read</button>
        </form>
      ) : null}
      <div className="stack">
        {notifications.map((item) => (
          <Card key={item.id}>
            <article aria-label={`${item.read ? "" : "Unread "}${kindLabel[item.kind]}`}>
              <p className="type-supporting">{item.read ? kindLabel[item.kind] : `New · ${kindLabel[item.kind]}`}</p>
              <h3>{item.title}</h3>
              {item.body ? <p>{item.body}</p> : null}
              {item.reminderDueAt ? (
                <p className="type-supporting">
                  Due {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.reminderDueAt))}
                </p>
              ) : null}
              <div>
                {item.destination ? <Link href={item.destination}>Open related page →</Link> : null}
                {!item.read ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="notificationId" value={item.id} />
                    <button type="submit">Mark as read</button>
                  </form>
                ) : null}
              </div>
            </article>
          </Card>
        ))}
      </div>
    </div>
  );
}
