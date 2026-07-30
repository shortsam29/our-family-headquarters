import Link from "next/link";
import { archiveKenzieNote, markAllKenzieNotesRead, markKenzieNoteRead } from "@/app/actions/kenzie-notes";
import { KenzieNote } from "@/components/design-system";
import type { KenzieNoteSummary } from "@/lib/kenzie/notes/service";

export function PersonalKenzieNotes({ notes }: { notes: KenzieNoteSummary[] }) {
  if (!notes.length) return <p id="notes-from-kenzie">You are all caught up. New private notes from Kenzie will appear here.</p>;
  const hasUnread = notes.some((note) => !note.read);
  return (
    <div id="notes-from-kenzie">
      {hasUnread ? <form action={markAllKenzieNotesRead}><button type="submit">Mark all notes as read</button></form> : null}
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
              <form action={archiveKenzieNote}>
                <input type="hidden" name="noteId" value={note.id} />
                <button type="submit">Archive note</button>
              </form>
            </>
          )}
        />
      ))}
    </div>
  );
}
