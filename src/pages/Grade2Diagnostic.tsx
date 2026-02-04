import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Printer, Download, CheckCircle2, AlertCircle, Star } from "lucide-react";
import DEBsHeader from "@/components/DEBsHeader";
import {
  getDiagramForQuestion,
  getPictureHelperForQuestion,
  getDrawAreaForQuestion,
} from "@/components/diagrams/Grade2Diagrams";

// Section I Questions - Multiple Choice (20 questions, 1 point each)
const sectionIQuestions = [
  { id: "q1", number: 1, question: "What is 3 tens + 5 ones?", options: ["A) 8", "B) 35", "C) 53", "D) 15", "E) I don't know"], correct: "B", hasDiagram: true },
  { id: "q2", number: 2, question: "What number comes after 49?", options: ["A) 48", "B) 50", "C) 59", "D) 40", "E) I don't know"], correct: "B" },
  { id: "q3", number: 3, question: "Which is greater: 67 or 76?", options: ["A) 67", "B) 76", "C) They are equal", "D) Cannot tell", "E) I don't know"], correct: "B" },
  { id: "q4", number: 4, question: "What is 14 + 25?", options: ["A) 39", "B) 29", "C) 49", "D) 38", "E) I don't know"], correct: "A" },
  { id: "q5", number: 5, question: "What is 53 - 21?", options: ["A) 42", "B) 32", "C) 22", "D) 74", "E) I don't know"], correct: "B" },
  { id: "q6", number: 6, question: "Skip count by 5s: 5, 10, 15, ___", options: ["A) 16", "B) 25", "C) 20", "D) 18", "E) I don't know"], correct: "C" },
  { id: "q7", number: 7, question: "Which shape has 4 equal sides?", options: ["A) Rectangle", "B) Triangle", "C) Square", "D) Circle", "E) I don't know"], correct: "C" },
  { id: "q8", number: 8, question: "How many sides does a triangle have?", options: ["A) 2", "B) 3", "C) 4", "D) 5", "E) I don't know"], correct: "B" },
  { id: "q9", number: 9, question: "What time is shown on the clock?", options: ["A) 2:00", "B) 6:00", "C) 2:30", "D) 3:30", "E) I don't know"], correct: "C", hasDiagram: true },
  { id: "q10", number: 10, question: "How much money is a quarter, dime, and nickel?", options: ["A) 30¢", "B) 35¢", "C) 40¢", "D) 45¢", "E) I don't know"], correct: "C", hasDiagram: true },
  { id: "q11", number: 11, question: "What is an even number?", options: ["A) 7", "B) 13", "C) 8", "D) 15", "E) I don't know"], correct: "C" },
  { id: "q12", number: 12, question: "What is 7 + 8?", options: ["A) 14", "B) 15", "C) 16", "D) 17", "E) I don't know"], correct: "B" },
  { id: "q13", number: 13, question: "What fraction of the circle is shaded?", options: ["A) 1/4", "B) 1/2", "C) 2/4", "D) 3/4", "E) I don't know"], correct: "C", hasDiagram: true },
  { id: "q14", number: 14, question: "How long is the pencil?", options: ["A) 4 inches", "B) 5 inches", "C) 6 inches", "D) 7 inches", "E) I don't know"], correct: "C", hasDiagram: true },
  { id: "q15", number: 15, question: "Which number sentence is true?", options: ["A) 5 > 8", "B) 3 < 2", "C) 9 > 6", "D) 4 = 7", "E) I don't know"], correct: "C" },
  { id: "q16", number: 16, question: "Look at the bar graph. How many more chose Red than Green?", options: ["A) 2", "B) 3", "C) 4", "D) 5", "E) I don't know"], correct: "C", hasDiagram: true },
  { id: "q17", number: 17, question: "What is 100 - 40?", options: ["A) 50", "B) 60", "C) 70", "D) 140", "E) I don't know"], correct: "B" },
  { id: "q18", number: 18, question: "How many corners does a rectangle have?", options: ["A) 2", "B) 3", "C) 4", "D) 5", "E) I don't know"], correct: "C" },
  { id: "q19", number: 19, question: "What is the missing number: 2, 4, 6, ___, 10?", options: ["A) 7", "B) 8", "C) 9", "D) 12", "E) I don't know"], correct: "B" },
  { id: "q20", number: 20, question: "How many faces does a cube have?", options: ["A) 4", "B) 5", "C) 6", "D) 8", "E) I don't know"], correct: "C", hasDiagram: true },
];

