"use client";
import { useCallback, useEffect, useState } from "react";
import type { ServiceTemplate } from "@/lib/domain/service";

export function useLocalServices() {
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const refresh = useCallback(() => setServices(JSON.parse(localStorage.getItem("bewater_services") ?? "[]")), []);
  useEffect(() => { const id = setTimeout(refresh, 0); return () => clearTimeout(id); }, [refresh]);
  return { services, refresh };
}
