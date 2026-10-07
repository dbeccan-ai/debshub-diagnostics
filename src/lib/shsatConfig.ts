// Single source of truth for SHSAT exam facts, dates, labels and taxonomy.
// Update dates/structure here only; every SHSAT screen reads from this file.

export const SHSAT_CYCLE = {
  year: 2026,
  registrationOpens: "2026-10-06",
  registrationDeadline: "2026-10-30",
  testDates: [
    { date: "2026-11-14", label: "Saturday, November 14, 2026" },
    { date: "2026-11-15", label: "Sunday, November 15, 2026" },
    { date: "2026-11-18", label: "Wednesday, November 18, 2026 (school-day administration)" },
    { date: "2026-11-21", label: "Saturday, November 21, 2026" },
  ],
} as const;

export const SHSAT_STRUCTURE = {
  totalQuestions: 100,
  elaQuestions: 50,
  mathQuestions: 50,
  minutes: 180,
  format: "Digital, computer-adaptive",
  elaParts: ["Reading Comprehension", "Revising/Editing"],
  mathParts: [
    "Ratios and proportional relationships",
    "The number system",
    "Expressions, equations, and inequalities",
    "Statistics and probability",
    "Geometry",
    "Complex multi-step application",
  ],
} as const;

export function formatLongDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export const READINESS_DOMAINS = [
  { key: "A", name: "Academic Foundation", blurb: "Mastery of the tested skills and the prerequisite skills 2–3 instructional levels beneath them." },
  { key: "B", name: "Advanced Application", blurb: "Applying skills to unfamiliar, multi-step, mixed-domain SHSAT problems." },
  { key: "C", name: "Strategic Execution", blurb: "Choosing efficient approaches, managing constraints, and avoiding predictable error patterns." },
  { key: "D", name: "Performance Endurance", blurb: "Sustaining accuracy and pacing across a 180-minute, 100-question exam." },
] as const;

export const PLACEMENTS = [
  { key: "shsat_ready", label: "SHSAT Ready" },
  { key: "shsat_developing", label: "SHSAT Developing" },
  { key: "shsat_foundation", label: "SHSAT Foundation" },
  { key: "long_range_pathway", label: "Long-Range SHSAT Pathway" },
] as const;
export type PlacementKey = (typeof PLACEMENTS)[number]["key"];

export const PATHWAYS = [
  { key: "testing_this_november", label: "Testing this November" },
  { key: "preparing_next_year", label: "Preparing for next year" },
  { key: "long_range_6_7", label: "Long-range Grade 6–7 pathway" },
] as const;
export type PathwayKey = (typeof PATHWAYS)[number]["key"];

export const GRADES = [
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "First-time Grade 9" },
] as const;

export const SPECIALIZED_HIGH_SCHOOLS = [
  "Bronx High School of Science",
  "Brooklyn Latin School",
  "Brooklyn Technical High School",
  "High School for Math, Science and Engineering at City College",
  "High School of American Studies at Lehman College",
  "Queens High School for the Sciences at York College",
  "Staten Island Technical High School",
  "Stuyvesant High School",
  "Undecided",
] as const;

export const PERFORMANCE_BANDS = ["Level 1", "Level 2", "Level 3", "Level 4", "Not sure"] as const;

export const ITEM_SOURCE_TYPES = [
  { key: "debs_proprietary", label: "D.E.Bs proprietary" },
  { key: "official_style_practice", label: "Official-style practice" },
  { key: "legacy_blueprint_reference", label: "Legacy blueprint reference" },
] as const;

type Tax = { section: "ELA" | "Math"; domain: string; skills: string[] };
export const SHSAT_TAXONOMY: Tax[] = [
  { section: "ELA", domain: "Reading Comprehension", skills: ["Central idea", "Supporting evidence", "Inference", "Author's purpose", "Point of view", "Structure", "Vocabulary in context", "Figurative language", "Relationship between ideas", "Informational text analysis", "Literary text analysis", "Synthesis", "Evidence-based interpretation"] },
  { section: "ELA", domain: "Revising/Editing", skills: ["Grammar/conventions", "Verb tense/agreement", "Pronoun clarity/agreement", "Punctuation", "Sentence structure", "Concision/precision", "Transitions", "Organization", "Supporting detail", "Introduction/conclusion", "Logical development", "Sentence placement/reordering"] },
  { section: "Math", domain: "Number & Operations", skills: ["Fractions", "Decimals", "Percentages", "Signed/rational numbers", "Order of operations", "Exponents/roots", "Divisibility/factors/multiples"] },
  { section: "Math", domain: "Ratios / Proportions / Rates", skills: ["Unit rates", "Percent change", "Scale"] },
  { section: "Math", domain: "Algebraic Reasoning", skills: ["Equations/inequalities", "Expressions/substitution/simplifying", "Patterns/functions", "Coordinate relationships"] },
  { section: "Math", domain: "Geometry & Measurement", skills: ["Angle relationships", "Triangles/polygons/circles", "Coordinate geometry", "Perimeter/area/surface area/volume", "Transformations/composite figures/spatial reasoning"] },
  { section: "Math", domain: "Statistics & Probability", skills: ["Mean/median/range", "Distributions", "Tables/graphs", "Probability"] },
  { section: "Math", domain: "Advanced Application", skills: ["Mixed-domain multi-step modeling", "Unfamiliar representations", "Constraint reasoning", "Efficient-solution selection"] },
];

export const SHSAT_CHECKLIST = [
  { label: "Exam blueprint", done: true },
  { label: "Taxonomy", done: true },
  { label: "Intake / Entry Gate", done: true },
  { label: "Proprietary item loading", done: false },
  { label: "Vertical prerequisite tagging", done: false },
  { label: "Calibration", done: false },
  { label: "Adaptive routing logic", done: false },
  { label: "Full-length simulation", done: false },
  { label: "Parent report", done: false },
];
