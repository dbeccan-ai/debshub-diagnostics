import diagnosticTests from "@/data/diagnostic-tests.json";

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
  const diagnostics = diagnosticTests.all_diagnostics as DiagnosticTest[];
  const test = diagnostics.find((t) => 
    t.test_name.toLowerCase() === testName.toLowerCase() ||
    testName.toLowerCase().includes(`grade ${t.grade}`)
  );
  
  if (test) {
    return { sections: test.sections };
  }
  return null;
}

// Normalize question format for consistent rendering
export function normalizeQuestions(rawQuestions: any): any[] {
  let questions: any[] = [];
  
  if (Array.isArray(rawQuestions)) {
    // Flat array of questions
    questions = rawQuestions.map((q: any) => ({
      ...q,
      question: q.question_text || q.question,
      options: q.choices || q.options || [],
      type: normalizeQuestionType(q.type),
      topic: q.topic || q.skill_tag,
    }));
  } else if (rawQuestions?.sections && Array.isArray(rawQuestions.sections)) {
    // Sections structure (grades 7-12) - flatten all questions from all sections
    questions = rawQuestions.sections.flatMap((section: any) => 
      (section.questions || []).map((q: any) => ({
        ...q,
        question: q.question_text || q.question,
        options: q.choices || q.options || [],
        type: normalizeQuestionType(q.type),
        topic: q.topic || q.skill_tag,
        section_title: section.section_title,
        correct_answer: q.correct_answer || q.correctAnswer,
      }))
    );
  } else if (rawQuestions?.questions && Array.isArray(rawQuestions.questions)) {
    // Object with nested questions array
    questions = rawQuestions.questions.map((q: any) => ({
      ...q,
      question: q.question_text || q.question,
      options: q.choices || q.options || [],
      type: normalizeQuestionType(q.type),
      topic: q.topic || q.skill_tag,
    }));
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
