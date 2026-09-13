// D.E.Bs TACHS Readiness Diagnostic — sample content bank (pass 1).
// Original questions authored for the D.E.Bs pilot. Not affiliated with TACHS or its publisher.
// Visuals are programmatic SVG specs rendered client-side by <TachsVisual/>.

export type VisualItem =
  | { t: "circle"; cx: number; cy: number; r: number; fill?: string; stroke?: string; dash?: boolean }
  | { t: "rect"; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; rot?: number; dash?: boolean }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; stroke?: string; dash?: boolean; arrow?: boolean }
  | { t: "text"; x: number; y: number; s: string; size?: number }
  | { t: "shape"; kind: "triangle" | "diamond" | "star" | "hexagon" | "pentagon" | "arrow" | "plus" | "square" | "circle"; cx: number; cy: number; size: number; fill?: string; stroke?: string; rot?: number; dash?: boolean };

export interface VisualSpec { w: number; h: number; items: VisualItem[] }

export interface Choice { key: string; text?: string; visual?: VisualSpec }

export interface BankQuestion {
  code: string;
  section_key: SectionKey;
  skill: string;
  difficulty: 1 | 2 | 3;
  stem: string;
  passage_id?: string;
  passage_title?: string;
  passage_text?: string;
  visual?: VisualSpec;
  visual_alt?: string;
  choices: Choice[];
  correct_key: string;
  rationale: string;
}

export type SectionKey =
  | "reading"
  | "written_expression"
  | "mathematics"
  | "figure_matrices"
  | "paper_folding"
  | "figure_classification";

export interface BlueprintSection {
  key: SectionKey;
  name: string;
  order: number;
  item_count: number;
  time_minutes: number;
  calculator: boolean;
  break_after_minutes: number;
  skill_quotas: Record<string, number>;
  description: string;
}

export const BLUEPRINT_V1 = {
  version: 1,
  name: "D.E.Bs TACHS Readiness Diagnostic — Pilot v1",
  notes:
    "Section counts and times are D.E.Bs working allocations for the pilot, not official TACHS specifications.",
  sections: [
    {
      key: "reading", name: "Reading", order: 1, item_count: 50, time_minutes: 30, calculator: false, break_after_minutes: 0,
      description: "Passages with questions on main idea, inference, vocabulary in context, and text structure.",
      skill_quotas: { main_idea: 12, inference: 14, vocabulary_in_context: 12, text_structure: 12 },
    },
    {
      key: "written_expression", name: "Written Expression", order: 2, item_count: 50, time_minutes: 25, calculator: false, break_after_minutes: 0,
      description: "Usage, punctuation and capitalization, sentence structure, and paragraph organization.",
      skill_quotas: { grammar_usage: 14, punctuation_capitalization: 12, sentence_structure: 12, organization: 12 },
    },
    {
      key: "mathematics", name: "Mathematics", order: 3, item_count: 50, time_minutes: 40, calculator: true, break_after_minutes: 5,
      description: "Number operations, fractions/decimals/percent, algebra and patterns, geometry and measurement, data.",
      skill_quotas: { number_operations: 12, fractions_decimals_percent: 10, algebra_patterns: 10, geometry_measurement: 10, data_probability: 8 },
    },
    {
      key: "figure_matrices", name: "Figure Matrices", order: 4, item_count: 20, time_minutes: 12, calculator: false, break_after_minutes: 1,
      description: "Find the rule across rows and columns of a 3 x 3 grid and choose the missing figure.",
      skill_quotas: { rotation: 5, shading: 5, count: 5, size_change: 5 },
    },
    {
      key: "paper_folding", name: "Paper Folding", order: 5, item_count: 15, time_minutes: 12, calculator: false, break_after_minutes: 1,
      description: "A paper is folded and hole-punched. Choose how it looks when unfolded.",
      skill_quotas: { single_fold: 8, double_fold: 7 },
    },
    {
      key: "figure_classification", name: "Figure Classification", order: 6, item_count: 15, time_minutes: 11, calculator: false, break_after_minutes: 0,
      description: "Three figures share a rule. Choose the answer that belongs with them.",
      skill_quotas: { shape_attribute: 5, count_attribute: 5, shading_attribute: 5 },
    },
  ] as BlueprintSection[],
};

// ---------- visual helpers ----------
const NAVY = "#1C2D5A";
const shape = (kind: Extract<VisualItem, { t: "shape" }>["kind"], cx: number, cy: number, size: number, extra: Partial<Extract<VisualItem, { t: "shape" }>> = {}): VisualItem =>
  ({ t: "shape", kind, cx, cy, size, stroke: NAVY, fill: "none", ...extra });

/** 3x3 matrix, 240x240, cells 80px; cell(i) 0..8 with the 9th as "?" */
function matrix(cells: (VisualItem[] | null)[]): VisualSpec {
  const items: VisualItem[] = [];
  for (let i = 0; i < 9; i++) {
    const x = (i % 3) * 80, y = Math.floor(i / 3) * 80;
    items.push({ t: "rect", x: x + 1, y: y + 1, w: 78, h: 78, stroke: "#94a3b8", fill: "none" });
    const c = cells[i];
    if (c === null) items.push({ t: "text", x: x + 40, y: y + 50, s: "?", size: 34 });
    else items.push(...c);
  }
  return { w: 240, h: 240, items };
}
const at = (it: VisualItem[], dx: number, dy: number): VisualItem[] =>
  it.map((i) => {
    if (i.t === "shape" || i.t === "circle") return { ...i, cx: i.cx + dx, cy: i.cy + dy } as VisualItem;
    if (i.t === "rect") return { ...i, x: i.x + dx, y: i.y + dy } as VisualItem;
    if (i.t === "text") return { ...i, x: i.x + dx, y: i.y + dy } as VisualItem;
    if (i.t === "line") return { ...i, x1: i.x1 + dx, y1: i.y1 + dy, x2: i.x2 + dx, y2: i.y2 + dy } as VisualItem;
    return i;
  });
