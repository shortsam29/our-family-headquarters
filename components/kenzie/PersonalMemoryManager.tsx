import {
  deleteAllPersonalMemories,
  deletePersonalMemory,
  editPersonalMemory,
  pauseAutomaticMemory,
  resumeAutomaticMemory,
} from "@/app/actions/kenzie-memory";
import type { MemorySettings, PersonalMemory } from "@/lib/kenzie/memory/types";
import styles from "./PersonalMemoryManager.module.css";

const labels: Record<PersonalMemory["category"], string> = {
  preference: "Preference",
  dislike: "Dislike",
  communication_preference: "Communication",
  learning_preference: "Learning",
  reminder_preference: "Reminders",
  routine: "Routine",
  hobby: "Hobby",
  favorite: "Favorite",
  personal_context: "Personal context",
  accessibility_preference: "Accessibility",
  relationship_context: "Relationship context",
  temporary_context: "Temporary context",
};

export function PersonalMemoryManager({ settings, memories }: { settings: MemorySettings; memories: PersonalMemory[] }) {
  return (
    <div className={styles.manager}>
      <div className={styles.status}>
        <div>
          <strong>Automatic memory is {settings.enabled ? "on" : "paused"}</strong>
          <p>{settings.enabled
            ? "Kenzie may save concise, useful preferences from new chats. Full conversations are never stored."
            : "Kenzie will not save new personal memories until you turn it back on."}</p>
        </div>
        <form action={settings.enabled ? pauseAutomaticMemory : resumeAutomaticMemory}>
          <button>{settings.enabled ? "Pause automatic memory" : "Resume automatic memory"}</button>
        </form>
      </div>

      {memories.length ? (
        <ul className={styles.list}>
          {memories.map((memory) => (
            <li key={memory.id}>
              <div className={styles.heading}>
                <span>{labels[memory.category]}</span>
                <time dateTime={memory.updatedAt}>Updated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(memory.updatedAt))}</time>
              </div>
              <p>{memory.displayText}</p>
              {memory.expiresAt ? <small>Temporary · expires {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(memory.expiresAt))}</small> : null}
              <div className={styles.controls}>
                <details>
                  <summary>Edit</summary>
                  <form action={editPersonalMemory}>
                    <input type="hidden" name="memoryId" value={memory.id} />
                    <label>What Kenzie should remember<textarea name="displayText" defaultValue={memory.displayText} required maxLength={500} /></label>
                    <button>Save change</button>
                  </form>
                </details>
                <form action={deletePersonalMemory}>
                  <input type="hidden" name="memoryId" value={memory.id} />
                  <button className={styles.delete}>Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className={styles.empty}>Kenzie has not saved any personal memories yet. As you chat, useful preferences and details may appear here.</p>}

      {memories.length ? (
        <details className={styles.deleteAll}>
          <summary>Delete all memories</summary>
          <p>This permanently removes every active personal memory. It does not pause future memory.</p>
          <form action={deleteAllPersonalMemories}>
            <label>Type <strong>delete all</strong> to confirm<input name="confirmation" required pattern="delete all" autoComplete="off" /></label>
            <button>Delete all memories</button>
          </form>
        </details>
      ) : null}
    </div>
  );
}
