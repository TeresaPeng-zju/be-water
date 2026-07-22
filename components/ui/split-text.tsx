"use client";

import {useEffect, useRef, useState, type CSSProperties} from "react";
import {useGSAP} from "@gsap/react";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {SplitText as GSAPSplitText} from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

const defaultFrom: gsap.TweenVars = {opacity: 0, y: 32};
const defaultTo: gsap.TweenVars = {opacity: 1, y: 0};

type SplitTextProps = {
  text: string;
  className?: string;
  delay?: number;
  startDelay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties["textAlign"];
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  onLetterAnimationComplete?: () => void;
};

type SplitElement = HTMLElement & {_rbsplitInstance?: GSAPSplitText | null};

export function SplitText({
  text,
  className = "",
  delay = 50,
  startDelay = 0,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = defaultFrom,
  to = defaultTo,
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "left",
  tag = "p",
  onLetterAnimationComplete
}: SplitTextProps) {
  const ref = useRef<SplitElement>(null);
  const animationCompletedRef = useRef(false);
  const animatedTextRef = useRef(text);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) setFontsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animatedTextRef.current !== text) {
        animatedTextRef.current = text;
        animationCompletedRef.current = false;
      }
      if (animationCompletedRef.current) return;

      const element = ref.current;
      element._rbsplitInstance?.revert();
      element._rbsplitInstance = null;
      element.textContent = text;

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? Number.parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch?.[2] || "px";
      const sign = marginValue === 0 ? "" : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      const splitInstance = new GSAPSplitText(element, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,
        onSplit: (self) => {
          const targets = splitType.includes("chars") && self.chars.length
            ? self.chars
            : splitType.includes("words") && self.words.length
              ? self.words
              : self.lines;

          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            gsap.set(targets, to);
            animationCompletedRef.current = true;
            onCompleteRef.current?.();
            return;
          }

          return gsap.fromTo(targets, {...from}, {
            ...to,
            delay: startDelay,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: {
              trigger: element,
              start,
              once: true,
              fastScrollEnd: true,
              anticipatePin: 0.4
            },
            onComplete: () => {
              animationCompletedRef.current = true;
              onCompleteRef.current?.();
            },
            willChange: "transform, opacity",
            force3D: true
          });
        }
      });

      element._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === element) trigger.kill();
        });
        splitInstance.revert();
        element._rbsplitInstance = null;
      };
    },
    {
      dependencies: [text, delay, startDelay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin, fontsLoaded],
      scope: ref
    }
  );

  const style: CSSProperties = {
    display: "inline-block",
    overflow: "hidden",
    textAlign,
    whiteSpace: "pre-line",
    overflowWrap: "break-word",
    willChange: "transform, opacity"
  };

  const Tag = tag;
  return <Tag ref={ref as never} style={style} className={`split-parent ${className}`}>{text}</Tag>;
}
