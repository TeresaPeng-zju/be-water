"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { localeCookie, type Locale } from "@/lib/i18n/config";
import { translateText } from "@/lib/i18n/messages";

type LanguageContextValue = {
  locale: Locale;
  changeLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const translatedAttributes = ["aria-label", "aria-description", "placeholder", "title"] as const;

function shouldSkip(node: Node) {
  const element = node.nodeType === Node.ELEMENT_NODE
    ? node as Element
    : node.parentElement;
  return Boolean(element?.closest("script, style, code, pre, [data-no-translate]"));
}

function translateElement(element: Element, locale: Locale) {
  for (const attribute of translatedAttributes) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const next = translateText(current, locale);
    if (next !== current) element.setAttribute(attribute, next);
  }
}

function translateTree(root: Node, locale: Locale) {
  if (locale === "en" || shouldSkip(root)) return;
  if (root.nodeType === Node.TEXT_NODE) {
    const current = root.textContent ?? "";
    const next = translateText(current, locale);
    if (next !== current) root.textContent = next;
    return;
  }
  if (root.nodeType === Node.ELEMENT_NODE) translateElement(root as Element, locale);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (!shouldSkip(node)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const current = node.textContent ?? "";
        const next = translateText(current, locale);
        if (next !== current) node.textContent = next;
      } else {
        translateElement(node as Element, locale);
      }
    }
    node = walker.nextNode();
  }
}

export function LanguageProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    translateTree(document.body, locale);
    if (locale === "en") return;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          translateElement(mutation.target as Element, locale);
          continue;
        }
        if (mutation.type === "characterData") {
          translateTree(mutation.target, locale);
          continue;
        }
        mutation.addedNodes.forEach((node) => translateTree(node, locale));
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatedAttributes],
    });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    changeLocale(nextLocale) {
      if (nextLocale === locale) return;
      document.cookie = `${localeCookie}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
      window.location.reload();
    },
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}
