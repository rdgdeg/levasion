"use client";

import { useEffect, useState } from "react";
import { photos } from "@/lib/property";

const SLIDES = [0, 1, 2, 6, 7].map((index) => photos[index]);

export function HeroBanner({
  eyebrow,
  title,
  lead,
  address,
  chips,
  cta,
  secondary,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  address: string;
  chips: string[];
  cta: string;
  secondary: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % SLIDES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="hero" id="accueil">
      <div className="hero-slides" aria-hidden="true">
        {SLIDES.map((photo, slide) => (
          <img
            key={photo.src}
            src={photo.src}
            alt=""
            className={slide === index ? "is-active" : undefined}
          />
        ))}
      </div>
      <div className="hero-shade" />
      <div className="hero-copy hero-animate">
        <p className="kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        <p className="address">{address}</p>
        <div className="chips">
          {chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
        <div className="hero-actions">
          <a className="btn" href="#calendrier">
            {cta}
          </a>
          <a className="btn light" href="#yacht">
            {secondary}
          </a>
        </div>
      </div>
      <div className="hero-dots" role="tablist" aria-label="Photos">
        {SLIDES.map((photo, slide) => (
          <button
            key={photo.src}
            type="button"
            className={slide === index ? "is-active" : undefined}
            aria-label={`${slide + 1}`}
            aria-current={slide === index ? "true" : undefined}
            onClick={() => setIndex(slide)}
          />
        ))}
      </div>
    </section>
  );
}
