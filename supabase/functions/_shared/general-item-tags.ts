/** Canonical metadata for newly authored/versioned general Math/ELA items. No database writes. */
export interface CanonicalItemTags {
  version: 1;
  subject: "math" | "ela";
  domain: string;
  primary_skill: string;
  secondary_skills: string[];
}
export function readCanonicalTags(value: unknown): CanonicalItemTags | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || (v.subject !== "math" && v.subject !== "ela") ||
      typeof v.domain !== "string" || !v.domain.trim() ||
      typeof v.primary_skill !== "string" || !v.primary_skill.trim() ||
      !Array.isArray(v.secondary_skills) || !v.secondary_skills.every((s) => typeof s === "string" && s.trim())) return null;
  const secondary = v.secondary_skills as string[];
  if (new Set(secondary).size !== secondary.length || secondary.includes(v.primary_skill)) return null;
  return { version: 1, subject: v.subject, domain: v.domain, primary_skill: v.primary_skill, secondary_skills: [...secondary] };
}