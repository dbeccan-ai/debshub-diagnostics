import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Printer, Download, CheckCircle2, AlertCircle } from "lucide-react";
import DEBsHeader from "@/components/DEBsHeader";
import DiagnosticLanding from "@/components/DiagnosticLanding";

// Section I Questions - Multiple Choice
const sectionIQuestions = [
  { id: "q1", number: 1, question: "What is 5/6 + 1/3?", options: ["A) 6/9", "B) 1", "C) 7/6", "D) 5/9", "E) I don't know"], correct: "C" },
  { id: "q2", number: 2, question: "What is 3.4 × 10?", options: ["A) 34", "B) 3.4", "C) 3.04", "D) 340", "E) I don't know"], correct: "A" },
  { id: "q3", number: 3, question: "What is the value of the expression: 8 + 2 × 5?", options: ["A) 50", "B) 60", "C) 18", "D) 20", "E) I don't know"], correct: "C" },
  { id: "q4", number: 4, question: "Which of the following is equivalent to 2(3 + x)?", options: ["A) 6 + x", "B) 6x", "C) 3 + 2x", "D) 6 + 2x", "E) I don't know"], correct: "D" },
  { id: "q5", number: 5, question: "Find the GCF of 24 and 36.", options: ["A) 4", "B) 6", "C) 12", "D) 18", "E) I don't know"], correct: "C" },
  { id: "q6", number: 6, question: "Which number is a solution to: x + 7 = 12?", options: ["A) 3", "B) 5", "C) 6", "D) 7", "E) I don't know"], correct: "B" },
  { id: "q7", number: 7, question: "What is the area of a triangle with base 8 cm and height 6 cm?", options: ["A) 24 cm²", "B) 48 cm²", "C) 14 cm²", "D) 28 cm²", "E) I don't know"], correct: "A" },
  { id: "q8", number: 8, question: 'Which expression represents "4 more than 3 times a number n"?', options: ["A) 3n + 4", "B) 4n + 3", "C) 4 + n + 3", "D) 3 + 4n", "E) I don't know"], correct: "A" },
  { id: "q9", number: 9, question: "Which is the smallest: -3, 0, 2, -7?", options: ["A) -3", "B) -7", "C) 0", "D) 2", "E) I don't know"], correct: "B" },
  { id: "q10", number: 10, question: "What is the coordinate of point A on a number line if it is 3 units to the right of -4?", options: ["A) -1", "B) -7", "C) 1", "D) -2", "E) I don't know"], correct: "A" },
  { id: "q11", number: 11, question: "Evaluate: 6 × (2 + 3)", options: ["A) 11", "B) 30", "C) 36", "D) 25", "E) I don't know"], correct: "B" },
  { id: "q12", number: 12, question: "What is 10% of 250?", options: ["A) 20", "B) 25", "C) 30", "D) 35", "E) I don't know"], correct: "B" },
  { id: "q13", number: 13, question: "Which of the following is a ratio?", options: ["A) 6 + 2", "B) 6 out of 10", "C) x = 3", "D) x - 5", "E) I don't know"], correct: "B" },
  { id: "q14", number: 14, question: "What is the volume of a rectangular prism with l=4, w=2, h=5?", options: ["A) 11", "B) 40", "C) 20", "D) 80", "E) I don't know"], correct: "B" },
  { id: "q15", number: 15, question: 'Which is the correct inequality for: "5 is less than x"?', options: ["A) x < 5", "B) x > 5", "C) x = 5", "D) x ≤ 5", "E) I don't know"], correct: "B" },
  { id: "q16", number: 16, question: "Convert 0.75 to a fraction.", options: ["A) 1/2", "B) 3/4", "C) 2/3", "D) 1/4", "E) I don't know"], correct: "B" },
  { id: "q17", number: 17, question: "Which property is shown: a + b = b + a", options: ["A) Associative", "B) Distributive", "C) Commutative", "D) Identity", "E) I don't know"], correct: "C" },
  { id: "q18", number: 18, question: "Which decimal is greatest: 0.65, 0.56, 0.75, 0.72?", options: ["A) 0.65", "B) 0.56", "C) 0.75", "D) 0.72", "E) I don't know"], correct: "C" },
  { id: "q19", number: 19, question: "What is the prime factorization of 30?", options: ["A) 2 × 5", "B) 2 × 3 × 5", "C) 3 × 5", "D) 6 × 5", "E) I don't know"], correct: "B" },
  { id: "q20", number: 20, question: "Which is a unit rate?", options: ["A) 8 steps in 4 seconds", "B) 12 pages in 6 minutes", "C) 2 pencils per student", "D) 100 miles per 2 hours", "E) I don't know"], correct: "C" },
];