// Section II Questions - Word Problems (5 questions, 2 points each)
const sectionIIQuestions = [
  { id: "q21", number: 21, question: "Emma has 15 apples. Her mom gives her 8 more. How many apples does Emma have now?" },
  { id: "q22", number: 22, question: "There are 32 birds in a tree. 14 fly away. How many birds are left?" },
  { id: "q23", number: 23, question: "A tricycle has 3 wheels. How many wheels do 6 tricycles have?" },
  { id: "q24", number: 24, question: "Jake has a half-dollar, a dime, and a nickel. How much money does he have?" },
  { id: "q25", number: 25, question: "There are 20 pencils. They are put into groups of 5. How many groups are there?" },
];

// Section III Questions - Extended Response (5 questions, choose any 3)
const sectionIIIQuestions = [
  { id: "q26", number: 26, question: "Show how to split 24 objects into 2 equal groups. Draw your answer and explain." },
  { id: "q27", number: 27, question: "Draw a shape that shows 3/4. Shade the correct part and explain what 3/4 means." },
  { id: "q28", number: 28, question: "Draw a line that is exactly 5 inches long. Use the ruler to help you." },
  { id: "q29", number: 29, question: "Create a bar graph showing: Dogs got 8 votes, Cats got 6 votes, Fish got 4 votes." },
  { id: "q30", number: 30, question: "Use base-ten blocks to show the number 147. Draw hundreds, tens, and ones." },
];

