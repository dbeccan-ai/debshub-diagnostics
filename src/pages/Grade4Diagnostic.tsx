import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, Printer, BookOpen } from "lucide-react";

export default function Grade4Diagnostic() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showLanding, setShowLanding] = useState(true);

  const handleStartDiagnostic = () => {
    setShowLanding(false);
    // Scroll to top after hiding landing
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  useEffect(() => {
    if (!showLanding) {
      // Ensure iframe is focused for proper interaction
      iframeRef.current?.focus();
    }
  }, [showLanding]);

  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-amber-50">
        {/* Header */}
        <header className="bg-[#001F3F] text-white py-4 px-6 border-b-4 border-[#FFD700]">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center">
                <span className="text-[#001F3F] font-bold text-lg">DEB</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">D.E.Bs LEARNING ACADEMY</h1>
                <p className="text-[#FFD700] text-sm">DEBs Diagnostic Hub</p>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-[#9B59B6] text-white px-6 py-3 rounded-full text-xl font-bold mb-6 shadow-lg">
              📚 GRADE 4 📚
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[#001F3F] mb-4">
              Grade 4 Math Diagnostic Test
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Comprehensive assessment covering operations, fractions, geometry, and measurement
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#9B59B6]">
                <div className="text-3xl mb-2">⏰</div>
                <div className="text-sm text-gray-600">Total Time</div>
                <div className="text-xl font-bold text-[#9B59B6]">60 min</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#9B59B6]">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-sm text-gray-600">Total Points</div>
                <div className="text-xl font-bold text-[#9B59B6]">100</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#9B59B6]">
                <div className="text-3xl mb-2">🧮</div>
                <div className="text-sm text-gray-600">Calculator</div>
                <div className="text-xl font-bold text-[#9B59B6]">Part C</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border-2 border-[#9B59B6]">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-sm text-gray-600">Show Work</div>
                <div className="text-xl font-bold text-[#9B59B6]">B & C</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border-4 border-[#FFD700] mb-8">
              <h2 className="text-2xl font-bold text-[#001F3F] mb-4 flex items-center justify-center gap-2">
                <BookOpen className="h-6 w-6" />
                Test Structure
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="font-bold text-[#9B59B6] mb-2">🌟 Part A</h3>
                  <p className="text-sm text-gray-600">15 Multiple Choice Questions</p>
                  <p className="text-sm text-gray-600">60 Points • NO Calculator</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-bold text-[#3498DB] mb-2">✏️ Part B</h3>
                  <p className="text-sm text-gray-600">5 Short Answer Questions</p>
                  <p className="text-sm text-gray-600">20 Points • Show Your Work</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <h3 className="font-bold text-[#F39C12] mb-2">🎯 Part C</h3>
                  <p className="text-sm text-gray-600">Choose 3 of 5 Extended Response</p>
                  <p className="text-sm text-gray-600">20 Points • Calculator Allowed</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartDiagnostic}
              size="lg"
              className="bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] hover:from-[#8E44AD] hover:to-[#7D3C98] text-white text-xl px-10 py-6 rounded-2xl shadow-xl border-4 border-[#FFD700] transform hover:scale-105 transition-all"
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-100 via-blue-50 to-amber-50">
      {/* Fixed Header with Print Button */}
      <header className="bg-[#001F3F] text-white py-3 px-4 border-b-4 border-[#FFD700] sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center">
              <span className="text-[#001F3F] font-bold text-sm">DEB</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-sm">D.E.Bs LEARNING ACADEMY</h1>
              <p className="text-[#FFD700] text-xs">Grade 4 Math Diagnostic</p>
            </div>
          </div>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="bg-[#FFD700] text-[#001F3F] border-[#001F3F] hover:bg-[#FFC107] font-bold"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </header>

      {/* Full-width iframe */}
      <div className="flex-1">
        <iframe
          ref={iframeRef}
          src="/grade4-diagnostic.html"
          className="w-full h-[calc(100vh-64px)] border-0"
          title="Grade 4 Math Diagnostic Test"
          style={{ minHeight: "calc(100vh - 64px)" }}
        />
      </div>
    </div>
  );
}
