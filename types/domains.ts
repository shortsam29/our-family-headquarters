export type DomainSlug =
  | "meals"
  | "shopping"
  | "pets"
  | "contacts"
  | "vehicles"
  | "documents"
  | "finance";

export type DomainRecord = {
  id: string;
  kind: string;
  title: string;
  detail?: string;
  date?: string;
  status?: string;
  notes?: string;
};

export type DomainRoomData = {
  records: DomainRecord[];
  error?: string;
};

export const domainSlugs: DomainSlug[] = [
  "meals",
  "shopping",
  "pets",
  "contacts",
  "vehicles",
  "documents",
  "finance",
];

export function isDomainSlug(value: string): value is DomainSlug {
  return domainSlugs.includes(value as DomainSlug);
}
