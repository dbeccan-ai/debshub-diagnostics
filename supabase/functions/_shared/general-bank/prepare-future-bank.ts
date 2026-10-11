import { readCanonicalTags } from "../general-item-tags.ts";

interface SourceItem { id: string; question: string; [key: string]: unknown }
interface Review { items: { id: string; expected_question: string; expected_original: SourceItem; canonical_tags: unknown }[] }
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
};
/** Explicitly approved future authoring only. Caller inserts a NEW version; never use as a historical overlay. */
export function prepareFutureBank(original: SourceItem[], review: Review, approved: boolean): SourceItem[] {
  if (!approved) throw new Error("Owner approval required before preparing a future bank");
  if (original.length !== review.items.length || new Set(original.map((q) => q.id)).size !== original.length ||
      new Set(review.items.map((q) => q.id)).size !== review.items.length) throw new Error("Bank IDs/count do not match review");
  return original.map((q) => {
    const mapping = review.items.find((x) => x.id === q.id);
    const tags = readCanonicalTags(mapping?.canonical_tags);
    if (!mapping || mapping.expected_question !== q.question || stable(mapping.expected_original) !== stable(q) || !tags) throw new Error(`Unreviewed item or content/key drift: ${q.id}`);
    return { ...q, canonical_tags: tags };
  });
}