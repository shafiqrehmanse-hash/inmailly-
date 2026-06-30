/** Team self-serve bulk link assignment from the pool */
export const LINK_AUTO_ASSIGN = {
  /** Max links assigned per auto-assign click */
  batchSize: 35,
  /** Block auto-assign when member already has this many active (claimed) links */
  maxActiveBeforeBlock: 5,
} as const;

export function autoAssignBlockMessage(activeCount: number) {
  return `You have ${activeCount} active link${activeCount === 1 ? "" : "s"} — please mark them as used before requesting more.`;
}