// Section II Questions - Word Problems
const sectionIIQuestions = [
  { id: "q21", number: 21, question: "Tom bought 3 notebooks at $2.50 each and a folder for $1.25. How much did he spend in total?" },
  { id: "q22", number: 22, question: "A baker uses 4 cups of flour per cake. How many cups are needed for 5 cakes?" },
  { id: "q23", number: 23, question: "A movie ticket costs $8. If Sarah buys 2 tickets and a $5 snack, how much does she spend?" },
  { id: "q24", number: 24, question: "A taxi charges a $3 flat fee plus $2 per mile. What is the cost of a 6-mile ride?" },
  { id: "q25", number: 25, question: "Liam has $50. He buys 3 books for $12 each. How much money does he have left?" },
];

// Section III Questions - Multi-Step (choose 3 of 5)
const sectionIIIQuestions = [
  { id: "q26", number: 26, question: "Solve for x: 2(x + 4) = 20" },
  { id: "q27", number: 27, question: "A rectangle has a length 3 units longer than its width. If the perimeter is 28 units, what are the dimensions?" },
  { id: "q28", number: 28, question: "A school bought 3 sets of chairs at $75 each and 2 tables at $120 each. What is the total cost?" },
  { id: "q29", number: 29, question: "Draw and label a coordinate grid. Plot the points A(2,3), B(2,6), and C(5,3). What kind of shape is triangle ABC?", hasGrid: true },
  { id: "q30", number: 30, question: "If a car travels 60 miles in 1.5 hours, what is its unit rate of speed in miles per hour?" },
];

// Coordinate Grid Component for Q29
const CoordinateGrid = () => (
  <svg viewBox="0 0 200 200" className="w-full max-w-[300px] h-auto border border-gray-300 bg-white my-4">
    {/* Grid lines */}
    {[...Array(11)].map((_, i) => (
      <g key={i}>
        <line x1={20 + i * 16} y1={20} x2={20 + i * 16} y2={180} stroke="#ddd" strokeWidth="1" />
        <line x1={20} y1={20 + i * 16} x2={180} y2={20 + i * 16} stroke="#ddd" strokeWidth="1" />
      </g>
    ))}
    {/* Axes */}
    <line x1={20} y1={100} x2={180} y2={100} stroke="#333" strokeWidth="2" />
    <line x1={100} y1={20} x2={100} y2={180} stroke="#333" strokeWidth="2" />
    {/* Axis labels */}
    <text x={185} y={104} fontSize="12" fill="#333">x</text>
    <text x={104} y={15} fontSize="12" fill="#333">y</text>
    {/* Tick marks and numbers */}
    {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((n) => (
      <g key={n}>
        <text x={100 + n * 16 - 4} y={115} fontSize="8" fill="#666">{n}</text>
        <text x={82} y={100 - n * 16 + 3} fontSize="8" fill="#666">{n}</text>
      </g>
    ))}
    <text x={96} y={115} fontSize="8" fill="#666">0</text>
  </svg>
);

