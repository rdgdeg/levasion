"use client";

import { useI18n } from "@/lib/i18n";

type DocKey = "legal" | "privacy" | "cookies" | "terms";

export function LegalDoc({ doc }: { doc: DocKey }) {
  const { t } = useI18n();
  const page = t.pages[doc];
  return (
    <div className="page narrow legal">
      <h1>{page.title}</h1>
      {page.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}
