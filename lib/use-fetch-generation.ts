import { useCallback, useRef } from "react";

/** Ignore stale async responses when page/filter changes quickly. */
export function useFetchGeneration() {
  const generation = useRef(0);

  const nextGeneration = useCallback(() => {
    generation.current += 1;
    return generation.current;
  }, []);

  const isLatest = useCallback((gen: number) => generation.current === gen, []);

  return { nextGeneration, isLatest };
}
