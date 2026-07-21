"use client";
import { useEffect, useState } from "react";
import type { BusinessCase } from "@/lib/domain/case";

export function useLocalCases() {
  const [cases, setCases] = useState<BusinessCase[]>([]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCases(JSON.parse(localStorage.getItem("bewater_cases") ?? "[]"));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);
  return cases;
}

