import diagnosticTests from "@/data/diagnostic-tests.json";
import elaDiagnosticTests from "@/data/ela-diagnostic-tests.json";

interface Question {
  id: string;
  number: number;
  type: string;
  topic?: string;
  skill_tag?: string;
  question_text?: string;
  question?: string;
  choices?: string[];
  options?: string[];
  correct_answer?: string;
  correctAnswer?: string;
}

interface Section {
  section_title: string;
  instructions: string;
  time_limit_minutes: number;
  calculator_allowed: string;
  student_completes?: number;
  questions: Question[];
}

interface DiagnosticTest {
  grade: string;
  test_name: string;
  total_time_minutes: number;
  sections: Section[];
}

// Get questions from the JSON file for a specific grade
export function getQuestionsForGrade(grade: number): Section[] | null {
  const gradeStr = grade.toString();
  const diagnostics = diagnosticTests.all_diagnostics as DiagnosticTest[];
  const test = diagnostics.find((t) => t.grade === gradeStr);
  return test?.sections || null;
}

// Get questions by test name (for grades 7-12)
export function getQuestionsByTestName(testName: string): { sections: Section[] } | null {
  const lower = testName.toLowerCase();
  const isELA = /\bela\b|english/.test(lower);
  const source = isELA
    ? (elaDiagnosticTests as any).all_diagnostics as DiagnosticTest[]
    : (diagnosticTests as any).all_diagnostics as DiagnosticTest[];

  const test = source.find((t) => {
    if (t.test_name.toLowerCase() === lower) return true;
    const gradeMatch = new RegExp(`\\bgrade\\s*${t.grade}\\b`).test(lower);
    if (!gradeMatch) return false;
    // Ensure subject matches to avoid cross-subject collisions
    const tIsELA = /\bela\b|english/.test(t.test_name.toLowerCase());
    return tIsELA === isELA;
  });

  if (test) {
    return { sections: test.sections };
  }
  return null;
}

// Normalize question format for consistent rendering
export function normalizeQuestions(rawQuestions: any): any[] {
  let questions: any[] = [];

  const mapQuestionWithContext = (q: any, context: any = {}) => ({
    ...q,
    question: q.question_text || q.question || q.text,
    options: q.choices || q.options || [],
    type: normalizeQuestionType(q.type),
    topic: q.topic || q.skill_tag || q.skill,
    section_title: context.section_title,
    section_instructions: context.section_instructions,
    student_completes: context.student_completes,
    correct_answer: q.correct_answer || q.correctAnswer,
    visual: q.visual || null,
    passage: q.passage || context.passage || null,
    passage_title: q.passage_title || context.passage_title || null,
  });

  const flattenSectionQuestions = (section: any) => {
    const sectionContext = {
      section_title: section.section_title,
      section_instructions: section.instructions,
      student_completes: section.student_completes,
      passage: section.passage,
      passage_title: section.passage_title,
    };

    const directQuestions = (section.questions || []).map((q: any) =>
      mapQuestionWithContext(q, sectionContext)
    );

    const subsectionQuestions = (section.subsections || []).flatMap((subsection: any) =>
      (subsection.questions || []).map((q: any) =>
        mapQuestionWithContext(q, {
          ...sectionContext,
          section_title: subsection.title || section.section_title,
          section_instructions: subsection.instructions || section.instructions,
          passage: subsection.passage || section.passage,
          passage_title: subsection.passage_title || section.passage_title,
        })
      )
    );

    return [...directQuestions, ...subsectionQuestions];
  };
  
  if (Array.isArray(rawQuestions)) {
    // Check if array items are section objects (have a `questions` array inside)
    const isSectionsArray = rawQuestions.length > 0 && (Array.isArray(rawQuestions[0]?.questions) || Array.isArray(rawQuestions[0]?.subsections));
    if (isSectionsArray) {
      // Flat array of section objects — same as the { sections: [...] } case
      questions = rawQuestions.flatMap((section: any) => flattenSectionQuestions(section));
    } else {
      // Flat array of questions
      questions = rawQuestions.map((q: any) => mapQuestionWithContext(q));
    }
  } else if (rawQuestions?.sections && Array.isArray(rawQuestions.sections)) {
    // Sections structure (grades 1-12) - flatten all questions from all sections
    questions = rawQuestions.sections.flatMap((section: any) => flattenSectionQuestions(section));
  } else if (rawQuestions?.questions && Array.isArray(rawQuestions.questions)) {
    // Object with nested questions array
    questions = rawQuestions.questions.map((q: any) => mapQuestionWithContext(q));
  }
  
  return questions;
}

function normalizeQuestionType(type: string): string {
  switch (type) {
    case 'multiple_choice':
      return 'multiple-choice';
    case 'word_problem':
    case 'multi_step':
      return 'long';
    default:
      return type;
  }
}
