"use client";

import { Suspense } from "react";
import { AmenityIcon } from "@/components/AmenityIcon";
import { BookingForm } from "@/components/BookingForm";
import { GallerySection } from "@/components/GallerySection";
import { HeroBanner } from "@/components/HeroBanner";
import { Reveal } from "@/components/Reveal";
import { localeFor } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";
import { euros } from "@/lib/pricing";
import { property } from "@/lib/property";

export function HomePage() {
  const { t, lang } = useI18n();
  const locale = localeFor(lang);

  return (
    <>
      <HeroBanner
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        lead={t.hero.lead}
        address={t.hero.address}
        chips={t.hero.chips}
        cta={t.hero.cta}
        secondary={t.hero.secondary}
      />

      <section className="section" id="yacht">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <p className="kicker">{t.yacht.kicker}</p>
              <h2>{t.yacht.title}</h2>
              <p className="intro">{t.yacht.body}</p>
            </div>
          </Reveal>
          <div className="facts">
            {t.yacht.facts.map((fact, index) => (
              <Reveal key={fact.label} delay={index * 80}>
                <div className="fact lift-card">
                  <small>{fact.label}</small>
                  <strong>{fact.value}</strong>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <p className="kicker">{t.amenities.kicker}</p>
              <h2>{t.amenities.title}</h2>
            </div>
          </Reveal>
          <div className="amenity-grid">
            {t.amenities.items.map((item, index) => (
              <Reveal key={item.title} delay={(index % 4) * 70}>
                <article className="card amenity-card lift-card">
                  <AmenityIcon index={index} className="amenity-icon" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <GallerySection
        kicker={t.gallery.kicker}
        title={t.gallery.title}
        lead={t.gallery.lead}
        more={t.gallery.more}
        less={t.gallery.less}
        close={t.gallery.close}
        prev={t.gallery.prev}
        next={t.gallery.next}
      />

      <section className="section alt" id="tarifs">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <p className="kicker">{t.rates.kicker}</p>
              <h2>{t.rates.title}</h2>
              <p className="intro">{t.rates.note}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="price-hero lift-card">
              <small>{t.rates.night}</small>
              <strong>{euros(property.nightlyRateCents, locale)}</strong>
              <span>{t.rates.nightHint}</span>
            </div>
          </Reveal>
          <div className="facts rate-facts">
            {t.rates.rows.map((row, index) => (
              <Reveal key={row.label} delay={index * 70}>
                <div className="fact lift-card">
                  <small>{row.label}</small>
                  <strong>{row.value}</strong>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="two-cols centered-cols">
              <div>
                <h3>{t.rates.includedTitle}</h3>
                <ul>
                  {t.rates.included.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>{t.rates.practicalTitle}</h3>
                <ul>
                  {t.rates.practical.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="calendrier">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <p className="kicker">{t.steps.kicker}</p>
              <h2>{t.steps.title}</h2>
              <p className="intro">{t.steps.lead}</p>
            </div>
          </Reveal>
          <Reveal>
            <ol className="steps stagger">
              {t.steps.items.map((item, index) => (
                <li className="lift-card" key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={140}>
            <Suspense fallback={<p className="hint">…</p>}>
              <BookingForm />
            </Suspense>
          </Reveal>
        </div>
      </section>

      <section className="section alt" id="ladeuze">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <p className="kicker">{t.place.kicker}</p>
              <h2>{t.place.title}</h2>
              <p className="intro">{t.place.body}</p>
            </div>
          </Reveal>

          <div className="place-grid">
            {t.place.highlights.map((spot, index) => (
              <Reveal key={spot.title} delay={index * 80}>
                <article className="place-card lift-card">
                  <div className="place-card-media">
                    <img src={spot.image} alt={spot.alt} loading="lazy" />
                  </div>
                  <div className="place-card-copy">
                    <h3>{spot.title}</h3>
                    <p>{spot.text}</p>
                    <a className="btn outline" href={spot.href} target={spot.href.startsWith("http") ? "_blank" : undefined} rel={spot.href.startsWith("http") ? "noreferrer" : undefined}>
                      {spot.cta}
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={100}>
            <p className="center-action">
              <a className="btn dark" href={property.maps}>
                {t.place.map}
              </a>
            </p>
          </Reveal>
          <Reveal delay={160}>
            <iframe
              className="map-frame"
              title={t.place.map}
              src="https://www.openstreetmap.org/export/embed.html?bbox=3.755%2C50.562%2C3.786%2C50.577&layer=mapnik&marker=50.56945%2C3.770154"
            />
          </Reveal>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <p className="kicker">{t.faq.kicker}</p>
              <h2>{t.faq.title}</h2>
            </div>
          </Reveal>
          <div className="faq">
            {t.faq.items.map((item, index) => (
              <Reveal key={item.q} delay={index * 50}>
                <details>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
