import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import DEBsHeader from "@/components/DEBsHeader";
import DiagnosticLanding from "@/components/DiagnosticLanding";

export default function Grade4Diagnostic() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showLanding, setShowLanding] = useState(true);

  const handleStartDiagnostic = () => {
    setShowLanding(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  useEffect(() => {
    if (!showLanding) {
      iframeRef.current?.focus();
    }
  }, [showLanding]);

  if (showLanding) {
    return (
      <DiagnosticLanding
        grade={4}
        subject="Math"
        description="Comprehensive assessment covering operations, fractions, geometry, and measurement"
        totalTime={60}
        totalPoints={100}
        onStart={handleStartDiagnostic}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-100 via-blue-50 to-amber-50">
      <DEBsHeader 
        subtitle="Grade 4 Math Diagnostic"
        rightContent={
          <Button
            onClick={handlePrint}
            variant="outline"
            className="bg-[#FFD700] text-[#001F3F] border-[#001F3F] hover:bg-[#FFC107] font-bold"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print / Save PDF
          </Button>
        }
      />

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
