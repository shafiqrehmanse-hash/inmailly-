"use client";

import { useCallback, useEffect, useState } from "react";
import { getVisitedLinkIds, markLinkVisited } from "@/lib/visited-links";

export function useVisitedLinks() {
  const [visited, setVisited] = useState<Set<string>>(new Set());

  useEffect(() => {
    setVisited(getVisitedLinkIds());
  }, []);

  const markVisited = useCallback((id: string) => {
    setVisited(markLinkVisited(id));
  }, []);

  const isVisited = useCallback((id: string) => visited.has(id), [visited]);

  return { isVisited, markVisited, visitedCount: visited.size };
}
