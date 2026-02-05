import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  FileText, 
  Download, 
  Printer, 
  Palette,
  Eraser,
  Pencil,
  Sun,
  Users,
  TreeDeciduous
} from "lucide-react";
import DEBsHeader from "@/components/DEBsHeader";

// Constants
const STORAGE_KEY = "grade1-ela-diagnostic-draft";

// Answer key for Section 1
const ANSWER_KEY: Record<number, string> = {
  1: "B", 2: "A", 3: "B", 4: "C", 5: "B",
  6: "C", 7: "B", 8: "B", 9: "A", 10: "A",
  11: "B", 12: "A", 13: "B", 14: "C", 15: "B",
  16: "B", 17: "C", 18: "B", 19: "C", 20: "C"
};

// Section 1 Questions
const SECTION1_QUESTIONS = [
  { id: 1, text: "Which letter makes the /b/ sound?", choices: ["d", "b", "p", "q"] },
  { id: 2, text: 'What is the beginning sound in "cat"?', choices: ["/k/", "/s/", "/t/", "/m/"] },
  { id: 3, text: 'Which word rhymes with "cat"?', choices: ["dog", "hat", "sun", "run"] },
  { id: 4, text: 'How many sounds do you hear in "dog"?', choices: ["1", "2", "3", "4"] },
  { id: 5, text: 'Which letter comes after "M"?', choices: ["L", "N", "O", "K"] },
  { id: 6, text: 'What is the ending sound in "map"?', choices: ["/m/", "/a/", "/p/", "/t/"] },
  { id: 7, text: "Circle the uppercase letter: a  B  c  d", choices: ["a", "B", "c", "d"] },
  { id: 8, text: 'Which word starts with the same sound as "sun"?', choices: ["cat", "sat", "fun", "run"] },
  { id: 9, text: "What vowel is missing? c__t", choices: ["a", "e", "i", "u"] },
  { id: 10, text: "Which is a sight word you should know?", choices: ["the", "xyz", "qrs", "lmn"] },
  { id: 11, text: '"I see a dog." What do you see?', choices: ["cat", "dog", "car", "sun"] },
  { id: 12, text: 'Which two words make a sentence? "I ___"', choices: ["run", "cat dog", "the and", "xyz"] },
  { id: 13, text: '"I like cats___" What comes at the end?', choices: ["?", ".", "!", ","] },
  { id: 14, text: "Which word is spelled correctly?", choices: ["teh", "hte", "the", "het"] },
  { id: 15, text: 'How many words in "I can run."?', choices: ["2", "3", "4", "5"] },
  { id: 16, text: '"The cat is big." What is big?', choices: ["dog", "cat", "car", "sun"] },
  { id: 17, text: "Which word names a person?", choices: ["run", "jump", "mom", "happy"] },
  { id: 18, text: "Which word means more than one?", choices: ["cat", "cats", "run", "jump"] },
  { id: 19, text: "Which letter is a vowel?", choices: ["b", "c", "a", "d"] },
  { id: 20, text: '"We go to school." Where do we go?', choices: ["home", "park", "school", "store"] }
];

// Section 2 Questions
const SECTION2_QUESTIONS = [
  { id: 21, text: 'Write three words that rhyme with "cat."' },
  { id: 22, text: '"The dog runs fast." Who runs fast?' },
  { id: 23, text: 'Write a sentence using the word "play."' },
  { id: 24, text: "What are the five vowels? Write them." },
  { id: 25, text: 'Circle the capital letters: "the cat is Big."' }
];

// Section 3 Questions
const SECTION3_QUESTIONS = [
  { id: 26, text: "Draw your favorite animal. Write its name and one sentence about it.", hasDrawing: true },
  { id: 27, text: "Draw a picture of your family. Write the names of people in your family.", hasDrawing: true },
  { id: 28, text: "Look at the picture. Write three sentences about what you see.", hasImage: true },
  { id: 29, text: "Write the alphabet in order from A to Z.", isAlphabet: true },
  { id: 30, text: "Write about your favorite thing to do. Draw a picture to show it.", hasDrawing: true }
];

