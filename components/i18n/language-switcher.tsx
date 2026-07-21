"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { useLanguage } from "./language-provider";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, changeLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function switchTo(nextLocale: Locale) {
    setOpen(false);
    changeLocale(nextLocale);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-[34px] items-center gap-1.5 rounded-[10px] px-2.5 text-[14px] font-medium text-[var(--muted)] outline-none transition hover:bg-white/55 hover:text-[var(--ink)] focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
        aria-label="Switch language"
        aria-expanded={open}
        aria-controls={menuId}
      >
        {locale === "en" ? "English" : "中文"}
        <ChevronDown aria-hidden className="size-3.5" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Language"
          className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-[var(--line)] bg-white/95 p-1.5 shadow-[0_16px_40px_rgba(23,33,31,0.14)] backdrop-blur-xl"
        >
          {locales.map((item) => (
            <button
              key={item}
              type="button"
              role="menuitemradio"
              aria-checked={item === locale}
              onClick={() => switchTo(item)}
              className={cn(
                "flex min-h-9 w-full items-center rounded-lg px-3 text-left text-xs outline-none transition hover:bg-[#f2f5f3] focus-visible:ring-4 focus-visible:ring-[var(--focus)]",
                item === locale ? "font-semibold text-[var(--brand)]" : "text-[var(--ink)]",
              )}
            >
              {localeNames[item]}
              {item === locale ? <Check aria-hidden className="ml-auto size-3.5" strokeWidth={2.5} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