export default function Grade6Diagnostic() {
  const [showLanding, setShowLanding] = useState(true);
  const [currentSection, setCurrentSection] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [gradeLevel, setGradeLevel] = useState("6");
  const [timeRemaining, setTimeRemaining] = useState(90 * 60); // 90 minutes in seconds
  const [testStarted, setTestStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Answers state
  const [sectionIAnswers, setSectionIAnswers] = useState<Record<string, string>>({});
  const [sectionIIAnswers, setSectionIIAnswers] = useState<Record<string, { answer: string; work: string }>>({});
  const [sectionIIIAnswers, setSectionIIIAnswers] = useState<Record<string, { answer: string; work: string }>>({});
  const [selectedSection3Questions, setSelectedSection3Questions] = useState<Set<string>>(new Set());
  
  const printRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    if (testStarted && !submitted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testStarted, submitted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeRemaining < 300) return "bg-red-100 text-red-900 border-red-300";
    if (timeRemaining < 600) return "bg-orange-100 text-orange-900 border-orange-300";
    return "bg-blue-100 text-blue-900 border-blue-300";
  };

  const handleStartTest = () => {
    if (!studentName.trim()) {
      toast.error("Please enter student name");
      return;
    }
    setShowLanding(false);
    setTestStarted(true);
    toast.success("Test started! Good luck!");
  };

  const handleSection3Selection = (questionId: string) => {
    setSelectedSection3Questions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else if (newSet.size < 3) {
        newSet.add(questionId);
      } else {
        toast.error("You can only select 3 problems. Deselect one to choose another.");
      }
      return newSet;
    });
  };

  const calculateScore = () => {
    let score = 0;
    let maxScore = 41;
    
    // Section I: 20 points (1 each)
    sectionIQuestions.forEach((q) => {
      const answer = sectionIAnswers[q.id];
      if (answer && answer.charAt(0).toUpperCase() === q.correct) {
        score += 1;
      }
    });
    
    // Section II: 10 points (2 each) - always counted if answered
    sectionIIQuestions.forEach((q) => {
      const response = sectionIIAnswers[q.id];
      if (response?.answer?.trim()) {
        // For now, give credit for attempted answers (manual grading needed)
        score += 2;
      }
    });
    
    // Section III: 11 points total for 3 selected questions
    // Approximate: ~3.67 points each, we'll round to 3, 4, 4
    const selectedQs = Array.from(selectedSection3Questions);
    selectedQs.forEach((qId, index) => {
      const response = sectionIIIAnswers[qId];
      if (response?.answer?.trim()) {
        score += index === 0 ? 3 : 4;
      }
    });
    
    return { score, maxScore };
  };

  const getTier = (percentage: number) => {
    if (percentage >= 80) return { tier: "Tier 1", color: "text-green-600", bgColor: "bg-green-100" };
    if (percentage >= 50) return { tier: "Tier 2", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { tier: "Tier 3", color: "text-red-600", bgColor: "bg-red-100" };
  };

  const handleSubmit = () => {
    if (selectedSection3Questions.size !== 3) {
      toast.error("Please select exactly 3 problems in Section III before submitting.");
      return;
    }
    setSubmitted(true);
    toast.success("Test submitted successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const { score, maxScore } = calculateScore();
    const percentage = Math.round((score / maxScore) * 100);
    const tierInfo = getTier(percentage);
    
    let content = `D.E.Bs LEARNING ACADEMY\nGrade 6 Diagnostic Math Test Results\n${"=".repeat(50)}\n\n`;
    content += `Student Name: ${studentName}\n`;
    content += `Date: ${assessmentDate}\n`;
    content += `Grade Level: ${gradeLevel}\n\n`;
    content += `Score: ${score}/${maxScore} (${percentage}%)\n`;
    content += `Placement: ${tierInfo.tier}\n\n`;
    
    content += `${"=".repeat(50)}\nSECTION I - Multiple Choice\n${"=".repeat(50)}\n\n`;
    sectionIQuestions.forEach((q) => {
      const answer = sectionIAnswers[q.id] || "Not answered";
      const isCorrect = answer.charAt(0).toUpperCase() === q.correct;
      content += `Q${q.number}: ${q.question}\n`;
      content += `Answer: ${answer} ${isCorrect ? "✓" : `✗ (Correct: ${q.correct})`}\n\n`;
    });
    
    content += `${"=".repeat(50)}\nSECTION II - Word Problems\n${"=".repeat(50)}\n\n`;
    sectionIIQuestions.forEach((q) => {
      const response = sectionIIAnswers[q.id];
      content += `Q${q.number}: ${q.question}\n`;
      content += `Answer: ${response?.answer || "Not answered"}\n`;
      content += `Work: ${response?.work || "None shown"}\n\n`;
    });
    
    content += `${"=".repeat(50)}\nSECTION III - Multi-Step Problems (Selected)\n${"=".repeat(50)}\n\n`;
    sectionIIIQuestions.forEach((q) => {
      if (selectedSection3Questions.has(q.id)) {
        const response = sectionIIIAnswers[q.id];
        content += `Q${q.number}: ${q.question}\n`;
        content += `Answer: ${response?.answer || "Not answered"}\n`;
        content += `Work: ${response?.work || "None shown"}\n\n`;
      }
    });
    
    content += `\n${"=".repeat(50)}\nWant targeted support? D.E.Bs can help close gaps fast.\n`;
    content += `Contact: 347-364-1906 | info@debslearnacademy.com\n`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Grade6-Math-Diagnostic-${studentName.replace(/\s+/g, "_")}-${assessmentDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Landing Page
  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-amber-50">
        <DEBsHeader subtitle="Grade 6 Math Diagnostic" />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-[#9B59B6] text-white px-6 py-3 rounded-full text-xl font-bold mb-6 shadow-lg">
              📚 GRADE 6 📚
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[#1C2D5A] mb-4">
              Grade 6 Math Diagnostic Test
            </h1>
            
            <p className="text-xl text-gray-600 mb-4">
              Aligned to the New York State Algebra I Regents Curriculum
            </p>
            
            <p className="text-lg text-gray-500 mb-8">
              Comprehensive math assessment covering fractions, decimals, algebra, geometry, and problem-solving
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#9B59B6]">
                <div className="text-3xl mb-2">⏰</div>
                <div className="text-sm text-gray-600">Total Time</div>
                <div className="text-xl font-bold text-[#9B59B6]">90 min</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#9B59B6]">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-sm text-gray-600">Total Points</div>
                <div className="text-xl font-bold text-[#9B59B6]">41</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#9B59B6]">
                <div className="text-3xl mb-2">🧮</div>
                <div className="text-sm text-gray-600">Calculator</div>
                <div className="text-xl font-bold text-[#9B59B6]">Sec II & III</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#9B59B6]">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-sm text-gray-600">Sections</div>
                <div className="text-xl font-bold text-[#9B59B6]">3</div>
              </div>
            </div>

            {/* Student Info Form */}
            <Card className="max-w-md mx-auto mb-8 border-2 border-[#1C2D5A]">
              <CardHeader className="bg-[#1C2D5A] text-white">
                <CardTitle className="text-lg">Student Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="studentName" className="text-[#1C2D5A] font-semibold">
                    Student Name <span className="text-[#D72638]">*</span>
                  </Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assessmentDate" className="text-[#1C2D5A] font-semibold">
                    Date of Assessment <span className="text-[#D72638]">*</span>
                  </Label>
                  <Input
                    id="assessmentDate"
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gradeLevel" className="text-[#1C2D5A] font-semibold">
                    Grade Level
                  </Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={g.toString()}>
                          Grade {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleStartTest}
              size="lg"
              className="bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white text-xl px-10 py-6 rounded-2xl shadow-xl border-4 border-[#FFDE59] transform hover:scale-105 transition-all"
            >
              Start Diagnostic
            </Button>
          </div>
        </main>

        <footer className="bg-[#1C2D5A] text-white py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[#FFDE59] font-semibold text-lg mb-2">
              Unlocking Brilliance Through Learning
            </p>
            <p className="text-sm text-gray-300">
              📞 347-364-1906 • 📧 info@debslearnacademy.com
            </p>
            <p className="text-sm text-gray-400 mt-2">
              © {new Date().getFullYear()} D.E.Bs Learning Academy
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Results Page
  if (submitted) {
    const { score, maxScore } = calculateScore();
    const percentage = Math.round((score / maxScore) * 100);
    const tierInfo = getTier(percentage);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-amber-50 print:bg-white" ref={printRef}>
        <DEBsHeader subtitle="Test Results" />
        
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="mb-8 border-2 border-[#1C2D5A]">
            <CardHeader className="bg-[#1C2D5A] text-white text-center">
              <CardTitle className="text-2xl">Grade 6 Math Diagnostic - Results</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-lg"><strong>Student:</strong> {studentName}</p>
                  <p className="text-lg"><strong>Date:</strong> {assessmentDate}</p>
                  <p className="text-lg"><strong>Grade:</strong> {gradeLevel}</p>
                </div>
                <div className={`text-center p-6 rounded-xl ${tierInfo.bgColor}`}>
                  <p className="text-4xl font-bold mb-2">{score}/{maxScore}</p>
                  <p className="text-2xl font-semibold">{percentage}%</p>
                  <p className={`text-xl font-bold mt-2 ${tierInfo.color}`}>{tierInfo.tier}</p>
                </div>
              </div>

              {/* Section I Results */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#1C2D5A] mb-4 border-b-2 border-[#9B59B6] pb-2">
                  Section I - Multiple Choice (No Calculator)
                </h3>
                <div className="grid gap-3">
                  {sectionIQuestions.map((q) => {
                    const answer = sectionIAnswers[q.id];
                    const isCorrect = answer && answer.charAt(0).toUpperCase() === q.correct;
                    return (
                      <div key={q.id} className={`p-3 rounded-lg ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium">Q{q.number}: {q.question}</p>
                            <p className="text-sm mt-1">
                              Your answer: <span className={isCorrect ? "text-green-700" : "text-red-700"}>{answer || "Not answered"}</span>
                              {!isCorrect && <span className="text-green-700 ml-2">Correct: {q.correct})</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section II Results */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#1C2D5A] mb-4 border-b-2 border-[#9B59B6] pb-2">
                  Section II - Word Problems (Calculator Allowed)
                </h3>
                <div className="grid gap-4">
                  {sectionIIQuestions.map((q) => {
                    const response = sectionIIAnswers[q.id];
                    return (
                      <div key={q.id} className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="font-medium mb-2">Q{q.number}: {q.question}</p>
                        <p className="text-sm"><strong>Answer:</strong> {response?.answer || "Not answered"}</p>
                        <p className="text-sm"><strong>Work:</strong> {response?.work || "None shown"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section III Results */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#1C2D5A] mb-4 border-b-2 border-[#9B59B6] pb-2">
                  Section III - Multi-Step Problems (Selected 3)
                </h3>
                <div className="grid gap-4">
                  {sectionIIIQuestions.filter((q) => selectedSection3Questions.has(q.id)).map((q) => {
                    const response = sectionIIIAnswers[q.id];
                    return (
                      <div key={q.id} className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <p className="font-medium mb-2">Q{q.number}: {q.question}</p>
                        <p className="text-sm"><strong>Answer:</strong> {response?.answer || "Not answered"}</p>
                        <p className="text-sm"><strong>Work:</strong> {response?.work || "None shown"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center print:hidden">
                <Button onClick={handlePrint} className="bg-[#1C2D5A]">
                  <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
                </Button>
                <Button onClick={handleDownload} variant="outline" className="border-[#1C2D5A] text-[#1C2D5A]">
                  <Download className="w-4 h-4 mr-2" /> Download TXT
                </Button>
              </div>

              {/* CTA */}
              <div className="mt-8 p-6 bg-[#FFDE59] rounded-xl text-center print:hidden">
                <p className="text-[#1C2D5A] font-bold text-lg mb-2">
                  Want targeted support? D.E.Bs can help close gaps fast.
                </p>
                <p className="text-[#1C2D5A]">
                  📞 347-364-1906 • 📧 info@debslearnacademy.com
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Test Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-amber-50">
      <DEBsHeader 
        subtitle="Grade 6 Math Diagnostic"
        rightContent={
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getTimerColor()}`}>
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg font-bold">{formatTime(timeRemaining)}</span>
          </div>
        }
      />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {[1, 2, 3].map((sec) => (
              <button
                key={sec}
                onClick={() => setCurrentSection(sec)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currentSection === sec
                    ? "bg-[#9B59B6] text-white"
                    : "bg-white text-[#1C2D5A] border border-[#1C2D5A] hover:bg-gray-50"
                }`}
              >
                Section {sec}
              </button>
            ))}
          </div>
          <p className="text-[#1C2D5A] font-medium">Section {currentSection} of 3</p>
        </div>

        {/* Section I */}
        {currentSection === 1 && (
          <Card className="border-2 border-[#9B59B6]">
            <CardHeader className="bg-[#9B59B6] text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Section I — Multiple Choice</span>
                <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                  No Calculator • 20 points
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 font-medium">
                  <strong>Directions:</strong> Select the best answer for each question. Each question is worth 1 point.
                </p>
              </div>
              
              <div className="space-y-8">
                {sectionIQuestions.map((q) => (
                  <div key={q.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="font-semibold text-[#1C2D5A] mb-4">
                      {q.number}. {q.question}
                    </p>
                    <RadioGroup
                      value={sectionIAnswers[q.id] || ""}
                      onValueChange={(value) => setSectionIAnswers((prev) => ({ ...prev, [q.id]: value }))}
                      className="space-y-2"
                    >
                      {q.options.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                          <RadioGroupItem value={option} id={`${q.id}-${idx}`} />
                          <Label htmlFor={`${q.id}-${idx}`} className="cursor-pointer flex-1">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setCurrentSection(2)} className="bg-[#9B59B6]">
                  Continue to Section II →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section II */}
        {currentSection === 2 && (
          <Card className="border-2 border-[#9B59B6]">
            <CardHeader className="bg-[#9B59B6] text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Section II — Two-Step Word Problems</span>
                <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                  Calculator Allowed • 10 points (2 each)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">
                  <strong>Directions:</strong> Solve each problem. Show your work and write your final answer. Each question is worth 2 points.
                  <br />
                  <span className="text-green-600">🧮 Calculator is ALLOWED for this section.</span>
                </p>
              </div>
              
              <div className="space-y-8">
                {sectionIIQuestions.map((q) => (
                  <div key={q.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="font-semibold text-[#1C2D5A] mb-4">
                      {q.number}. {q.question}
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Your Answer:</Label>
                        <Input
                          value={sectionIIAnswers[q.id]?.answer || ""}
                          onChange={(e) =>
                            setSectionIIAnswers((prev) => ({
                              ...prev,
                              [q.id]: { ...prev[q.id], answer: e.target.value },
                            }))
                          }
                          placeholder="Enter your answer"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Show Your Work:</Label>
                        <Textarea
                          value={sectionIIAnswers[q.id]?.work || ""}
                          onChange={(e) =>
                            setSectionIIAnswers((prev) => ({
                              ...prev,
                              [q.id]: { ...prev[q.id], work: e.target.value },
                            }))
                          }
                          placeholder="Show your calculations and reasoning..."
                          className="mt-1 min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button onClick={() => setCurrentSection(1)} variant="outline" className="border-[#9B59B6] text-[#9B59B6]">
                  ← Back to Section I
                </Button>
                <Button onClick={() => setCurrentSection(3)} className="bg-[#9B59B6]">
                  Continue to Section III →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section III */}
        {currentSection === 3 && (
          <Card className="border-2 border-[#9B59B6]">
            <CardHeader className="bg-[#9B59B6] text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Section III — Multi-Step Problems</span>
                <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                  Calculator Allowed • Choose 3 of 5 • 11 points
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <p className="text-purple-800 font-medium">
                  <strong>Directions:</strong> Select exactly <strong>3 problems</strong> to solve. Check the box next to each problem you choose. Show your work and write your final answer.
                  <br />
                  <span className="text-purple-600">🧮 Calculator is ALLOWED for this section.</span>
                  <br />
                  <span className="font-bold">Selected: {selectedSection3Questions.size}/3</span>
                </p>
              </div>
              
              <div className="space-y-8">
                {sectionIIIQuestions.map((q) => {
                  const isSelected = selectedSection3Questions.has(q.id);
                  const isDisabled = !isSelected && selectedSection3Questions.size >= 3;
                  
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-lg border-2 shadow-sm transition-all ${
                        isSelected
                          ? "bg-purple-50 border-purple-400"
                          : isDisabled
                          ? "bg-gray-100 border-gray-200 opacity-60"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <Checkbox
                          id={`select-${q.id}`}
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={() => handleSection3Selection(q.id)}
                          className="mt-1"
                        />
                        <Label htmlFor={`select-${q.id}`} className="font-semibold text-[#1C2D5A] cursor-pointer">
                          {q.number}. {q.question}
                        </Label>
                      </div>
                      
                      {q.hasGrid && (
                        <div className="ml-6 mb-4">
                          <p className="text-sm text-gray-600 mb-2">Use this coordinate grid for your work:</p>
                          <CoordinateGrid />
                        </div>
                      )}
                      
                      {isSelected && (
                        <div className="ml-6 space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Your Answer:</Label>
                            <Input
                              value={sectionIIIAnswers[q.id]?.answer || ""}
                              onChange={(e) =>
                                setSectionIIIAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: { ...prev[q.id], answer: e.target.value },
                                }))
                              }
                              placeholder="Enter your answer"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Show Your Work:</Label>
                            <Textarea
                              value={sectionIIIAnswers[q.id]?.work || ""}
                              onChange={(e) =>
                                setSectionIIIAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: { ...prev[q.id], work: e.target.value },
                                }))
                              }
                              placeholder="Show your calculations and reasoning..."
                              className="mt-1 min-h-[100px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button onClick={() => setCurrentSection(2)} variant="outline" className="border-[#9B59B6] text-[#9B59B6]">
                  ← Back to Section II
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedSection3Questions.size !== 3}
                  className="bg-[#D72638] hover:bg-[#b81f2e] text-white px-8"
                >
                  Submit Test
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="bg-[#1C2D5A] text-white py-4 mt-8 print:hidden">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#FFDE59] font-semibold">
            D.E.Bs Learning Academy — Unlocking Brilliance Through Learning
          </p>
        </div>
      </footer>
    </div>
  );
}