export default function Grade2Diagnostic() {
  const [showLanding, setShowLanding] = useState(true);
  const [currentSection, setCurrentSection] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [gradeLevel, setGradeLevel] = useState("2");
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Answers state
  const [sectionIAnswers, setSectionIAnswers] = useState<Record<string, string>>({});
  const [sectionIIAnswers, setSectionIIAnswers] = useState<Record<string, { answer: string; work: string }>>({});
  const [sectionIIIAnswers, setSectionIIIAnswers] = useState<Record<string, { answer: string; explanation: string }>>({});
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
    return "bg-green-100 text-green-900 border-green-300";
  };

  const handleStartTest = () => {
    if (!studentName.trim()) {
      toast.error("Please enter student name");
      return;
    }
    setShowLanding(false);
    setTestStarted(true);
    toast.success("Good luck! You can do it! ⭐");
  };

  const handleSection3Selection = (questionId: string) => {
    setSelectedSection3Questions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else if (newSet.size < 3) {
        newSet.add(questionId);
      } else {
        toast.error("You can only pick 3 problems. Uncheck one to choose another!");
      }
      return newSet;
    });
  };

  const calculateScore = () => {
    let score = 0;
    const maxScore = 41;
    
    // Section I: 20 points (1 each)
    sectionIQuestions.forEach((q) => {
      const answer = sectionIAnswers[q.id];
      if (answer && answer.charAt(0).toUpperCase() === q.correct) {
        score += 1;
      }
    });
    
    // Section II: 10 points (2 each)
    sectionIIQuestions.forEach((q) => {
      const response = sectionIIAnswers[q.id];
      if (response?.answer?.trim()) {
        score += 2;
      }
    });
    
    // Section III: 11 points total for 3 selected questions
    const selectedQs = Array.from(selectedSection3Questions);
    selectedQs.forEach((qId, index) => {
      const response = sectionIIIAnswers[qId];
      if (response?.answer?.trim() || response?.explanation?.trim()) {
        score += index === 0 ? 3 : 4;
      }
    });
    
    return { score, maxScore };
  };

  const getTier = (percentage: number) => {
    if (percentage >= 80) return { tier: "Tier 1", color: "text-green-600", bgColor: "bg-green-100", emoji: "🌟" };
    if (percentage >= 50) return { tier: "Tier 2", color: "text-yellow-600", bgColor: "bg-yellow-100", emoji: "⭐" };
    return { tier: "Tier 3", color: "text-red-600", bgColor: "bg-red-100", emoji: "💪" };
  };

  const handleSubmit = () => {
    if (selectedSection3Questions.size !== 3) {
      toast.error("Please pick exactly 3 problems in Section III before finishing!");
      return;
    }
    setSubmitted(true);
    toast.success("Great job finishing the test! 🎉");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const { score, maxScore } = calculateScore();
    const percentage = Math.round((score / maxScore) * 100);
    const tierInfo = getTier(percentage);
    
    let content = `D.E.Bs LEARNING ACADEMY\nGrade 2 Diagnostic Math Test Results\n${"=".repeat(50)}\n\n`;
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
    
    content += `${"=".repeat(50)}\nSECTION III - Extended Response (Selected)\n${"=".repeat(50)}\n\n`;
    sectionIIIQuestions.forEach((q) => {
      if (selectedSection3Questions.has(q.id)) {
        const response = sectionIIIAnswers[q.id];
        content += `Q${q.number}: ${q.question}\n`;
        content += `Answer: ${response?.answer || "Not answered"}\n`;
        content += `Explanation: ${response?.explanation || "None given"}\n\n`;
      }
    });
    
    content += `\n${"=".repeat(50)}\nWant targeted support? D.E.Bs can help close gaps fast!\n`;
    content += `Contact: 347-364-1906 | info@debslearnacademy.com\n`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Grade2-Math-Diagnostic-${studentName.replace(/\s+/g, "_")}-${assessmentDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Landing Page
  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-50 to-blue-100">
        <DEBsHeader subtitle="Grade 2 Math Diagnostic" />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-[#FFDE59] text-[#1C2D5A] px-6 py-3 rounded-full text-xl font-bold mb-6 shadow-lg animate-bounce">
              ⭐ GRADE 2 ⭐
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[#1C2D5A] mb-4">
              Grade 2 Math Diagnostic Test
            </h1>
            
            <p className="text-xl text-[#1C2D5A] mb-4">
              Fun math for awesome second graders! 🌈
            </p>
            
            <p className="text-lg text-gray-600 mb-8">
              Let's see what you know about numbers, shapes, and more!
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-white rounded-xl p-4 shadow-md border-4 border-[#FFDE59]">
                <div className="text-4xl mb-2">⏰</div>
                <div className="text-sm text-gray-600">Total Time</div>
                <div className="text-xl font-bold text-[#1C2D5A]">60 min</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-4 border-[#87CEEB]">
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-sm text-gray-600">Total Points</div>
                <div className="text-xl font-bold text-[#1C2D5A]">41</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-4 border-[#98D8AA]">
                <div className="text-4xl mb-2">📝</div>
                <div className="text-sm text-gray-600">Questions</div>
                <div className="text-xl font-bold text-[#1C2D5A]">30</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-4 border-[#F8B4D9]">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-sm text-gray-600">Sections</div>
                <div className="text-xl font-bold text-[#1C2D5A]">3</div>
              </div>
            </div>

            {/* Student Info Form */}
            <Card className="max-w-md mx-auto mb-8 border-4 border-[#1C2D5A]">
              <CardHeader className="bg-[#1C2D5A] text-white">
                <CardTitle className="text-lg flex items-center gap-2 justify-center">
                  <Star className="h-5 w-5" /> Your Information <Star className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-gradient-to-b from-yellow-50 to-white">
                <div>
                  <Label htmlFor="studentName" className="text-[#1C2D5A] font-semibold text-lg">
                    Your Name <span className="text-[#D72638]">*</span>
                  </Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Type your name here"
                    className="mt-1 text-lg border-2 border-[#1C2D5A]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assessmentDate" className="text-[#1C2D5A] font-semibold">
                    Today's Date <span className="text-[#D72638]">*</span>
                  </Label>
                  <Input
                    id="assessmentDate"
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    className="mt-1 border-2 border-[#1C2D5A]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gradeLevel" className="text-[#1C2D5A] font-semibold">
                    Your Grade
                  </Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger className="mt-1 border-2 border-[#1C2D5A]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((g) => (
                        <SelectItem key={g} value={g.toString()}>
                          Grade {g} {g === 2 && "⭐"}
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
              className="bg-[#D72638] hover:bg-[#B01E2D] text-white text-2xl px-12 py-8 rounded-full shadow-lg transform hover:scale-105 transition-transform"
            >
              🚀 Start the Test! 🚀
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Results View
  if (submitted) {
    const { score, maxScore } = calculateScore();
    const percentage = Math.round((score / maxScore) * 100);
    const tierInfo = getTier(percentage);

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-50 to-blue-100 print:bg-white">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-break { page-break-before: always; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
        <DEBsHeader subtitle="Grade 2 Math Diagnostic" />
        
        <main className="container mx-auto px-4 py-8" ref={printRef}>
          <Card className="max-w-4xl mx-auto mb-8 border-4 border-[#1C2D5A]">
            <CardHeader className="bg-[#1C2D5A] text-white text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                🎉 Great Job, {studentName}! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className={`inline-block px-8 py-4 rounded-full ${tierInfo.bgColor} mb-4`}>
                  <span className="text-6xl">{tierInfo.emoji}</span>
                  <p className={`text-3xl font-bold ${tierInfo.color}`}>{tierInfo.tier}</p>
                </div>
                <p className="text-4xl font-bold text-[#1C2D5A]">
                  {score} / {maxScore} points
                </p>
                <p className="text-2xl text-gray-600">({percentage}%)</p>
              </div>

              <div className="flex justify-center gap-4 mb-8 no-print">
                <Button onClick={handlePrint} className="bg-[#1C2D5A] hover:bg-[#0F1A33] flex items-center gap-2">
                  <Printer className="h-5 w-5" /> Print / Save PDF
                </Button>
                <Button onClick={handleDownload} variant="outline" className="border-[#1C2D5A] text-[#1C2D5A] flex items-center gap-2">
                  <Download className="h-5 w-5" /> Download
                </Button>
              </div>

              {/* Section I Results */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#1C2D5A] mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" /> Section I Results
                </h3>
                <div className="grid gap-2">
                  {sectionIQuestions.map((q) => {
                    const answer = sectionIAnswers[q.id];
                    const isCorrect = answer && answer.charAt(0).toUpperCase() === q.correct;
                    return (
                      <div key={q.id} className={`p-3 rounded-lg flex items-center gap-3 ${isCorrect ? "bg-green-50" : "bg-red-50"}`}>
                        <span className={`text-xl ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                          {isCorrect ? "✓" : "✗"}
                        </span>
                        <span className="font-medium">Q{q.number}</span>
                        <span className="text-gray-600 flex-1">{answer || "No answer"}</span>
                        {!isCorrect && <span className="text-sm text-gray-500">Correct: {q.correct}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-[#FFDE59] to-[#FFB347] p-6 rounded-xl text-center">
                <p className="text-xl font-bold text-[#1C2D5A] mb-2">
                  Want to get even better at math? 📚
                </p>
                <p className="text-[#1C2D5A]">
                  D.E.Bs Learning Academy can help you become a math superstar!
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Test View
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-50 to-blue-100 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .print-only { display: none; }
      `}</style>
      
      <DEBsHeader 
        subtitle="Grade 2 Math Diagnostic"
        rightContent={
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getTimerColor()} no-print`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
          </div>
        }
      />

      <main className="container mx-auto px-4 py-6">
        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-6 no-print">
          <div className="flex items-center justify-center gap-4 mb-4">
            {[1, 2, 3].map((section) => (
              <button
                key={section}
                onClick={() => setCurrentSection(section)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg transition-all ${
                  currentSection === section
                    ? "bg-[#1C2D5A] text-white scale-110 shadow-lg"
                    : "bg-white text-[#1C2D5A] border-2 border-[#1C2D5A] hover:bg-gray-50"
                }`}
              >
                Section {section}
              </button>
            ))}
          </div>
          <p className="text-center text-[#1C2D5A] font-medium">
            Section {currentSection} of 3
          </p>
        </div>

        {/* Section I */}
        {currentSection === 1 && (
          <Card className="max-w-4xl mx-auto mb-8 border-4 border-[#FFDE59]">
            <CardHeader className="bg-[#FFDE59]">
              <CardTitle className="text-[#1C2D5A] text-xl flex items-center gap-2">
                ⭐ Section I: Multiple Choice ⭐
              </CardTitle>
              <p className="text-[#1C2D5A]">20 questions • 1 point each • Pick the best answer!</p>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {sectionIQuestions.map((q) => (
                <div key={q.id} className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-200">
                  <p className="font-bold text-lg text-[#1C2D5A] mb-4">
                    <span className="inline-block bg-[#1C2D5A] text-white px-3 py-1 rounded-full mr-2">
                      {q.number}
                    </span>
                    {q.question}
                  </p>
                  
                  {/* Render diagram if applicable */}
                  {q.hasDiagram && getDiagramForQuestion(q.id)}
                  
                  <RadioGroup
                    value={sectionIAnswers[q.id] || ""}
                    onValueChange={(value) => setSectionIAnswers({ ...sectionIAnswers, [q.id]: value })}
                    className="space-y-3"
                  >
                    {q.options.map((option, idx) => (
                      <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-yellow-50 transition-colors">
                        <RadioGroupItem
                          value={option}
                          id={`${q.id}-${idx}`}
                          className="border-2 border-[#1C2D5A]"
                        />
                        <Label htmlFor={`${q.id}-${idx}`} className="text-lg cursor-pointer flex-1">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentSection(2)}
                  className="bg-[#1C2D5A] hover:bg-[#0F1A33] text-lg px-8 py-6"
                >
                  Next: Word Problems →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section II */}
        {currentSection === 2 && (
          <Card className="max-w-4xl mx-auto mb-8 border-4 border-[#87CEEB]">
            <CardHeader className="bg-[#87CEEB]">
              <CardTitle className="text-[#1C2D5A] text-xl flex items-center gap-2">
                📝 Section II: Word Problems 📝
              </CardTitle>
              <p className="text-[#1C2D5A]">5 questions • 2 points each • Show your work!</p>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {sectionIIQuestions.map((q) => (
                <div key={q.id} className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-200">
                  <p className="font-bold text-lg text-[#1C2D5A] mb-4">
                    <span className="inline-block bg-[#1C2D5A] text-white px-3 py-1 rounded-full mr-2">
                      {q.number}
                    </span>
                    {q.question}
                  </p>
                  
                  {/* Picture Helper */}
                  {getPictureHelperForQuestion(q.id)}
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-[#1C2D5A] font-medium text-lg">Your Answer:</Label>
                      <Input
                        value={sectionIIAnswers[q.id]?.answer || ""}
                        onChange={(e) =>
                          setSectionIIAnswers({
                            ...sectionIIAnswers,
                            [q.id]: { ...sectionIIAnswers[q.id], answer: e.target.value },
                          })
                        }
                        placeholder="Write your answer here"
                        className="mt-1 text-lg border-2 border-[#1C2D5A]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#1C2D5A] font-medium">Show your work:</Label>
                      <Textarea
                        value={sectionIIAnswers[q.id]?.work || ""}
                        onChange={(e) =>
                          setSectionIIAnswers({
                            ...sectionIIAnswers,
                            [q.id]: { ...sectionIIAnswers[q.id], work: e.target.value },
                          })
                        }
                        placeholder="Show how you solved it..."
                        className="mt-1 border-2 border-[#1C2D5A] min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between">
                <Button
                  onClick={() => setCurrentSection(1)}
                  variant="outline"
                  className="border-[#1C2D5A] text-[#1C2D5A] text-lg px-8 py-6"
                >
                  ← Back
                </Button>
                <Button
                  onClick={() => setCurrentSection(3)}
                  className="bg-[#1C2D5A] hover:bg-[#0F1A33] text-lg px-8 py-6"
                >
                  Next: Draw & Explain →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section III */}
        {currentSection === 3 && (
          <Card className="max-w-4xl mx-auto mb-8 border-4 border-[#98D8AA]">
            <CardHeader className="bg-[#98D8AA]">
              <CardTitle className="text-[#1C2D5A] text-xl flex items-center gap-2">
                🎨 Section III: Draw & Explain 🎨
              </CardTitle>
              <p className="text-[#1C2D5A]">Pick ANY 3 problems • 11 points total • Draw and explain!</p>
              <div className="mt-2 bg-white/50 p-3 rounded-lg">
                <p className="text-[#1C2D5A] font-bold">
                  Selected: {selectedSection3Questions.size} of 3 
                  {selectedSection3Questions.size < 3 && " (pick more!)"}
                  {selectedSection3Questions.size === 3 && " ✓"}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {sectionIIIQuestions.map((q) => {
                const isSelected = selectedSection3Questions.has(q.id);
                const isLocked = selectedSection3Questions.size >= 3 && !isSelected;
                
                return (
                  <div
                    key={q.id}
                    className={`p-6 rounded-xl shadow-md border-4 transition-all ${
                      isSelected
                        ? "bg-green-50 border-green-400"
                        : isLocked
                        ? "bg-gray-100 border-gray-300 opacity-60"
                        : "bg-white border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <button
                        onClick={() => handleSection3Selection(q.id)}
                        disabled={isLocked}
                        className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-green-500 border-green-600 text-white"
                            : isLocked
                            ? "border-gray-300 cursor-not-allowed"
                            : "border-[#1C2D5A] hover:bg-green-100"
                        }`}
                      >
                        {isSelected && "✓"}
                      </button>
                      <div className="flex-1">
                        <p className="font-bold text-lg text-[#1C2D5A]">
                          <span className="inline-block bg-[#1C2D5A] text-white px-3 py-1 rounded-full mr-2">
                            {q.number}
                          </span>
                          {q.question}
                        </p>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <>
                        {/* Draw Area */}
                        {getDrawAreaForQuestion(q.id)}
                        
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label className="text-[#1C2D5A] font-medium">Your Answer:</Label>
                            <Input
                              value={sectionIIIAnswers[q.id]?.answer || ""}
                              onChange={(e) =>
                                setSectionIIIAnswers({
                                  ...sectionIIIAnswers,
                                  [q.id]: { ...sectionIIIAnswers[q.id], answer: e.target.value },
                                })
                              }
                              placeholder="Write your answer"
                              className="mt-1 text-lg border-2 border-[#1C2D5A]"
                            />
                          </div>
                          <div>
                            <Label className="text-[#1C2D5A] font-medium">Explain here:</Label>
                            <Textarea
                              value={sectionIIIAnswers[q.id]?.explanation || ""}
                              onChange={(e) =>
                                setSectionIIIAnswers({
                                  ...sectionIIIAnswers,
                                  [q.id]: { ...sectionIIIAnswers[q.id], explanation: e.target.value },
                                })
                              }
                              placeholder="Tell us how you solved it..."
                              className="mt-1 border-2 border-[#1C2D5A] min-h-[100px]"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              
              <div className="flex justify-between items-center">
                <Button
                  onClick={() => setCurrentSection(2)}
                  variant="outline"
                  className="border-[#1C2D5A] text-[#1C2D5A] text-lg px-8 py-6"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedSection3Questions.size !== 3}
                  className="bg-[#D72638] hover:bg-[#B01E2D] text-white text-xl px-12 py-6 rounded-full shadow-lg"
                >
                  🎉 Finish Test! 🎉
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