const cellOf = (i: number) => ({ dx: (i % 3) * 80, dy: Math.floor(i / 3) * 80 });
function grid(cellFn: (i: number) => VisualItem[] | null): VisualSpec {
  return matrix(Array.from({ length: 9 }, (_, i) => { const c = cellFn(i); if (c === null) return null; const { dx, dy } = cellOf(i); return at(c, dx, dy); }));
}
const single = (kind: Extract<VisualItem, { t: "shape" }>["kind"], extra: Partial<Extract<VisualItem, { t: "shape" }>> = {}, size = 40): VisualItem[] => [shape(kind, 40, 40, size, extra)];
const choiceFig = (items: VisualItem[]): VisualSpec => ({ w: 80, h: 80, items: [{ t: "rect", x: 1, y: 1, w: 78, h: 78, stroke: "#cbd5e1", fill: "none" }, ...items] });
const dots = (n: number, fill = NAVY): VisualItem[] => {
  const pos = [[40, 40], [26, 40], [54, 40], [40, 24], [40, 56]];
  const layouts: number[][][] = [[], [[40, 40]], [[28, 40], [52, 40]], [[40, 24], [28, 52], [52, 52]], [[28, 28], [52, 28], [28, 52], [52, 52]]];
  const p = layouts[n] ?? pos.slice(0, n);
  return p.map(([x, y]) => ({ t: "circle", cx: x, cy: y, r: 7, fill, stroke: NAVY }) as VisualItem);
};

/** Paper folding: square paper 100x100 shown as fold step + punched. Holes are on the folded piece. */
function foldVisual(fold: "vertical" | "horizontal" | "diag", holes: [number, number][]): VisualSpec {
  const items: VisualItem[] = [];
  // Step 1: flat paper with fold line and arrow
  items.push({ t: "rect", x: 10, y: 20, w: 100, h: 100, stroke: NAVY, fill: "#fff" });
  if (fold === "vertical") items.push({ t: "line", x1: 60, y1: 20, x2: 60, y2: 120, stroke: NAVY, dash: true }, { t: "line", x1: 100, y1: 70, x2: 70, y2: 70, stroke: "#D72638", arrow: true });
  if (fold === "horizontal") items.push({ t: "line", x1: 10, y1: 70, x2: 110, y2: 70, stroke: NAVY, dash: true }, { t: "line", x1: 60, y1: 110, x2: 60, y2: 80, stroke: "#D72638", arrow: true });
  if (fold === "diag") items.push({ t: "line", x1: 10, y1: 120, x2: 110, y2: 20, stroke: NAVY, dash: true }, { t: "line", x1: 100, y1: 110, x2: 75, y2: 85, stroke: "#D72638", arrow: true });
  items.push({ t: "line", x1: 125, y1: 70, x2: 150, y2: 70, stroke: "#64748b", arrow: true });
  // Step 2: folded piece with holes
  if (fold === "vertical") items.push({ t: "rect", x: 165, y: 20, w: 50, h: 100, stroke: NAVY, fill: "#f1f5f9" });
  if (fold === "horizontal") items.push({ t: "rect", x: 165, y: 20, w: 100, h: 50, stroke: NAVY, fill: "#f1f5f9" });
  if (fold === "diag") items.push({ t: "shape", kind: "triangle", cx: 215, cy: 70, size: 100, stroke: NAVY, fill: "#f1f5f9", rot: 0 });
  for (const [hx, hy] of holes) items.push({ t: "circle", cx: 165 + hx, cy: 20 + hy, r: 5, fill: "#fff", stroke: NAVY });
  return { w: 280, h: 140, items };
}
const unfolded = (holes: [number, number][]): VisualSpec => ({
  w: 100, h: 100,
  items: [{ t: "rect", x: 2, y: 2, w: 96, h: 96, stroke: NAVY, fill: "#fff" }, ...holes.map(([x, y]) => ({ t: "circle", cx: 2 + x * 0.96, cy: 2 + y * 0.96, r: 5, fill: "#fff", stroke: NAVY }) as VisualItem)],
});

// ---------- passages ----------
const P1 = {
  id: "p-lanterns",
  title: "The Lantern Walk",
  text: `Every November, the town of Millbrook holds a lantern walk along the river. It began forty years ago when a single teacher, Mrs. Okafor, wanted her students to notice how early the dark arrived in late autumn. She asked each child to build a paper lantern and carry it from the school to the footbridge.

The first walk drew only nineteen students and a few curious parents. Today, more than two thousand people take part, and the lanterns have grown elaborate: glowing fish, swans, and even a ten-foot dragon that requires six people to carry. Yet the rules have barely changed. Lanterns must be handmade, and the walk always ends with a moment of silence on the bridge.

Some newcomers grumble that the silence is old-fashioned. Longtime residents disagree. "The quiet is the point," says Daniel Reyes, who has walked every year since he was six. "For one minute, the whole town is looking at the same dark water, holding the same small light."`,
};
const P2 = {
  id: "p-bees",
  title: "Why Bees Dance",
  text: `When a honeybee discovers a rich patch of flowers, she does not keep the news to herself. Back in the hive, she performs a "waggle dance" on the honeycomb. The direction she waggles, measured against the vertical, tells other bees the angle of the flowers relative to the sun. The length of the waggle tells them how far to fly.

Scientists once doubted that an insect could share such precise information. In the 1940s, researcher Karl von Frisch tracked marked bees and confirmed that hive-mates flew almost directly to the food source after watching the dance. Later experiments with robotic bees, which could be programmed to dance, showed that the movement itself—not scent alone—carried the message.

The waggle dance is not perfect. Bees dancing on a windy day may send followers slightly off course. Still, for a creature with a brain the size of a sesame seed, it is a remarkable achievement in communication.`,
};

