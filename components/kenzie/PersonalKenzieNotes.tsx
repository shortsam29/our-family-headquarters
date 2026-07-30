import Link from "next/link";
import { markKenzieNoteRead } from "@/app/actions/kenzie-notes";
import { KenzieNote } from "@/components/design-system";
import type { KenzieNoteSummary } from "@/lib/kenzie/notes/service";

export function PersonalKenzieNotes({ notes }: { notes: KenzieNoteSummary[] }) {
  if (!notes.length) return <p id="notes-from-kenzie">Kenzie has not left you a personal note yet.</p>;
  return (
    <div id="notes-from-kenzie">
      {notes.map((note) => (
        <KenzieNote
          key={note.id}
          title={`${note.read ? "" : "New — "}${note.title}`}
          message={(
            <>
              <p>{note.message}</p>
              <p className="type-supporting">
                {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(note.createdAt))}
              </p>
              {note.destination ? <p><Link href={note.destination}>Open related page →</Link></p> : null}
              {!note.read ? (
                <form action={markKenzieNoteRead}>
                  <input type="hidden" name="noteId" value={note.id} />
                  <button type="submit">Mark as read</button>
                </form>
              ) : null}
            </>
          )}
        />
      ))}
    </div>
  );
}
