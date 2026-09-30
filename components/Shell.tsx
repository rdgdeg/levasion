"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { property } from "@/lib/property";
import type { Lang } from "@/lib/copy";

function Mark() {
  return (
    <svg className="brand-mark" viewBox="0 0 38 38" aria-hidden="true">
      <path d="M7 24c4-6 8-6 12 0s8 6 12 0" fill="none" stroke="#e7d3a4" strokeWidth="1.6" />
      <path d="M19 10l6 12H13l6-12z" fill="none" stroke="#f6f1e6" strokeWidth="1.4" />
    </svg>
  );
}

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cookieOk, setCookieOk] = useState(true);
  const hideFloat = pathname.startsWith("/reserver") || pathname.startsWith("/admin");

  useEffect(() => {
    setCookieOk(window.localStorage.getItem("evasion-cookie") === "1");
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    const pending = window.sessionStorage.getItem("evasion-scroll");
    const hash = pending || window.location.hash;
    if (pending) window.sessionStorage.removeItem("evasion-scroll");
    if (!hash) return;
    const timer = window.setTimeout(() => {
      if (hash.startsWith("#")) window.history.replaceState(null, "", hash);
      scrollToHash(hash);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function goToSection(href: string) {
    const hashIndex = href.indexOf("#");
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "#accueil";
    setOpen(false);

    if (pathname === "/") {
      window.history.pushState(null, "", hash);
      scrollToHash(hash);
      return;
    }

    window.sessionStorage.setItem("evasion-scroll", hash);
    router.push("/");
  }

  const links = [
    { href: "/#accueil", label: t.nav.home },
    { href: "/#yacht", label: t.nav.yacht },
    { href: "/#galerie", label: t.nav.gallery },
    { href: "/#tarifs", label: t.nav.rates },
    { href: "/#calendrier", label: t.nav.book },
    { href: "/#ladeuze", label: t.nav.place },
    { href: "/#faq", label: t.nav.faq },
  ];

  return (
    <>
      <a className="skip" href="#contenu">
        {t.skip}
      </a>
      <header className="shell-header">
        <Link
          href="/#accueil"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            goToSection("/#accueil");
          }}
        >
          <Mark />
          <strong>L&apos;évasion</strong>
        </Link>
        <nav className={open ? "nav open" : "nav"} aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(event) => {
                event.preventDefault();
                goToSection(link.href);
              }}
            >
              {link.label}
            </Link>
          ))}
          <div className="lang nav-lang" role="group" aria-label={t.langName}>
            {(["fr", "nl", "en"] as Lang[]).map((code) => (
              <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
        <div className="header-actions">
          <Link
            className="btn"
            href="/#calendrier"
            onClick={(event) => {
              event.preventDefault();
              goToSection("/#calendrier");
            }}
          >
            {t.nav.book}
          </Link>
          <div className="lang header-lang" role="group" aria-label={t.langName}>
            {(["fr", "nl", "en"] as Lang[]).map((code) => (
              <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="menu-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            Menu
          </button>
        </div>
      </header>
      <main id="contenu">{children}</main>
      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <h2>L&apos;évasion</h2>
            <p>
              {property.address}, {property.postalCode} {property.locality}
              <br />
              {property.region}, {property.country}
            </p>
            <p>
              <a href={property.phoneHref}>{property.phone}</a>
              <br />
              <a href={`mailto:${property.email}`}>{property.email}</a>
            </p>
          </div>
          <div>
            <h3>{t.footer.explore}</h3>
            <ul>
              {links.slice(1).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(event) => {
                      event.preventDefault();
                      goToSection(link.href);
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{t.footer.follow}</h3>
            <ul>
              <li>
                <a href={property.facebook}>{t.footer.facebook}</a>
              </li>
              <li>
                <a href={property.instagram}>{t.footer.instagram}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="legal-row">
          <span>
            {property.license} · {property.operator}
          </span>
          <span className="legal-links">
            <Link href="/mentions-legales">{t.footer.legal}</Link>
            <Link href="/confidentialite">{t.footer.privacy}</Link>
            <Link href="/cookies">{t.footer.cookies}</Link>
            <Link href="/conditions">{t.footer.terms}</Link>
            <Link href="/admin">{t.footer.admin}</Link>
          </span>
        </div>
        <p className="credit-row">
          <a href={t.footer.creditHref} target="_blank" rel="noreferrer">
            {t.footer.credit}
          </a>
        </p>
      </footer>
      {!cookieOk && (
        <div className="cookie" role="dialog" aria-label={t.cookie.title}>
          <div className="cookie-copy">
            <strong>{t.cookie.title}</strong>
            <p>{t.cookie.text}</p>
            <Link href="/cookies">{t.cookie.more}</Link>
          </div>
          <button
            className="btn"
            type="button"
            onClick={() => {
              window.localStorage.setItem("evasion-cookie", "1");
              setCookieOk(true);
            }}
          >
            {t.cookie.accept}
          </button>
        </div>
      )}
      {!hideFloat && (
        <Link
          className="float-cta btn"
          href="/#calendrier"
          onClick={(event) => {
            event.preventDefault();
            goToSection("/#calendrier");
          }}
        >
          {t.float}
        </Link>
      )}
    </>
  );
}