// Drawing Canvas Component
const DrawingCanvas: React.FC<{
  questionId: number;
  savedData: string;
  onSave: (data: string) => void;
}> = ({ questionId, savedData, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#1C2D5A");
  const [brushSize, setBrushSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load saved drawing
    if (savedData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = savedData;
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSave("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {["#1C2D5A", "#D72638", "#FFDE59", "#22C55E", "#3B82F6", "#A855F7"].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-gray-800 ring-2 ring-offset-2" : "border-gray-300"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-1">
          <Eraser className="w-4 h-4" /> Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={250}
        className="border-2 border-dashed border-gray-300 rounded-xl bg-white touch-none cursor-crosshair w-full max-w-md"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};

// Park Scene Image Component
const ParkSceneImage: React.FC = () => (
  <div className="bg-gradient-to-b from-sky-300 to-sky-100 rounded-xl p-4 border-2 border-sky-400 mb-4">
    <svg viewBox="0 0 400 200" className="w-full max-w-md mx-auto">
      {/* Sky */}
      <rect x="0" y="0" width="400" height="120" fill="#87CEEB" />
      {/* Sun */}
      <circle cx="350" cy="40" r="30" fill="#FFDE59" />
      {/* Grass */}
      <rect x="0" y="120" width="400" height="80" fill="#22C55E" />
      {/* Trees */}
      <circle cx="50" cy="100" r="35" fill="#16A34A" />
      <rect x="45" y="120" width="10" height="30" fill="#8B4513" />
      <circle cx="350" cy="100" r="35" fill="#16A34A" />
      <rect x="345" y="120" width="10" height="30" fill="#8B4513" />
      {/* Children playing */}
      <circle cx="150" cy="130" r="12" fill="#FDBF6F" /> {/* Head 1 */}
      <rect x="145" y="142" width="10" height="20" fill="#D72638" />
      <circle cx="200" cy="135" r="12" fill="#FDBF6F" /> {/* Head 2 */}
      <rect x="195" y="147" width="10" height="20" fill="#3B82F6" />
      <circle cx="250" cy="128" r="12" fill="#FDBF6F" /> {/* Head 3 */}
      <rect x="245" y="140" width="10" height="20" fill="#A855F7" />
      {/* Ball */}
      <circle cx="180" cy="170" r="10" fill="#D72638" />
      {/* Swing set */}
      <rect x="290" y="100" width="5" height="70" fill="#6B7280" />
      <rect x="320" y="100" width="5" height="70" fill="#6B7280" />
      <rect x="285" y="100" width="45" height="5" fill="#6B7280" />
      <rect x="305" y="130" width="10" height="5" fill="#8B4513" />
    </svg>
    <p className="text-center text-sm text-sky-700 mt-2 font-medium">
      🌞 A sunny day at the park with children playing! 🎈
    </p>
  </div>
);

// Alphabet Input Component
const AlphabetInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const letters = value.toUpperCase().split("").filter(c => /[A-Z]/.test(c));
  
  return (
    <div className="space-y-4">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A B C D E F G H I J K L M N O P Q R S T U V W X Y Z"
        className="text-2xl font-mono tracking-widest h-32 text-center"
      />
      <div className="flex flex-wrap gap-1 justify-center">
        {letters.map((letter, i) => (
          <span
            key={i}
            className={`w-8 h-8 rounded flex items-center justify-center text-lg font-bold ${
              letter === String.fromCharCode(65 + i) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {letter}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Letters entered: {letters.length}/26
      </p>
    </div>
  );
};

// Main Component
const Grade1ELADiagnostic: React.FC = () => {
  // State
  const [phase, setPhase] = useState<"landing" | "test" | "results">("landing");
  const [studentInfo, setStudentInfo] = useState({ name: "", date: "", teacher: "" });
  const [currentSection, setCurrentSection] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [drawings, setDrawings] = useState<Record<number, string>>({});
  const [manualScores, setManualScores] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes
  const [encouragement, setEncouragement] = useState("");

  const encouragements = [
    "You're doing great! ⭐",
    "Keep going! 🌟",
    "Awesome work! 🎉",
    "You're so smart! 🧠",
    "Almost there! 💪"
  ];

  // Load saved draft
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.studentInfo) setStudentInfo(data.studentInfo);
        if (data.answers) setAnswers(data.answers);
        if (data.drawings) setDrawings(data.drawings);
        if (data.currentSection) setCurrentSection(data.currentSection);
        if (data.currentQuestionIndex) setCurrentQuestionIndex(data.currentQuestionIndex);
        if (data.phase === "test") setPhase("test");
      } catch (e) {
        console.error("Error loading saved draft:", e);
      }
    }
  }, []);

  // Save draft
  useEffect(() => {
    if (phase === "test") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        studentInfo,
        answers,
        drawings,
        currentSection,
        currentQuestionIndex,
        phase
      }));
    }
  }, [answers, drawings, currentSection, currentQuestionIndex, phase, studentInfo]);

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Show encouragement periodically
  useEffect(() => {
    if (phase !== "test") return;
    const interval = setInterval(() => {
      setEncouragement(encouragements[Math.floor(Math.random() * encouragements.length)]);
      setTimeout(() => setEncouragement(""), 3000);
    }, 30000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getCurrentQuestions = () => {
    switch (currentSection) {
      case 1: return SECTION1_QUESTIONS;
      case 2: return SECTION2_QUESTIONS;
      case 3: return SECTION3_QUESTIONS;
      default: return [];
    }
  };

  const getTotalQuestions = () => {
    return SECTION1_QUESTIONS.length + SECTION2_QUESTIONS.length + SECTION3_QUESTIONS.length;
  };

  const getOverallQuestionNumber = () => {
    let count = currentQuestionIndex + 1;
    if (currentSection === 2) count += SECTION1_QUESTIONS.length;
    if (currentSection === 3) count += SECTION1_QUESTIONS.length + SECTION2_QUESTIONS.length;
    return count;
  };

  const calculateSection1Score = () => {
    let correct = 0;
    for (let i = 1; i <= 20; i++) {
      const answer = answers[i];
      if (answer && answer.toUpperCase() === ANSWER_KEY[i]) {
        correct++;
      }
    }
    return correct;
  };

  const calculateTotalScore = () => {
    const section1 = calculateSection1Score();
    let section2 = 0, section3 = 0;
    for (let i = 21; i <= 25; i++) {
      section2 += manualScores[i] || 0;
    }
    for (let i = 26; i <= 30; i++) {
      section3 += manualScores[i] || 0;
    }
    return section1 + section2 + section3;
  };

  const getPerformanceBand = (score: number) => {
    if (score >= 45) return { label: "Advanced", color: "bg-green-500", emoji: "🌟" };
    if (score >= 35) return { label: "Proficient", color: "bg-blue-500", emoji: "⭐" };
    if (score >= 25) return { label: "Developing", color: "bg-yellow-500", emoji: "📚" };
    return { label: "Intensive Support", color: "bg-red-500", emoji: "💪" };
  };

  const startTest = () => {
    if (!studentInfo.name.trim()) {
      alert("Please enter student name");
      return;
    }
    setStudentInfo(prev => ({
      ...prev,
      date: prev.date || new Date().toLocaleDateString()
    }));
    setPhase("test");
  };

  const finishTest = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPhase("results");
  };

  const handleNext = () => {
    const questions = getCurrentQuestions();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSection < 3) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestionIndex(0);
    } else {
      finishTest();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      const prevQuestions = currentSection === 2 ? SECTION1_QUESTIONS : SECTION2_QUESTIONS;
      setCurrentQuestionIndex(prevQuestions.length - 1);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleDrawingSave = (questionId: number, data: string) => {
    setDrawings(prev => ({ ...prev, [questionId]: data }));
  };

  const exportJSON = () => {
    const data = {
      studentInfo,
      answers,
      drawings: Object.keys(drawings).reduce((acc, key) => {
        acc[key] = drawings[parseInt(key)] ? "[Drawing Data]" : null;
        return acc;
      }, {} as Record<string, string | null>),
      scores: {
        section1: calculateSection1Score(),
        section2: Object.entries(manualScores).filter(([k]) => parseInt(k) >= 21 && parseInt(k) <= 25).reduce((sum, [, v]) => sum + v, 0),
        section3: Object.entries(manualScores).filter(([k]) => parseInt(k) >= 26 && parseInt(k) <= 30).reduce((sum, [, v]) => sum + v, 0),
        total: calculateTotalScore()
      },
      performanceBand: getPerformanceBand(calculateTotalScore()).label
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentInfo.name.replace(/\s+/g, "_")}_Grade1_ELA_Results.json`;
    a.click();
  };

  const printResults = () => {
    window.print();
  };

  // Landing Screen
  if (phase === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-amber-50">
      <DEBsHeader subtitle="Grade 1 ELA Diagnostic Assessment" />
        
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-2 border-[#1C2D5A]/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-[#1C2D5A] to-[#2d4a8a] text-white rounded-t-lg">
              <div className="text-center">
                <CardTitle className="text-3xl font-bold mb-2">📚 Let's Learn!</CardTitle>
                <p className="text-lg opacity-90">Unlocking Brilliance Through Learning</p>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <h3 className="font-bold text-[#1C2D5A] mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> Test Information
                </h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>⏱️ Time: 45 minutes</li>
                  <li>📝 Questions: 30 total</li>
                  <li>⭐ Points: 50 total</li>
                  <li>📖 Section 1: Letters and Sounds (20 questions)</li>
                  <li>✏️ Section 2: Reading and Writing (5 questions)</li>
                  <li>🎨 Section 3: Drawing and Writing (5 questions)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-lg font-semibold text-[#1C2D5A]">
                    Student Name
                  </Label>
                  <Input
                    id="name"
                    value={studentInfo.name}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                    className="text-xl h-14 mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="font-semibold text-[#1C2D5A]">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={studentInfo.date}
                      onChange={(e) => setStudentInfo(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher" className="font-semibold text-[#1C2D5A]">Teacher</Label>
                    <Input
                      id="teacher"
                      value={studentInfo.teacher}
                      onChange={(e) => setStudentInfo(prev => ({ ...prev, teacher: e.target.value }))}
                      placeholder="Teacher name"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={startTest}
                className="w-full h-16 text-2xl bg-[#FFDE59] hover:bg-[#f5d654] text-[#1C2D5A] font-bold rounded-xl shadow-lg"
              >
                🚀 Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results Screen
  if (phase === "results") {
    const section1Score = calculateSection1Score();
    const section2Score = Object.entries(manualScores).filter(([k]) => parseInt(k) >= 21 && parseInt(k) <= 25).reduce((sum, [, v]) => sum + v, 0);
    const section3Score = Object.entries(manualScores).filter(([k]) => parseInt(k) >= 26 && parseInt(k) <= 30).reduce((sum, [, v]) => sum + v, 0);
    const totalScore = section1Score + section2Score + section3Score;
    const band = getPerformanceBand(totalScore);

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-amber-50 print:bg-white">
        <DEBsHeader subtitle="Grade 1 ELA Diagnostic Assessment" />

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="border-2 border-[#1C2D5A]/20 shadow-xl print:shadow-none">
            <CardHeader className="bg-gradient-to-r from-[#1C2D5A] to-[#2d4a8a] text-white print:bg-[#1C2D5A]">
              <CardTitle className="text-2xl text-center">
                🎉 Great Job, {studentInfo.name}!
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-3 gap-4 text-sm border-b pb-4">
                <div><span className="font-semibold">Student:</span> {studentInfo.name}</div>
                <div><span className="font-semibold">Date:</span> {studentInfo.date}</div>
                <div><span className="font-semibold">Teacher:</span> {studentInfo.teacher || "—"}</div>
              </div>

              {/* Performance Band */}
              <div className="text-center py-4">
                <Badge className={`${band.color} text-white text-2xl px-6 py-3`}>
                  {band.emoji} {band.label}
                </Badge>
              </div>

              {/* Scores */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                  <span className="font-semibold">Section 1: Letters and Sounds</span>
                  <span className="text-2xl font-bold text-blue-600">{section1Score}/20</span>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Section 2: Reading and Writing</span>
                    <span className="text-2xl font-bold text-green-600">{section2Score}/15</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[21, 22, 23, 24, 25].map(q => (
                      <div key={q} className="text-center">
                        <Label className="text-xs">Q{q}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="3"
                          value={manualScores[q] || 0}
                          onChange={(e) => setManualScores(prev => ({ ...prev, [q]: parseInt(e.target.value) || 0 }))}
                          className="h-10 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Section 3: Drawing and Writing</span>
                    <span className="text-2xl font-bold text-purple-600">{section3Score}/15</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[26, 27, 28, 29, 30].map(q => (
                      <div key={q} className="text-center">
                        <Label className="text-xs">Q{q}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="3"
                          value={manualScores[q] || 0}
                          onChange={(e) => setManualScores(prev => ({ ...prev, [q]: parseInt(e.target.value) || 0 }))}
                          className="h-10 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-[#1C2D5A] text-white rounded-xl">
                  <span className="font-bold text-xl">Total Score</span>
                  <span className="text-3xl font-bold">{totalScore}/50</span>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-3 justify-center print:hidden">
                <Button onClick={printResults} variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" /> Print Results
                </Button>
                <Button onClick={exportJSON} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Download JSON
                </Button>
                <Button onClick={() => window.print()} className="gap-2 bg-[#1C2D5A]">
                  <FileText className="w-4 h-4" /> Download PDF
                </Button>
              </div>

              {/* Student Responses */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-bold text-lg text-[#1C2D5A]">Student Responses</h3>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">Section 2 Answers:</h4>
                  {SECTION2_QUESTIONS.map(q => (
                    <div key={q.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm">Q{q.id}: {q.text}</p>
                      <p className="mt-1 text-gray-700">{answers[q.id] || "No answer"}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-600">Section 3 Answers:</h4>
                  {SECTION3_QUESTIONS.map(q => (
                    <div key={q.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm">Q{q.id}: {q.text}</p>
                      <p className="mt-1 text-gray-700">{answers[q.id] || "No answer"}</p>
                      {drawings[q.id] && (
                        <img src={drawings[q.id]} alt={`Drawing for Q${q.id}`} className="mt-2 border rounded max-w-xs" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test Screen
  const questions = getCurrentQuestions();
  const currentQuestion = questions[currentQuestionIndex] as any;
  const overallProgress = (getOverallQuestionNumber() / getTotalQuestions()) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-amber-50">
      <DEBsHeader 
        subtitle="Grade 1 ELA Diagnostic Assessment" 
        rightContent={
          <div className="text-lg font-bold text-[#FFD700]">
            ⏱️ {formatTime(timeRemaining)}
          </div>
        }
      />

      {/* Encouragement Toast */}
      {encouragement && (
        <div className="fixed top-24 right-4 z-50 animate-bounce">
          <Badge className="bg-[#FFDE59] text-[#1C2D5A] text-lg px-4 py-2">
            {encouragement}
          </Badge>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-[#1C2D5A]">
              Question {getOverallQuestionNumber()} of {getTotalQuestions()}
            </span>
            <span className="text-sm font-medium text-[#1C2D5A]">
              ⏱️ {formatTime(timeRemaining)}
            </span>
          </div>
          <Progress value={overallProgress} className="h-4" />
        </div>

        {/* Section Tabs */}
        <Tabs value={`section${currentSection}`} className="mb-6">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger 
              value="section1" 
              onClick={() => { setCurrentSection(1); setCurrentQuestionIndex(0); }}
              className="text-xs sm:text-sm py-3 data-[state=active]:bg-[#1C2D5A] data-[state=active]:text-white"
            >
              📖 Letters & Sounds
            </TabsTrigger>
            <TabsTrigger 
              value="section2"
              onClick={() => { setCurrentSection(2); setCurrentQuestionIndex(0); }}
              className="text-xs sm:text-sm py-3 data-[state=active]:bg-[#1C2D5A] data-[state=active]:text-white"
            >
              ✏️ Reading & Writing
            </TabsTrigger>
            <TabsTrigger 
              value="section3"
              onClick={() => { setCurrentSection(3); setCurrentQuestionIndex(0); }}
              className="text-xs sm:text-sm py-3 data-[state=active]:bg-[#1C2D5A] data-[state=active]:text-white"
            >
              🎨 Drawing & Writing
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Question Card */}
        <Card className="border-2 border-[#1C2D5A]/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#1C2D5A]/5 to-[#1C2D5A]/10">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-lg px-4 py-1">
                Question {currentQuestion.id}
              </Badge>
              <Badge className="bg-[#FFDE59] text-[#1C2D5A]">
                {currentSection === 1 ? "1 point" : "3 points"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#1C2D5A] mb-6 leading-relaxed">
              {currentQuestion.text}
            </h2>

            {/* Section 1: Multiple Choice */}
            {currentSection === 1 && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                className="space-y-3"
              >
                {(currentQuestion as typeof SECTION1_QUESTIONS[0]).choices.map((choice, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        answers[currentQuestion.id] === letter
                          ? "border-[#1C2D5A] bg-[#1C2D5A]/5"
                          : "border-gray-200 hover:border-[#1C2D5A]/50"
                      }`}
                      onClick={() => handleAnswerChange(currentQuestion.id, letter)}
                    >
                      <RadioGroupItem value={letter} id={`q${currentQuestion.id}-${letter}`} />
                      <Label
                        htmlFor={`q${currentQuestion.id}-${letter}`}
                        className="text-xl cursor-pointer flex-1"
                      >
                        <span className="font-bold text-[#1C2D5A] mr-3">{letter}.</span>
                        {choice}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            )}

            {/* Section 2: Written Response */}
            {currentSection === 2 && (
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Write your answer here..."
                className="text-xl h-40 leading-relaxed"
              />
            )}

            {/* Section 3: Drawing + Writing */}
            {currentSection === 3 && (
              <div className="space-y-6">
                {/* Park Scene Image for Q28 */}
                {currentQuestion.hasImage && <ParkSceneImage />}

                {/* Drawing Canvas */}
                {currentQuestion.hasDrawing && (
                  <div>
                    <Label className="text-lg font-semibold text-[#1C2D5A] mb-3 block">
                      🎨 Draw your picture here:
                    </Label>
                    <DrawingCanvas
                      questionId={currentQuestion.id}
                      savedData={drawings[currentQuestion.id] || ""}
                      onSave={(data) => handleDrawingSave(currentQuestion.id, data)}
                    />
                  </div>
                )}

                {/* Alphabet Input for Q29 */}
                {currentQuestion.isAlphabet ? (
                  <AlphabetInput
                    value={answers[currentQuestion.id] || ""}
                    onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  />
                ) : (
                  <div>
                    <Label className="text-lg font-semibold text-[#1C2D5A] mb-3 block">
                      ✏️ Write your answer here:
                    </Label>
                    <Textarea
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Write your answer..."
                      className="text-xl h-32 leading-relaxed"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentSection === 1 && currentQuestionIndex === 0}
            className="gap-2 h-12 px-6"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, JSON.stringify({
                studentInfo,
                answers,
                drawings,
                currentSection,
                currentQuestionIndex,
                phase
              }));
            }}
            className="gap-2"
          >
            <Save className="w-4 h-4" /> Save Progress
          </Button>

          <Button
            onClick={handleNext}
            className="gap-2 h-12 px-6 bg-[#1C2D5A] hover:bg-[#2d4a8a]"
          >
            {currentSection === 3 && currentQuestionIndex === questions.length - 1 ? (
              <>Finish Test 🎉</>
            ) : (
              <>Next <ChevronRight className="w-5 h-5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Grade1ELADiagnostic;
