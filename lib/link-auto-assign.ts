/** Team self-serve bulk link assignment from the Usual (normal) pool */
export const LINK_AUTO_ASSIGN = {
  /** Max links assigned per Usual auto-assign click */
  batchSize: 35,
  /** Block Usual auto-assign when member already has this many active (claimed) links */
  maxActiveBeforeBlock: 5,
} as const;

/** Intelligence self-serve assignment */
export const LINK_INTELLIGENCE_ASSIGN = {
  /** Max intelligence links assigned per click */
  batchSize: 20,
  /**
   * Must have fewer than this many active Intelligence links to request more.
   * With 1: member needs 0 active Intel links before getting another batch.
   */
  maxActiveBeforeBlock: 1,
} as const;

export function autoAssignBlockMessage(activeCount: number) {
  return `You have ${activeCount} active link${activeCount === 1 ? "" : "s"} — please mark them as used before requesting more.`;
}

export function intelligenceAssignBlockMessage(activeCount: number) {
  return `You already have ${activeCount} Intelligence link${activeCount === 1 ? "" : "s"}. Please finish those first before requesting more.`;
}
