"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { photos } from "@/lib/property";

const PREVIEW = 6;

type Props = {
  kicker: string;
  title: string;
  lead: string;
  more: string;
  less: string;
  close: string;
  prev: string;
  next: string;
};

export function GallerySection({ kicker, title, lead, more, less, close, prev, next }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const preview = photos.slice(0, PREVIEW);
  const extra = photos.slice(PREVIEW);

  useEffect(() => {
    if (active === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") setActive((value) => (value === null ? value : (value + 1) % photos.length));
      if (event.key === "ArrowLeft") setActive((value) => (value === null ? value : (value - 1 + photos.length) % photos.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  function renderGrid(items: typeof photos[number][], offset: number) {
    return (
      <div className="gallery-masonry">
        {items.map((photo, index) => {
          const absolute = offset + index;
          return (
            <button
              key={photo.src}
              type="button"
              className={`masonry-item span-${(absolute % 5) + 1}`}
              onClick={() => setActive(absolute)}
            >
              <img src={photo.src} alt={photo.alt} loading={absolute < PREVIEW ? "eager" : "lazy"} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <section className="section" id="galerie">
      <div className={`wrap gallery-wrap${open ? " is-open" : ""}`}>
        <Reveal>
          <div className="section-head">
            <p className="kicker">{kicker}</p>
            <h2>{title}</h2>
            <p className="intro">{lead}</p>
          </div>
        </Reveal>

        <Reveal delay={80}>{renderGrid(preview, 0)}</Reveal>

        {extra.length > 0 && (
          <>
            <div className="gallery-more">
              <div className="gallery-more-inner">{renderGrid(extra, PREVIEW)}</div>
            </div>
            <Reveal delay={100}>
              <p className="center-action gallery-toggle-wrap">
                <button
                  className="btn outline"
                  type="button"
                  aria-expanded={open}
                  onClick={() => {
                    setOpen((value) => {
                      const nextOpen = !value;
                      if (!nextOpen) {
                        document.getElementById("galerie")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                      return nextOpen;
                    });
                  }}
                >
                  {open ? less : more}
                </button>
              </p>
            </Reveal>
          </>
        )}
      </div>

      {active !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={photos[active].alt}
          onClick={(event) => {
            if (event.target === event.currentTarget) setActive(null);
          }}
        >
          <button className="lightbox-close" type="button" aria-label={close} onClick={() => setActive(null)}>
            ×
          </button>
          <button
            className="lightbox-nav lightbox-prev"
            type="button"
            aria-label={prev}
            onClick={() => setActive((active - 1 + photos.length) % photos.length)}
          >
            ‹
          </button>
          <img src={photos[active].src} alt={photos[active].alt} />
          <button
            className="lightbox-nav lightbox-next"
            type="button"
            aria-label={next}
            onClick={() => setActive((active + 1) % photos.length)}
          >
            ›
          </button>
          <p className="lightbox-count">
            {active + 1} / {photos.length}
          </p>
        </div>
      )}
    </section>
  );
}
