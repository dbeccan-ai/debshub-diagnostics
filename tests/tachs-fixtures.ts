// Shared TACHS test fixture.
// A realistic stored results blob including everything that must NOT reach parents.
export const STORED_RESULTS = {
  version: 2, blueprint_version: 2, generated_at: "2026-09-13T18:56:31Z",
  overall_accuracy: 61, total_presented: 200, total_correct: 122, total_time_seconds: 7200,
  band: { key: "developing", label: "Developing", color: "#d97706" },
  next_steps: "Rebuild the two weakest sections before adding timed practice.",
  focus_sections: ["mathematics", "paper_folding"],
  sections: [
    { section_key: "reading", item_count: 50, presented: 50, answered: 50, correct: 40, accuracy: 80, time_limit_seconds: 2100, time_used_seconds: 2100, pace_seconds_per_item: 42, allotted_seconds_per_item: 42, submit_reason: "timeout", avg_difficulty: 2.1, max_difficulty: 3, difficulty_path: [{ position: 1, difficulty: 2, skill: "inference" }], skills: { inference: { presented: 10, answered: 10, correct: 8 } } },
    { section_key: "written_expression", item_count: 50, presented: 50, answered: 50, correct: 44, accuracy: 88, time_limit_seconds: 1800, time_used_seconds: 1500, pace_seconds_per_item: 30, allotted_seconds_per_item: 36, submit_reason: "student", avg_difficulty: 2, max_difficulty: 3, difficulty_path: [], skills: {} },
    { section_key: "mathematics", item_count: 50, presented: 50, answered: 46, correct: 20, accuracy: 40, time_limit_seconds: 2400, time_used_seconds: 900, pace_seconds_per_item: 18, allotted_seconds_per_item: 48, submit_reason: "student", avg_difficulty: 1.4, max_difficulty: 2, difficulty_path: [{ position: 1, difficulty: 2, skill: "algebra" }], skills: { algebra: { presented: 10, answered: 9, correct: 3 } } },
    { section_key: "figure_matrices", item_count: 20, presented: 20, answered: 20, correct: 14, accuracy: 70, time_limit_seconds: 600, time_used_seconds: 600, pace_seconds_per_item: 30, allotted_seconds_per_item: 30, submit_reason: "timeout", avg_difficulty: 2, max_difficulty: 3, difficulty_path: [], skills: {} },
    { section_key: "paper_folding", item_count: 15, presented: 15, answered: 15, correct: 6, accuracy: 40, time_limit_seconds: 450, time_used_seconds: 450, pace_seconds_per_item: 30, allotted_seconds_per_item: 30, submit_reason: "timeout", avg_difficulty: 2, max_difficulty: 3, difficulty_path: [], skills: {} },
    { section_key: "figure_classification", item_count: 15, presented: 15, answered: 15, correct: 13, accuracy: 87, time_limit_seconds: 450, time_used_seconds: 400, pace_seconds_per_item: 27, allotted_seconds_per_item: 30, submit_reason: "student", avg_difficulty: 2, max_difficulty: 3, difficulty_path: [], skills: {} },
  ],
  skills: [{ section_key: "reading", skill: "inference", presented: 10, correct: 8, accuracy: 80 }],
  strengths: [], gaps: [],
  evidence: { by_difficulty: [], sections: [], skills: [], groups: [], min_sample: 3, note: "x" },
  disclaimer: "d",
};

