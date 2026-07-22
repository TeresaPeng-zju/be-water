"use client";

import Lenis from "lenis";
import {Children, useCallback, useLayoutEffect, useRef, type ReactNode} from "react";
import styles from "./scroll-stack.module.css";

type ScrollStackItemProps = {
  children: ReactNode;
  itemClassName?: string;
};

type ScrollStackProps = {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
};

type CardTransform = {
  translateY: number;
  scale: number;
  rotation: number;
  blur: number;
};

export function ScrollStackItem({children, itemClassName = ""}: ScrollStackItemProps) {
  return <div className={`${styles.card} ${itemClassName}`.trim()} data-scroll-stack-card>{children}</div>;
}

export default function ScrollStack({
  children,
  className = "",
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}: ScrollStackProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const lastTransformsRef = useRef(new Map<number, CardTransform>());
  const isUpdatingRef = useRef(false);
  const childCount = Children.count(children);
  const isStaticStack = childCount < 2;

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / Math.max(end - start, 1);
  }, []);

  const parsePercentage = useCallback((value: string, containerHeight: number) => {
    if (value.includes("%")) return (Number.parseFloat(value) / 100) * containerHeight;
    return Number.parseFloat(value);
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {scrollTop: Math.max(0, window.scrollY), containerHeight: window.innerHeight};
    }
    const scroller = scrollerRef.current;
    return {scrollTop: scroller?.scrollTop ?? 0, containerHeight: scroller?.clientHeight ?? 0};
  }, [useWindowScroll]);

  const getElementOffset = useCallback((element: HTMLElement) => {
    if (useWindowScroll) {
      const scroller = scrollerRef.current;
      if (!scroller) return element.offsetTop;

      // offsetTop is layout-based and does not include the transform applied to
      // the card. Reading getBoundingClientRect() here creates a feedback loop:
      // the transform changes the measured top, which changes the next
      // transform and makes the stack flash when returning to its start.
      const scrollerTop = scroller.getBoundingClientRect().top + Math.max(0, window.scrollY);
      return scrollerTop + element.offsetTop;
    }
    return element.offsetTop;
  }, [useWindowScroll]);

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    const {scrollTop, containerHeight} = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);
    const endElement = scrollerRef.current?.querySelector<HTMLElement>("[data-scroll-stack-end]");
    const endElementTop = endElement ? getElementOffset(endElement) : 0;

    let topCardIndex = 0;
    cardsRef.current.forEach((card, index) => {
      const cardTop = getElementOffset(card);
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * index;
      if (scrollTop >= triggerStart) topCardIndex = index;
    });

    cardsRef.current.forEach((card, index) => {
      const cardTop = getElementOffset(card);
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * index;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinEnd = endElementTop - containerHeight / 2;
      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = Math.min(1, baseScale + index * itemScale);
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? index * rotationAmount * scaleProgress : 0;
      const blur = blurAmount && index < topCardIndex ? (topCardIndex - index) * blurAmount : 0;
      const isPinned = scrollTop >= triggerStart && scrollTop <= pinEnd;
      let translateY = 0;

      if (isPinned) translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * index;
      else if (scrollTop > pinEnd) translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * index;

      const nextTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100
      };
      const previous = lastTransformsRef.current.get(index);
      const changed = !previous ||
        Math.abs(previous.translateY - nextTransform.translateY) > 0.1 ||
        Math.abs(previous.scale - nextTransform.scale) > 0.001 ||
        Math.abs(previous.rotation - nextTransform.rotation) > 0.1 ||
        Math.abs(previous.blur - nextTransform.blur) > 0.1;

      if (changed) {
        card.style.transform = `translate3d(0, ${nextTransform.translateY}px, 0) scale(${nextTransform.scale}) rotate(${nextTransform.rotation}deg)`;
        card.style.filter = nextTransform.blur ? `blur(${nextTransform.blur}px)` : "";
        lastTransformsRef.current.set(index, nextTransform);
      }

      if (index === cardsRef.current.length - 1) {
        const isInView = scrollTop >= triggerStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView) stackCompletedRef.current = false;
      }
    });

    isUpdatingRef.current = false;
  }, [baseScale, blurAmount, calculateProgress, getElementOffset, getScrollData, itemScale, itemStackDistance, onStackComplete, parsePercentage, rotationAmount, scaleEndPosition, stackPosition]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-scroll-stack-card]"));
    const transformsCache = lastTransformsRef.current;
    const motionDisabled = isStaticStack || window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(max-width: 720px)").matches;
    cardsRef.current = cards;
    cards.forEach((card, index) => {
      card.style.marginBottom = index < cards.length - 1 ? `${motionDisabled ? 18 : itemDistance}px` : "0";
      card.style.transition = `filter ${scaleDuration}s ease`;
    });

    if (!motionDisabled) {
      const lenis = useWindowScroll
        ? new Lenis({duration: 1.2, smoothWheel: true, touchMultiplier: 2, wheelMultiplier: 1, lerp: 0.1, syncTouch: true})
        : new Lenis({wrapper: scroller, content: scroller.querySelector<HTMLElement>(`.${styles.inner}`) ?? undefined, duration: 1.2, smoothWheel: true, touchMultiplier: 2, wheelMultiplier: 1, lerp: 0.1, syncTouch: true});
      lenis.on("scroll", updateCardTransforms);
      const frame = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(frame);
      };
      animationFrameRef.current = requestAnimationFrame(frame);
      lenisRef.current = lenis;
      updateCardTransforms();
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      animationFrameRef.current = null;
      stackCompletedRef.current = false;
      cardsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [childCount, isStaticStack, itemDistance, scaleDuration, updateCardTransforms, useWindowScroll]);

  return (
    <div className={`${styles.scroller} ${useWindowScroll ? "" : styles.contained} ${isStaticStack ? styles.staticStack : ""} ${className}`.trim()} ref={scrollerRef}>
      <div className={styles.inner}>
        {children}
        <div className={styles.end} data-scroll-stack-end/>
      </div>
    </div>
  );
}
