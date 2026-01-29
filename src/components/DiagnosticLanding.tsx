import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import DEBsHeader from "@/components/DEBsHeader";

interface TestInfo {
  label: string;
  value: string;
  emoji: string;
}

interface DiagnosticLandingProps {
  grade: string | number;
  subject: "Math" | "ELA";
  description: string;
  totalTime: number;
  totalPoints: number;
  testInfo?: TestInfo[];
  onStart: () => void;
}

export default function DiagnosticLanding({
  grade,
  subject,
  description,
  totalTime,
  totalPoints,
  testInfo,
  onStart,
}: DiagnosticLandingProps) {
  const isMath = subject === "Math";
  const primaryColor = isMath ? "#9B59B6" : "#3498DB";
  const gradientFrom = isMath ? "from-purple-100" : "from-blue-100";
  const gradientVia = isMath ? "via-blue-50" : "via-purple-50";
  const gradientTo = isMath ? "to-amber-50" : "to-amber-50";
  
  const defaultTestInfo: TestInfo[] = [
    { label: "Total Time", value: `${totalTime} min`, emoji: "⏰" },
    { label: "Total Points", value: `${totalPoints}`, emoji: "📊" },
    ...(isMath 
      ? [
          { label: "Calculator", value: "Part C", emoji: "🧮" },
          { label: "Show Work", value: "B & C", emoji: "📝" },
        ]
      : [
          { label: "Sections", value: "3", emoji: "📚" },
          { label: "Writing", value: "Required", emoji: "✏️" },
        ]
    ),
  ];

  const infoItems = testInfo || defaultTestInfo;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`}>
      <DEBsHeader />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className="inline-block text-white px-6 py-3 rounded-full text-xl font-bold mb-6 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            📚 GRADE {grade} 📚
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-[#001F3F] mb-4">
            Grade {grade} {subject} Diagnostic Test
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            {description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {infoItems.map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-4 shadow-md border-2"
                style={{ borderColor: primaryColor }}
              >
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="text-sm text-gray-600">{item.label}</div>
                <div className="text-xl font-bold" style={{ color: primaryColor }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={onStart}
            size="lg"
            className="text-white text-xl px-10 py-6 rounded-2xl shadow-xl border-4 border-[#FFD700] transform hover:scale-105 transition-all"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${isMath ? '#8E44AD' : '#2980B9'} 100%)` 
            }}
          >
            <ArrowDown className="mr-2 h-6 w-6" />
            Start Diagnostic
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#001F3F] text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#FFD700] font-semibold text-lg mb-2">
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
