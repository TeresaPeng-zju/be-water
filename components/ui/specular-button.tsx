"use client";

import {type ButtonHTMLAttributes, type PointerEvent} from "react";
import styles from "./specular-button.module.css";

export function SpecularButton({
  children,
  className = "",
  onPointerMove,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const style = event.currentTarget.style;
    style.setProperty("--specular-x", `${event.clientX - rect.left}px`);
    style.setProperty("--specular-y", `${event.clientY - rect.top}px`);
    onPointerMove?.(event);
  }

  return <button
    {...props}
    className={`${styles.button}${className ? ` ${className}` : ""}`}
    onPointerMove={handlePointerMove}
  >
    <span className={styles.glow} aria-hidden="true"/>
    <span className={styles.label}>{children}</span>
  </button>;
}
