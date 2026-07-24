import { Badge, Card, EmptyState } from "@/components/design-system";
import { deleteVaultDocument, saveVaultDocument } from "@/app/actions/vault";
import { VaultSubmitButton } from "./VaultSubmitButton";
import { vaultCategories, type VaultDocument } from "@/lib/data/vault";
import styles from "./VaultManager.module.css";

function UploadFields({ document }: { document?: VaultDocument }) {
  return <>
    {document ? <input type="hidden" name="documentId" value={document.id} /> : null}
    <label>Title<input name="title" defaultValue={document?.title} required maxLength={160} /></label>
    <label>Category<select name="category" defaultValue={document?.category ?? "Home"}>{vaultCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
    <label>Visibility<select name="visibility" defaultValue={document?.visibility ?? "adults"}><option value="adults">Adults only</option><option value="household">Household</option></select></label>
    <label>Expiration or renewal date<input name="expirationDate" type="date" defaultValue={document?.expirationDate} /></label>
    <label className={styles.wide}>{document ? "Replacement file" : "File"}<input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv" /></label>
    <label className={styles.wide}>Notes<textarea name="notes" rows={3} maxLength={2000} defaultValue={document?.notes} /></label>
  </>;
}

export function VaultManager({ documents, canManage }: { documents: VaultDocument[]; canManage: boolean }) {
  return <div className={styles.manager}>
    {canManage ? <Card><h2 className="type-section-heading">Add to the Family Vault</h2><p className={styles.help}>Files are private, limited to 20 MB, and protected by household permissions.</p><form action={saveVaultDocument} className={styles.form}><UploadFields /><VaultSubmitButton label="Upload securely" /></form></Card> : null}
    {documents.length === 0 ? <EmptyState title="The Family Vault is ready" description="No documents match this view." /> : <ul className={styles.grid}>{documents.map((document) => <li key={document.id}><Card className={styles.document}><div className={styles.heading}><div><Badge variant={document.visibility === "adults" ? "rose" : "sage"}>{document.visibility === "adults" ? "Adults only" : "Household"}</Badge><h2 className="type-card-heading">{document.title}</h2></div><Badge>{document.category}</Badge></div>{document.expirationDate ? <p>Renew or review by <time dateTime={document.expirationDate}>{document.expirationDate}</time></p> : null}{document.notes ? <p>{document.notes}</p> : null}<div className={styles.actions}>{document.storagePath ? <><a href={`/api/vault/${document.id}/preview`} target="_blank" rel="noreferrer">Preview</a><a href={`/api/vault/${document.id}/download`}>Download</a></> : <span>Metadata only</span>}</div>{canManage ? <details><summary>Replace or remove</summary><form action={saveVaultDocument} className={styles.form}><UploadFields document={document} /><VaultSubmitButton label="Replace file" /></form><form action={deleteVaultDocument.bind(null, document.id)}><button className={styles.danger} type="submit">Delete file and metadata</button></form></details> : null}</Card></li>)}</ul>}
  </div>;
}