// ---------- QUESTIONS ----------
export const SAMPLE_BANK: BankQuestion[] = [
  // ===== READING =====
  { code: "RD-01", section_key: "reading", skill: "main_idea", difficulty: 1, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "What is the passage mostly about?",
    choices: [{ key: "A", text: "How to build a paper lantern" }, { key: "B", text: "A town tradition and why it has lasted" }, { key: "C", text: "Why autumn nights are dark" }, { key: "D", text: "A dragon lantern that needs six people" }],
    correct_key: "B", rationale: "The passage traces the lantern walk from its start to today and explains why residents value it." },
  { code: "RD-02", section_key: "reading", skill: "inference", difficulty: 2, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "Based on the passage, Daniel Reyes would most likely believe that",
    choices: [{ key: "A", text: "the walk should end at the school instead of the bridge" }, { key: "B", text: "elaborate lanterns have ruined the event" }, { key: "C", text: "the shared silence matters more than the lanterns" }, { key: "D", text: "newcomers should not be allowed to join" }],
    correct_key: "C", rationale: "He says 'the quiet is the point' and describes the town sharing one moment." },
  { code: "RD-03", section_key: "reading", skill: "vocabulary_in_context", difficulty: 2, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "In paragraph 2, the word \"elaborate\" most nearly means",
    choices: [{ key: "A", text: "simple" }, { key: "B", text: "detailed and complex" }, { key: "C", text: "expensive" }, { key: "D", text: "heavy" }],
    correct_key: "B", rationale: "The examples—glowing fish, swans, a ten-foot dragon—show the lanterns have become complex." },
  { code: "RD-04", section_key: "reading", skill: "text_structure", difficulty: 3, passage_id: P1.id, passage_title: P1.title, passage_text: P1.text,
    stem: "How does the third paragraph relate to the second?",
    choices: [{ key: "A", text: "It presents a disagreement about a rule described in the second paragraph." }, { key: "B", text: "It lists more examples of lantern designs." }, { key: "C", text: "It explains how the walk was first organized." }, { key: "D", text: "It describes a different town's tradition." }],
    correct_key: "A", rationale: "Paragraph 2 states the silence rule; paragraph 3 shows newcomers and residents disagreeing about it." },
  { code: "RD-05", section_key: "reading", skill: "main_idea", difficulty: 2, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "Which sentence best states the central idea of the passage?",
    choices: [{ key: "A", text: "Robots can be programmed to imitate insects." }, { key: "B", text: "Honeybees communicate the location of food through a precise dance." }, { key: "C", text: "Wind makes it difficult for bees to find flowers." }, { key: "D", text: "Karl von Frisch was a famous researcher." }],
    correct_key: "B", rationale: "Every paragraph develops how the waggle dance communicates direction and distance." },
  { code: "RD-06", section_key: "reading", skill: "inference", difficulty: 3, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "The experiments with robotic bees were important because they showed that",
    choices: [{ key: "A", text: "bees prefer robots to real dancers" }, { key: "B", text: "scent is the only signal bees use" }, { key: "C", text: "the dance movement itself carries information" }, { key: "D", text: "bees cannot fly on windy days" }],
    correct_key: "C", rationale: "The passage says the robots proved 'the movement itself—not scent alone—carried the message.'" },
  { code: "RD-07", section_key: "reading", skill: "vocabulary_in_context", difficulty: 1, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "As used in paragraph 1, \"rich\" most nearly means",
    choices: [{ key: "A", text: "wealthy" }, { key: "B", text: "full of nectar" }, { key: "C", text: "colorful" }, { key: "D", text: "far away" }],
    correct_key: "B", rationale: "A 'rich patch of flowers' is one that offers plenty of food." },
  { code: "RD-08", section_key: "reading", skill: "text_structure", difficulty: 2, passage_id: P2.id, passage_title: P2.title, passage_text: P2.text,
    stem: "The author begins the final paragraph with \"The waggle dance is not perfect\" in order to",
    choices: [{ key: "A", text: "acknowledge a limitation before praising the dance" }, { key: "B", text: "argue that the research was wrong" }, { key: "C", text: "introduce a new kind of dance" }, { key: "D", text: "explain how hives are built" }],
    correct_key: "A", rationale: "The paragraph admits a weakness and then calls the dance 'a remarkable achievement.'" },

  // ===== WRITTEN EXPRESSION =====
  { code: "WE-01", section_key: "written_expression", skill: "grammar_usage", difficulty: 1,
    stem: "Choose the sentence that is written correctly.",
    choices: [{ key: "A", text: "Neither of the twins have finished their project." }, { key: "B", text: "Neither of the twins has finished the project." }, { key: "C", text: "Neither of the twins are finishing the project." }, { key: "D", text: "Neither of the twins were finished the project." }],
    correct_key: "B", rationale: "'Neither' is singular and takes the singular verb 'has.'" },
  { code: "WE-02", section_key: "written_expression", skill: "punctuation_capitalization", difficulty: 2,
    stem: "Which sentence uses commas correctly?",
    choices: [{ key: "A", text: "After the storm passed, we walked to the harbor, and counted the boats." }, { key: "B", text: "After the storm passed we walked to the harbor and counted the boats." }, { key: "C", text: "After the storm passed, we walked to the harbor and counted the boats." }, { key: "D", text: "After, the storm passed we walked to the harbor and, counted the boats." }],
    correct_key: "C", rationale: "A comma follows the introductory clause; no comma is needed before 'and' joining two verbs." },
  { code: "WE-03", section_key: "written_expression", skill: "sentence_structure", difficulty: 2,
    stem: "Which of the following is a complete sentence?",
    choices: [{ key: "A", text: "Because the museum closed early on Sundays." }, { key: "B", text: "Running through the empty gallery before closing." }, { key: "C", text: "The guard, who had worked there for years, locked the doors." }, { key: "D", text: "Although the paintings were covered for cleaning." }],
    correct_key: "C", rationale: "Only C has an independent clause with a subject ('the guard') and a main verb ('locked')." },
  { code: "WE-04", section_key: "written_expression", skill: "organization", difficulty: 3,
    stem: "Read the paragraph. Which sentence does NOT belong?\n\n(1) Community gardens turn empty lots into useful green space. (2) Neighbors grow vegetables, share tools, and get to know one another. (3) My cousin once grew a pumpkin that weighed sixty pounds. (4) Studies show that streets near community gardens report less litter and more foot traffic.",
    choices: [{ key: "A", text: "Sentence 1" }, { key: "B", text: "Sentence 2" }, { key: "C", text: "Sentence 3" }, { key: "D", text: "Sentence 4" }],
    correct_key: "C", rationale: "Sentence 3 is a personal anecdote that does not support the paragraph's point about community benefits." },
  { code: "WE-05", section_key: "written_expression", skill: "grammar_usage", difficulty: 3,
    stem: "Choose the word that correctly completes the sentence.\n\nThe coach gave the trophy to Marcus and ____ after the final match.",
    choices: [{ key: "A", text: "I" }, { key: "B", text: "me" }, { key: "C", text: "myself" }, { key: "D", text: "mine" }],
    correct_key: "B", rationale: "The pronoun is an object of the preposition 'to,' so the object form 'me' is correct." },
  { code: "WE-06", section_key: "written_expression", skill: "punctuation_capitalization", difficulty: 1,
    stem: "Which sentence is capitalized correctly?",
    choices: [{ key: "A", text: "Last Summer we visited aunt Rosa in Chicago." }, { key: "B", text: "Last summer we visited Aunt Rosa in Chicago." }, { key: "C", text: "Last summer we visited aunt Rosa in chicago." }, { key: "D", text: "last Summer we visited Aunt rosa in Chicago." }],
    correct_key: "B", rationale: "Seasons are lowercase; 'Aunt Rosa' is a name used as a title; city names are capitalized." },
  { code: "WE-07", section_key: "written_expression", skill: "sentence_structure", difficulty: 3,
    stem: "Which revision best combines the two sentences?\n\nThe bridge was built in 1932. It is still the longest in the county.",
    choices: [{ key: "A", text: "The bridge was built in 1932, it is still the longest in the county." }, { key: "B", text: "Built in 1932, the bridge is still the longest in the county." }, { key: "C", text: "The bridge was built in 1932 and still the longest in the county it is." }, { key: "D", text: "The bridge, built in 1932 and still the longest in the county." }],
    correct_key: "B", rationale: "B is a complete, clear sentence; A is a comma splice, D is a fragment, and C is awkward." },
  { code: "WE-08", section_key: "written_expression", skill: "organization", difficulty: 2,
    stem: "Which sentence would be the best topic sentence for a paragraph about the benefits of walking to school?",
    choices: [{ key: "A", text: "Some students live very far from school." }, { key: "B", text: "Walking to school offers students exercise, fresh air, and time to think." }, { key: "C", text: "Buses arrive at 7:45 each morning." }, { key: "D", text: "Sneakers come in many colors." }],
    correct_key: "B", rationale: "B states the main point and previews the supporting details." },

  // ===== MATHEMATICS =====
  { code: "MA-01", section_key: "mathematics", skill: "number_operations", difficulty: 1,
    stem: "What is 4,806 − 2,957?",
    choices: [{ key: "A", text: "1,849" }, { key: "B", text: "1,949" }, { key: "C", text: "2,149" }, { key: "D", text: "1,859" }],
    correct_key: "A", rationale: "4,806 − 2,957 = 1,849." },
  { code: "MA-02", section_key: "mathematics", skill: "fractions_decimals_percent", difficulty: 2,
    stem: "A jacket that costs $80 is on sale for 35% off. What is the sale price?",
    choices: [{ key: "A", text: "$28" }, { key: "B", text: "$45" }, { key: "C", text: "$52" }, { key: "D", text: "$65" }],
    correct_key: "C", rationale: "35% of 80 is 28; 80 − 28 = 52." },
  { code: "MA-03", section_key: "mathematics", skill: "algebra_patterns", difficulty: 2,
    stem: "If 3x + 7 = 25, what is the value of x?",
    choices: [{ key: "A", text: "4" }, { key: "B", text: "6" }, { key: "C", text: "8" }, { key: "D", text: "18" }],
    correct_key: "B", rationale: "3x = 18, so x = 6." },
  { code: "MA-04", section_key: "mathematics", skill: "geometry_measurement", difficulty: 2,
    stem: "A rectangle has a perimeter of 36 cm and a width of 7 cm. What is its area?",
    choices: [{ key: "A", text: "77 cm²" }, { key: "B", text: "98 cm²" }, { key: "C", text: "126 cm²" }, { key: "D", text: "203 cm²" }],
    correct_key: "A", rationale: "Length = (36 − 14) ÷ 2 = 11; area = 11 × 7 = 77." },
  { code: "MA-05", section_key: "mathematics", skill: "data_probability", difficulty: 1,
    stem: "A bag holds 3 red, 5 blue, and 2 green marbles. If one marble is drawn at random, what is the probability it is blue?",
    choices: [{ key: "A", text: "1/5" }, { key: "B", text: "3/10" }, { key: "C", text: "1/2" }, { key: "D", text: "5/12" }],
    correct_key: "C", rationale: "5 blue out of 10 total = 1/2." },
  { code: "MA-06", section_key: "mathematics", skill: "number_operations", difficulty: 3,
    stem: "What is the greatest common factor of 84 and 126?",
    choices: [{ key: "A", text: "14" }, { key: "B", text: "21" }, { key: "C", text: "42" }, { key: "D", text: "63" }],
    correct_key: "C", rationale: "84 = 2×42 and 126 = 3×42; 42 is the largest shared factor." },
  { code: "MA-07", section_key: "mathematics", skill: "fractions_decimals_percent", difficulty: 3,
    stem: "Which value is greatest?",
    choices: [{ key: "A", text: "0.58" }, { key: "B", text: "5/9" }, { key: "C", text: "57%" }, { key: "D", text: "4/7" }],
    correct_key: "A", rationale: "5/9 ≈ 0.556, 57% = 0.57, 4/7 ≈ 0.571, and 0.58 is largest." },
  { code: "MA-08", section_key: "mathematics", skill: "algebra_patterns", difficulty: 1,
    stem: "What is the next number in the pattern 2, 6, 18, 54, ...?",
    choices: [{ key: "A", text: "108" }, { key: "B", text: "144" }, { key: "C", text: "162" }, { key: "D", text: "216" }],
    correct_key: "C", rationale: "Each term is multiplied by 3: 54 × 3 = 162." },
  { code: "MA-09", section_key: "mathematics", skill: "geometry_measurement", difficulty: 3,
    stem: "Two angles of a triangle measure 48° and 67°. What is the measure of the third angle?",
    choices: [{ key: "A", text: "55°" }, { key: "B", text: "65°" }, { key: "C", text: "75°" }, { key: "D", text: "115°" }],
    correct_key: "B", rationale: "180 − 48 − 67 = 65." },
  { code: "MA-10", section_key: "mathematics", skill: "data_probability", difficulty: 2,
    stem: "Ana's quiz scores are 82, 90, 76, and 92. What score does she need on a fifth quiz to have a mean of 86?",
    choices: [{ key: "A", text: "86" }, { key: "B", text: "88" }, { key: "C", text: "90" }, { key: "D", text: "94" }],
    correct_key: "C", rationale: "5 × 86 = 430; 430 − (82+90+76+92 = 340) = 90." },

  // ===== FIGURE MATRICES =====
  { code: "FM-01", section_key: "figure_matrices", skill: "rotation", difficulty: 1,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => i === 8 ? null : single("arrow", { rot: (i % 3) * 90 })),
    visual_alt: "A 3 by 3 grid. In each row an arrow points up, then right, then down. The last cell of the bottom row is missing.",
    choices: [
      { key: "A", visual: choiceFig(single("arrow", { rot: 0 })) }, { key: "B", visual: choiceFig(single("arrow", { rot: 180 })) },
      { key: "C", visual: choiceFig(single("arrow", { rot: 270 })) }, { key: "D", visual: choiceFig(single("triangle", { rot: 180 })) }],
    correct_key: "B", rationale: "Across each row the arrow rotates 90° clockwise, so the missing arrow points down (180°)." },
  { code: "FM-02", section_key: "figure_matrices", skill: "shading", difficulty: 1,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => { const kinds = ["circle", "square", "triangle"] as const; const fills = ["none", "#94a3b8", NAVY]; return i === 8 ? null : single(kinds[Math.floor(i / 3)], { fill: fills[i % 3] }); }),
    visual_alt: "Each row shows one shape three times: unshaded, gray, then black. Row 1 circles, row 2 squares, row 3 triangles with the black triangle missing.",
    choices: [
      { key: "A", visual: choiceFig(single("triangle", { fill: "none" })) }, { key: "B", visual: choiceFig(single("triangle", { fill: "#94a3b8" })) },
      { key: "C", visual: choiceFig(single("triangle", { fill: NAVY })) }, { key: "D", visual: choiceFig(single("square", { fill: NAVY })) }],
    correct_key: "C", rationale: "Rows keep the shape; columns move from unshaded to gray to black. The missing figure is a black triangle." },
  { code: "FM-03", section_key: "figure_matrices", skill: "count", difficulty: 2,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => i === 8 ? null : dots(Math.min(4, (i % 3) + 1 + (Math.floor(i / 3) > 0 ? 1 : 0)))),
    visual_alt: "A grid of dot groups. Row 1 has 1, 2, 3 dots. Rows 2 and 3 have 2, 3, 4 dots, with the last cell of row 3 missing.",
    choices: [
      { key: "A", visual: choiceFig(dots(2)) }, { key: "B", visual: choiceFig(dots(3)) },
      { key: "C", visual: choiceFig(dots(4)) }, { key: "D", visual: choiceFig(dots(1)) }],
    correct_key: "C", rationale: "Moving left to right, each cell adds one dot. Row 3 goes 2, 3, so the missing cell has 4 dots." },
  { code: "FM-04", section_key: "figure_matrices", skill: "size_change", difficulty: 2,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => i === 8 ? null : single(["hexagon", "diamond", "star"][Math.floor(i / 3)] as any, {}, [20, 32, 46][i % 3])),
    visual_alt: "Each row shows one shape growing from small to medium to large. Row 3 shows a small star and a medium star; the large star is missing.",
    choices: [
      { key: "A", visual: choiceFig(single("star", {}, 20)) }, { key: "B", visual: choiceFig(single("star", {}, 46)) },
      { key: "C", visual: choiceFig(single("diamond", {}, 46)) }, { key: "D", visual: choiceFig(single("star", { fill: NAVY }, 32)) }],
    correct_key: "B", rationale: "Size increases across each row; the third star must be the large, unshaded star." },
  { code: "FM-05", section_key: "figure_matrices", skill: "rotation", difficulty: 3,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => i === 8 ? null : [shape("triangle", 40, 40, 36, { rot: (i % 3) * 45 + Math.floor(i / 3) * 45 }), { t: "circle", cx: 40 + 22 * Math.cos(((i % 3) * 45 + Math.floor(i / 3) * 45 - 90) * Math.PI / 180), cy: 40 + 22 * Math.sin(((i % 3) * 45 + Math.floor(i / 3) * 45 - 90) * Math.PI / 180), r: 4, fill: "#D72638", stroke: "#D72638" }]),
    visual_alt: "A triangle with a red dot near its top vertex rotates 45 degrees clockwise across each row and 45 degrees down each column. The bottom-right cell is missing.",
    choices: [
      { key: "A", visual: choiceFig([shape("triangle", 40, 40, 36, { rot: 180 }), { t: "circle", cx: 40 + 22 * Math.cos(90 * Math.PI / 180), cy: 40 + 22 * Math.sin(90 * Math.PI / 180), r: 4, fill: "#D72638", stroke: "#D72638" }]) },
      { key: "B", visual: choiceFig([shape("triangle", 40, 40, 36, { rot: 135 }), { t: "circle", cx: 40 + 22 * Math.cos(45 * Math.PI / 180), cy: 40 + 22 * Math.sin(45 * Math.PI / 180), r: 4, fill: "#D72638", stroke: "#D72638" }]) },
      { key: "C", visual: choiceFig([shape("triangle", 40, 40, 36, { rot: 90 }), { t: "circle", cx: 40 + 22 * Math.cos(0), cy: 40, r: 4, fill: "#D72638", stroke: "#D72638" }]) },
      { key: "D", visual: choiceFig([shape("triangle", 40, 40, 36, { rot: 180 }), { t: "circle", cx: 40, cy: 18, r: 4, fill: "#D72638", stroke: "#D72638" }]) }],
    correct_key: "A", rationale: "Row 3 starts at 90°; adding 45° twice gives 180°, and the dot rotates with the triangle to the bottom." },
  { code: "FM-06", section_key: "figure_matrices", skill: "shading", difficulty: 3,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => { const r = Math.floor(i / 3), c = i % 3; if (i === 8) return null; const kinds = ["circle", "square", "hexagon"] as const; return single(kinds[(r + c) % 3], { fill: c === r ? NAVY : "none" }); }),
    visual_alt: "Each row contains a circle, a square, and a hexagon in a shifting order; exactly one figure per row and per column is shaded black, along the diagonal. The bottom-right cell is missing.",
    choices: [
      { key: "A", visual: choiceFig(single("circle", { fill: NAVY })) }, { key: "B", visual: choiceFig(single("square", { fill: "none" })) },
      { key: "C", visual: choiceFig(single("circle", { fill: "none" })) }, { key: "D", visual: choiceFig(single("hexagon", { fill: NAVY })) }],
    correct_key: "A", rationale: "Row 3 still needs a circle, and the shaded figure falls on the diagonal, so the answer is a shaded circle." },

  // ===== PAPER FOLDING =====
  { code: "PF-01", section_key: "paper_folding", skill: "single_fold", difficulty: 1,
    stem: "The paper is folded as shown and one hole is punched. How will it look when unfolded?",
    visual: foldVisual("vertical", [[25, 30]]),
    visual_alt: "A square sheet folded in half from right to left along a vertical center line. A hole is punched near the top-left of the folded half.",
    choices: [
      { key: "A", visual: unfolded([[25, 30], [75, 30]]) }, { key: "B", visual: unfolded([[25, 30]]) },
      { key: "C", visual: unfolded([[25, 30], [25, 70]]) }, { key: "D", visual: unfolded([[75, 70], [25, 30]]) }],
    correct_key: "A", rationale: "A vertical fold mirrors the hole left-to-right at the same height." },
  { code: "PF-02", section_key: "paper_folding", skill: "single_fold", difficulty: 2,
    stem: "The paper is folded as shown and one hole is punched. How will it look when unfolded?",
    visual: foldVisual("horizontal", [[20, 15]]),
    visual_alt: "A square sheet folded in half from bottom to top along a horizontal center line. A hole is punched near the top-left corner of the folded strip.",
    choices: [
      { key: "A", visual: unfolded([[20, 15], [80, 15]]) }, { key: "B", visual: unfolded([[20, 15], [20, 85]]) },
      { key: "C", visual: unfolded([[20, 15]]) }, { key: "D", visual: unfolded([[80, 85], [20, 15]]) }],
    correct_key: "B", rationale: "A horizontal fold mirrors the hole top-to-bottom, keeping the same left-right position." },
  { code: "PF-03", section_key: "paper_folding", skill: "single_fold", difficulty: 2,
    stem: "The paper is folded along the diagonal and one hole is punched. How will it look when unfolded?",
    visual: foldVisual("diag", [[30, 30]]),
    visual_alt: "A square sheet folded along the diagonal from bottom-right up to the top-left, forming a triangle. A hole is punched inside the triangle.",
    choices: [
      { key: "A", visual: unfolded([[30, 30], [70, 70]]) }, { key: "B", visual: unfolded([[30, 30], [30, 70]]) },
      { key: "C", visual: unfolded([[30, 30], [70, 30]]) }, { key: "D", visual: unfolded([[30, 30]]) }],
    correct_key: "A", rationale: "A diagonal fold reflects the hole across the diagonal line, swapping its x and y positions." },
  { code: "PF-04", section_key: "paper_folding", skill: "double_fold", difficulty: 3,
    stem: "The paper is folded in half twice (first vertically, then horizontally) and one hole is punched in the corner. How many holes appear when unfolded?",
    visual: { w: 280, h: 140, items: [
      { t: "rect", x: 10, y: 20, w: 100, h: 100, stroke: NAVY, fill: "#fff" }, { t: "line", x1: 60, y1: 20, x2: 60, y2: 120, stroke: NAVY, dash: true }, { t: "line", x1: 10, y1: 70, x2: 110, y2: 70, stroke: NAVY, dash: true },
      { t: "line", x1: 125, y1: 70, x2: 150, y2: 70, stroke: "#64748b", arrow: true },
      { t: "rect", x: 165, y: 45, w: 50, h: 50, stroke: NAVY, fill: "#f1f5f9" }, { t: "circle", cx: 177, cy: 57, r: 5, fill: "#fff", stroke: NAVY }] },
    visual_alt: "A square sheet with both a vertical and horizontal center fold line, folded into a quarter-size square. One hole is punched near the outer corner of the folded square.",
    choices: [{ key: "A", text: "1" }, { key: "B", text: "2" }, { key: "C", text: "4" }, { key: "D", text: "8" }],
    correct_key: "C", rationale: "Two folds create four layers, so one punch makes four holes." },
  { code: "PF-05", section_key: "paper_folding", skill: "double_fold", difficulty: 3,
    stem: "The paper is folded in half twice into a small square and a hole is punched near the folded corner (the center of the original sheet). How will it look when unfolded?",
    visual: { w: 280, h: 140, items: [
      { t: "rect", x: 10, y: 20, w: 100, h: 100, stroke: NAVY, fill: "#fff" }, { t: "line", x1: 60, y1: 20, x2: 60, y2: 120, stroke: NAVY, dash: true }, { t: "line", x1: 10, y1: 70, x2: 110, y2: 70, stroke: NAVY, dash: true },
      { t: "line", x1: 125, y1: 70, x2: 150, y2: 70, stroke: "#64748b", arrow: true },
      { t: "rect", x: 165, y: 45, w: 50, h: 50, stroke: NAVY, fill: "#f1f5f9" }, { t: "circle", cx: 205, cy: 85, r: 5, fill: "#fff", stroke: NAVY }] },
    visual_alt: "A square sheet folded into quarters. The hole is punched near the corner of the small square that lies at the center of the original sheet.",
    choices: [
      { key: "A", visual: unfolded([[40, 40], [60, 40], [40, 60], [60, 60]]) }, { key: "B", visual: unfolded([[10, 10], [90, 10], [10, 90], [90, 90]]) },
      { key: "C", visual: unfolded([[50, 50]]) }, { key: "D", visual: unfolded([[40, 40], [60, 60]]) }],
    correct_key: "A", rationale: "The punch near the center corner unfolds to four holes clustered around the center of the sheet." },

  // ===== FIGURE CLASSIFICATION =====
  { code: "FC-01", section_key: "figure_classification", skill: "shape_attribute", difficulty: 1,
    stem: "The first three figures are alike in some way. Which answer choice belongs with them?",
    visual: { w: 260, h: 90, items: [...at(single("triangle"), 0, 5), ...at(single("triangle", { rot: 90 }), 90, 5), ...at(single("triangle", { fill: "#94a3b8", rot: 200 }), 180, 5)] },
    visual_alt: "Three triangles of different rotations and shading.",
    choices: [
      { key: "A", visual: choiceFig(single("square")) }, { key: "B", visual: choiceFig(single("triangle", { rot: 30, fill: NAVY }, 30)) },
      { key: "C", visual: choiceFig(single("diamond")) }, { key: "D", visual: choiceFig(single("hexagon")) }],
    correct_key: "B", rationale: "All figures are triangles; rotation, size, and shading vary, so the only triangle belongs." },
  { code: "FC-02", section_key: "figure_classification", skill: "count_attribute", difficulty: 2,
    stem: "The first three figures are alike in some way. Which answer choice belongs with them?",
    visual: { w: 260, h: 90, items: [...at(dots(3), 0, 5), ...at([shape("square", 24, 40, 20), shape("square", 48, 40, 20), shape("square", 40, 62, 14)], 90, 5), ...at([shape("triangle", 24, 40, 22), shape("triangle", 52, 32, 22), shape("triangle", 46, 60, 18)], 180, 5)] },
    visual_alt: "Three groups: three dots, three squares, and three triangles.",
    choices: [
      { key: "A", visual: choiceFig(dots(2)) }, { key: "B", visual: choiceFig(dots(4)) },
      { key: "C", visual: choiceFig([shape("hexagon", 24, 40, 20), shape("hexagon", 50, 30, 20), shape("hexagon", 44, 60, 18)]) }, { key: "D", visual: choiceFig(single("star")) }],
    correct_key: "C", rationale: "Each group contains exactly three figures. Only C has three." },
  { code: "FC-03", section_key: "figure_classification", skill: "shading_attribute", difficulty: 2,
    stem: "The first three figures are alike in some way. Which answer choice belongs with them?",
    visual: { w: 260, h: 90, items: [...at(single("circle", { fill: NAVY }), 0, 5), ...at(single("square", { fill: NAVY }), 90, 5), ...at(single("pentagon", { fill: NAVY }), 180, 5)] },
    visual_alt: "A black circle, a black square, and a black pentagon.",
    choices: [
      { key: "A", visual: choiceFig(single("circle", { fill: "none" })) }, { key: "B", visual: choiceFig(single("star", { fill: NAVY })) },
      { key: "C", visual: choiceFig(single("square", { fill: "#94a3b8" })) }, { key: "D", visual: choiceFig(single("hexagon", { dash: true })) }],
    correct_key: "B", rationale: "All three figures are solid black; shape varies. The black star is the match." },
  { code: "FC-04", section_key: "figure_classification", skill: "shape_attribute", difficulty: 3,
    stem: "The first three figures are alike in some way. Which answer choice belongs with them?",
    visual: { w: 260, h: 90, items: [...at([shape("square", 40, 40, 44), shape("circle", 40, 40, 20)], 0, 5), ...at([shape("hexagon", 40, 40, 46), shape("circle", 40, 40, 18)], 90, 5), ...at([shape("triangle", 40, 44, 50), shape("circle", 40, 48, 14)], 180, 5)] },
    visual_alt: "A small circle inside a square, inside a hexagon, and inside a triangle.",
    choices: [
      { key: "A", visual: choiceFig([shape("circle", 40, 40, 44), shape("square", 40, 40, 18)]) }, { key: "B", visual: choiceFig([shape("pentagon", 40, 40, 46), shape("circle", 40, 42, 16)]) },
      { key: "C", visual: choiceFig([shape("square", 40, 40, 44), shape("triangle", 40, 42, 18)]) }, { key: "D", visual: choiceFig(single("circle", {}, 20)) }],
    correct_key: "B", rationale: "Each figure is a circle inside a straight-sided polygon. B is a circle inside a pentagon." },
  { code: "FC-05", section_key: "figure_classification", skill: "count_attribute", difficulty: 1,
    stem: "The first three figures are alike in some way. Which answer choice belongs with them?",
    visual: { w: 260, h: 90, items: [...at(single("triangle"), 0, 5), ...at(single("square"), 90, 5), ...at(single("pentagon"), 180, 5)] },
    visual_alt: "One triangle, one square, one pentagon: figures with 3, 4, and 5 straight sides.",
    choices: [
      { key: "A", visual: choiceFig(single("circle")) }, { key: "B", visual: choiceFig(dots(2)) },
      { key: "C", visual: choiceFig(single("hexagon")) }, { key: "D", visual: choiceFig([{ t: "line", x1: 20, y1: 60, x2: 60, y2: 20, stroke: NAVY }]) }],
    correct_key: "C", rationale: "All are closed figures made of straight sides; the hexagon fits, while the circle and line do not." },
  { code: "FC-06", section_key: "figure_classification", skill: "shading_attribute", difficulty: 3,
    stem: "The first three figures are alike in some way. Which answer choice belongs with them?",
    visual: { w: 260, h: 90, items: [...at([shape("square", 28, 40, 22, { fill: NAVY }), shape("square", 54, 40, 22)], 0, 5), ...at([shape("circle", 28, 40, 22), shape("circle", 54, 40, 22, { fill: NAVY })], 90, 5), ...at([shape("triangle", 28, 42, 24, { fill: NAVY }), shape("triangle", 54, 42, 24)], 180, 5)] },
    visual_alt: "Each figure is a pair of identical shapes: one shaded black and one unshaded.",
    choices: [
      { key: "A", visual: choiceFig([shape("hexagon", 28, 40, 22, { fill: NAVY }), shape("hexagon", 54, 40, 22, { fill: NAVY })]) }, { key: "B", visual: choiceFig([shape("star", 28, 40, 24), shape("star", 54, 40, 24)]) },
      { key: "C", visual: choiceFig([shape("diamond", 28, 40, 22), shape("diamond", 54, 40, 22, { fill: NAVY })]) }, { key: "D", visual: choiceFig([shape("square", 28, 40, 22, { fill: NAVY }), shape("circle", 54, 40, 22)]) }],
    correct_key: "C", rationale: "Each figure pairs two identical shapes, exactly one shaded. Only C matches both conditions." },
];
