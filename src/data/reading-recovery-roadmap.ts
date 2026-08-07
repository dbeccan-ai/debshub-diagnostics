// Shared 21-Day Reading Recovery roadmap definition.
// Used by the student dashboard, the results page and the admin results table
// so every surface renders the same plan.

import {
  BookOpen,
  BookMarked,
  FileText,
  Languages,
  Lightbulb,
  PenTool,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export interface RoadmapDay {
  day: number;
  title: string;
  category: string;
  description: string;
}

export const categoryConfig: Record<
  string,
  { icon: typeof BookOpen; color: string; bgColor: string }
> = {
  Assessment: { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100" },
  Phonics: { icon: Languages, color: "text-purple-600", bgColor: "bg-purple-100" },
  Vocabulary: { icon: BookMarked, color: "text-green-600", bgColor: "bg-green-100" },
  Reading: { icon: BookOpen, color: "text-orange-600", bgColor: "bg-orange-100" },
  Comprehension: { icon: Lightbulb, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  Fluency: { icon: TrendingUp, color: "text-pink-600", bgColor: "bg-pink-100" },
  Review: { icon: RefreshCw, color: "text-slate-600", bgColor: "bg-slate-100" },
  Writing: { icon: PenTool, color: "text-teal-600", bgColor: "bg-teal-100" },
};

export const roadmap: RoadmapDay[] = [
  // Week 1: Foundation Building
  { day: 1, title: "Pre-Assessment Diagnostic (Version A)", category: "Assessment", description: "Initial reading level assessment using grade-appropriate passage" },
  { day: 2, title: "Phonics Warm-up: Letter Sounds Review", category: "Phonics", description: "Review consonant and vowel sounds, blend practice" },
  { day: 3, title: "Sight Word Practice (Set 1)", category: "Vocabulary", description: "High-frequency words recognition and practice" },
  { day: 4, title: "Guided Reading Session 1", category: "Reading", description: "Supported oral reading with teacher feedback" },
  { day: 5, title: "Comprehension Strategy: Making Predictions", category: "Comprehension", description: "Using text clues to predict what happens next" },
  { day: 6, title: "Phonics: Blending & Segmenting Practice", category: "Phonics", description: "CVC words, digraphs, and blend patterns" },
  { day: 7, title: "Week 1 Review & Reflection", category: "Review", description: "Review progress, celebrate achievements, set Week 2 goals" },

  // Week 2: Building Skills
  { day: 8, title: "Sight Word Practice (Set 2)", category: "Vocabulary", description: "Next set of high-frequency words" },
  { day: 9, title: "Fluency Building: Repeated Reading", category: "Fluency", description: "Practice reading same passage for speed and accuracy" },
  { day: 10, title: "Mid-Point Assessment (Version B)", category: "Assessment", description: "Check progress with alternate passage" },
  { day: 11, title: "Comprehension Strategy: Asking Questions", category: "Comprehension", description: "Generate questions while reading (who, what, where, why)" },
  { day: 12, title: "Word Family Activities", category: "Phonics", description: "Word patterns and rhyming word families" },
  { day: 13, title: "Independent Reading Practice", category: "Reading", description: "Self-selected reading at appropriate level" },
  { day: 14, title: "Week 2 Review & Celebration", category: "Review", description: "Celebrate mid-point progress, recognize improvements" },

  // Week 3: Consolidation & Mastery
  { day: 15, title: "Vocabulary Building Games", category: "Vocabulary", description: "Interactive vocabulary activities and word games" },
  { day: 16, title: "Fluency: Expression & Phrasing", category: "Fluency", description: "Reading with appropriate expression and pauses" },
  { day: 17, title: "Comprehension Strategy: Summarizing", category: "Comprehension", description: "Identifying main ideas and retelling" },
  { day: 18, title: "Guided Reading Session 3", category: "Reading", description: "Advanced passage with comprehension focus" },
  { day: 19, title: "Writing Connection Activity", category: "Writing", description: "Connect reading to writing through response" },
  { day: 20, title: "Final Practice & Preparation", category: "Review", description: "Prepare for post-assessment, review strategies" },
  { day: 21, title: "Post-Assessment (Version C) & Celebration", category: "Assessment", description: "Final assessment and progress celebration" },
];

export const get21DayRoadmap = (): RoadmapDay[] => roadmap;

export const ASSESSMENT_CHECKPOINTS: Record<number, string> = {
  1: "Pre-Test",
  10: "Mid-Test",
  21: "Post-Test",
};
