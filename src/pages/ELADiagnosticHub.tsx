import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const grades = [
  { grade: 5, time: 90, sections: 2, description: "Language Skills, Reading Comprehension, Writing" },
  { grade: 6, time: 90, sections: 3, description: "Multiple Choice, Reading Comprehension, Writing Prompts" },
  { grade: 7, time: 90, sections: 2, description: "Language, Grammar, Literary Devices, Writing" },
  { grade: 8, time: 90, sections: 3, description: "Multiple Choice, Reading Comprehension, Writing" },
  { grade: 9, time: 90, sections: 3, description: "Multiple Choice, Reading Comprehension, Writing Prompts" },
  { grade: 10, time: 90, sections: 3, description: "Literary Analysis, Central Idea, Inferencing, Writing" },
  { grade: 11, time: 90, sections: 3, description: "Rhetoric, Literary Analysis, Advanced Vocabulary, Writing" },
  { grade: 12, time: 90, sections: 3, description: "Advanced Analysis, Reading Comprehension, Extended Writing" },
];

export default function ELADiagnosticHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-4">ELA Diagnostic Tests</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive English Language Arts assessments for Grades 5-12. Each test evaluates reading comprehension, vocabulary, grammar, literary analysis, and writing skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {grades.map(({ grade, time, sections, description }) => (
            <Card key={grade} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {sections} Sections
                  </span>
                </div>
                <CardTitle className="text-xl mt-3">Grade {grade} ELA Diagnostic</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {time} minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigate(`/diagnostics/ela/grade-${grade}`)}
                >
                  Start Diagnostic
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
