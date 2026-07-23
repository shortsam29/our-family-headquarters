import { notFound } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  DecorativeIllustrationFrame,
  EmptyState,
  FamilyMemberBadge,
  IconButton,
  Input,
  KenzieNote,
  PageHeader,
  SectionCard,
  SectionHeader,
  Select,
  Textarea,
} from "@/components/design-system";
import styles from "./page.module.css";

const colors = [
  ["Warm canvas", "var(--color-warm-canvas)"],
  ["Soft white", "var(--color-soft-white)"],
  ["Light sage", "var(--color-light-sage)"],
  ["Sage", "var(--color-sage)"],
  ["Deep olive", "var(--color-deep-olive)"],
  ["Dusty rose", "var(--color-dusty-rose)"],
  ["Pale blush", "var(--color-pale-blush)"],
  ["Warm taupe", "var(--color-warm-taupe)"],
  ["Muted blue-gray", "var(--color-muted-blue-gray)"],
] as const;

function PlaceholderArtwork() {
  return (
    <div aria-hidden="true" className={styles.placeholderArtwork}>
      <span />
      <span />
      <span />
    </div>
  );
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Internal preview"
        title="Design system"
        description="A development-only reference for the shared visual foundation. Examples are structural and do not represent future feature pages."
      />

      <section className={styles.section}>
        <SectionHeader title="Typography" description="Interface and brand type roles at their intended scale." />
        <Card className={styles.typeStack}>
          <p className="type-brand-title">Brand title</p>
          <p className="type-display">Display heading</p>
          <p className="type-page-heading">Page heading</p>
          <p className="type-section-heading">Section heading</p>
          <p className="type-card-heading">Card heading</p>
          <p className="type-body">Body text supports comfortable, sustained reading.</p>
          <p className="type-supporting">Supporting text provides useful secondary context.</p>
          <p className="type-label">Field label</p>
          <p className="type-caption">Caption text</p>
        </Card>
      </section>

      <section className={styles.section}>
        <SectionHeader title="Color foundation" description="Muted palette tokens used through semantic roles." />
        <div className={styles.swatchGrid}>
          {colors.map(([name, color]) => (
            <div className={styles.swatchCard} key={name}>
              <span className={styles.swatch} style={{ background: color }} />
              <strong>{name}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="Actions" description="Comfortable targets with consistent focus, hover, active, and disabled behavior." />
        <div className={styles.inlineExamples}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <IconButton aria-label="Add example">+</IconButton>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="Forms" description="Semantic labels, supporting text, error states, and comfortable controls." />
        <Card className={styles.formGrid}>
          <Input id="preview-name" label="Input" placeholder="Example value" supportingText="Supporting guidance belongs here." />
          <Select defaultValue="sage" id="preview-select" label="Select">
            <option value="sage">Sage</option>
            <option value="rose">Dusty rose</option>
          </Select>
          <Textarea id="preview-notes" label="Textarea" placeholder="Add a short note" />
          <Input error="Review this example field." id="preview-error" label="Error state" />
          <Input disabled id="preview-disabled" label="Disabled input" value="Unavailable" readOnly />
        </Card>
      </section>

      <section className={styles.section}>
        <SectionHeader title="Badges and family members" />
        <div className={styles.inlineExamples}>
          <Badge>Neutral</Badge>
          <Badge variant="sage">Sage</Badge>
          <Badge variant="rose">Rose</Badge>
          <Badge variant="blue">Blue-gray</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <FamilyMemberBadge initials="FM" name="Family member" detail="Example" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="Cards" description="Reusable surfaces for different levels of warmth and emphasis." />
        <div className={styles.cardGrid}>
          <SectionCard title="Default card" description="Elevated soft-white surface." />
          <SectionCard title="Soft sage" description="Calm contextual surface." variant="sage" />
          <SectionCard title="Soft blush" description="Warm accent surface." variant="blush" />
          <SectionCard title="Warm neutral" description="Quiet contrasting surface." variant="neutral" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="Illustration and empty states" description="Frames reserve consistent space for future approved custom artwork." />
        <div className={styles.twoColumn}>
          <DecorativeIllustrationFrame decorative cornerGraphic={<PlaceholderArtwork />}>
            <p className="type-supporting">Decorative illustration frame</p>
          </DecorativeIllustrationFrame>
          <EmptyState
            title="Nothing here yet"
            description="Empty states explain what belongs here and offer a clear next step."
            artwork={
              <DecorativeIllustrationFrame decorative variant="empty">
                <PlaceholderArtwork />
              </DecorativeIllustrationFrame>
            }
            action={<Button variant="secondary">Example action</Button>}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="Kenzie note shell" description="A copy-neutral visual container reserved for future Kenzie messages." />
        <KenzieNote
          title="Optional note title"
          message={<p className="type-body">Message content is supplied by the feature using this shell.</p>}
          graphic={<PlaceholderArtwork />}
          signature={<span>Optional signature area</span>}
        />
      </section>
    </main>
  );
}
