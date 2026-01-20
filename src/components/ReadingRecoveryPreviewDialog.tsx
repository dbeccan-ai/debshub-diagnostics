import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, Target, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ReadingRecoveryPreviewDialogProps {
  children: React.ReactNode;
}

const ReadingRecoveryPreviewDialog = ({ children }: ReadingRecoveryPreviewDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-6 h-6 text-primary" />
            Reading Recovery Programme Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* What It Is */}
          <div>
            <h3 className="font-semibold text-lg mb-2">What is the Reading Recovery Programme?</h3>
            <p className="text-muted-foreground">
              A comprehensive literacy assessment designed to identify exactly where your child's reading breaks down and provide a clear 21-day roadmap to fluency. Covers grades 1-8 with age-appropriate passages and questions.
            </p>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="font-semibold text-lg mb-3">How It Works</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Target, step: "1", title: "Select Grade Band", desc: "Grades 1-2, 3-4, 5-6, or 7-8" },
                { icon: BookOpen, step: "2", title: "Read Passage Aloud", desc: "Student reads while admin marks errors" },
                { icon: CheckCircle2, step: "3", title: "Answer Questions", desc: "Literal, Inferential, Analytical" },
                { icon: TrendingUp, step: "4", title: "Get Your Roadmap", desc: "21-day personalized plan" },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What You'll Get */}
          <div>
            <h3 className="font-semibold text-lg mb-3">What You'll Get</h3>
            <ul className="space-y-2">
              {[
                "Age-appropriate reading passage matched to developmental stage",
                "Decoding observation checklist for oral reading accuracy",
                "Comprehension questions at three levels",
                "Automatic scoring with gap identification",
                "Personalized 21-Day Reading Recovery Blueprint",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sample Breakdown Points */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Sample Breakdown Points Identified:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Decoding Gaps
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Literal Comprehension
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Inferential Comprehension
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Analytical Comprehension
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <Link to="/auth">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Sign In to Access Full Programme
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Free to use • No payment required
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingRecoveryPreviewDialog;
