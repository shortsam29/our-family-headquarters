import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Card } from "@/components/design-system";
import styles from "./FeaturePage.module.css";

export function FeaturePage({ children }: { children: ReactNode }) {
  return <main className={styles.page}>{children}</main>;
}

export function FeaturePageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className="type-page-heading">{title}</h1>
      <p className={styles.description}>{description}</p>
    </header>
  );
}

export function FeatureSection({ title, description, children, labelledBy }: { title: string; description?: string; children: ReactNode; labelledBy?: string }) {
  const headingId = labelledBy ?? `feature-${title.toLowerCase().replaceAll(" ", "-").replaceAll("’", "")}`;
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.sectionHeading}>
        <h2 id={headingId} className="type-section-heading">{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ResponsiveGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className={styles.grid} style={{ "--columns": columns } as CSSProperties}>{children}</div>;
}

export function SummaryCard({ title, detail, meta, variant = "default" }: { title: string; detail: ReactNode; meta?: string; variant?: "default" | "sage" | "blush" | "neutral" }) {
  return (
    <Card className={styles.summary} variant={variant}>
      <h3 className="type-card-heading">{title}</h3>
      <p>{detail}</p>
      {meta ? <small className={styles.meta}>{meta}</small> : null}
    </Card>
  );
}

export function DestinationCard({ href, title, description, ownership }: { href: string; title: string; description: string; ownership?: string }) {
  return (
    <Link className={styles.linkCard} href={href}>
      <Card>
        <h3 className="type-card-heading">{title}</h3>
        <p className="type-supporting">{description}</p>
        {ownership ? <small className={styles.meta}>{ownership}</small> : null}
      </Card>
    </Link>
  );
}

export function BackToMore() {
  return <Link className={styles.backLink} href="/more">← Back to More</Link>;
}
