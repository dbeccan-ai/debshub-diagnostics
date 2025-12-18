import { useState } from "react";
import { GradeRangeTestDialog } from "@/components/GradeRangeTestDialog";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function Page() {
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedGradeRange, setSelectedGradeRange] = useState<"1-6" | "7-12">("1-6");

  const openGradeDialog = (range: "1-6" | "7-12") => {
    setSelectedGradeRange(range);
    setGradeDialogOpen(true);
  };

  return (
    <div className="bg-gradient-to-br from-sky-100 via-white to-amber-50 text-slate-900 min-h-screen">
      {/* NAVBAR */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center font-bold text-slate-900 text-sm">
              DEB
            </div>
            <div className="leading-tight">
              <div className="font-bold text-slate-900 text-sm sm:text-base">D.E.Bs LEARNING ACADEMY</div>
              <div className="text-xs text-slate-500">Unlocking Brilliance Through Learning</div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#how-it-works" className="text-slate-600 hover:text-slate-900">
              How it works
            </a>
            <a href="#tests" className="text-slate-600 hover:text-slate-900">
              Diagnostic Tests
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">
              Pricing
            </a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900">
              FAQ
            </a>
          </nav>

          {/* Language & Auth buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />
            <a href="/auth" className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50">
              Log in
            </a>
            <a
              href="#cta"
              className="hidden sm:inline-flex px-4 py-1.5 text-sm font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="pt-10 pb-16 sm:pt-16 sm:pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
            {/* Hero text */}
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800 mb-4">
                New · DEBs Diagnostic Hub
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                Diagnostic Testing That <span className="text-amber-500">Actually Drives Results</span>.
              </h1>

              <p className="text-slate-600 text-sm sm:text-base mb-4 max-w-xl">
                DEBs Diagnostic Hub cuts through the guesswork. Your child takes one adaptive 45–90 minute test, and the
                system pinpoints their gaps and places them into the right support tier — so you finally know what they
                need, not just that they’re “behind.”
              </p>

              <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-xl">
                One secure link, one adaptive diagnostic for grades 1–12, and every student is placed into a clear
                support tier parents, teachers, and leaders can act on.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <a
                  href="#pricing"
                  className="inline-flex px-5 py-2.5 text-sm font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  Book a Diagnostic
                </a>
                <a
                  href="#tests"
                  className="inline-flex px-4 py-2 text-sm font-semibold rounded-full border border-slate-300 text-slate-700 hover:bg-white"
                >
                  View Diagnostic Types
                </a>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Adaptive testing & skill breakdown
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Tier placement in minutes
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Parent-friendly reports
                </div>
              </div>
            </div>

            {/* Hero mockup / cards */}
            <div className="relative">
              <div className="absolute -top-6 -right-6 h-32 w-32 bg-amber-200/60 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-4 h-32 w-32 bg-sky-200/60 rounded-full blur-3xl" />

              <div className="relative bg-white/90 backdrop-blur rounded-3xl border border-slate-100 shadow-xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Dashboard</div>
                    <div className="text-sm font-semibold text-slate-900">DEBs Diagnostic Hub · Grades 1–12</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    ● Live
                    <span>Auto-Grading</span>
                  </span>
                </div>

                <div className="grid gap-3">
                  {/* Card 1 */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
  <div>
    <div className="text-xs font-semibold text-slate-700">Observation Quiz</div>
    <div className="text-[11px] text-slate-500">45-minute snapshot · Grades 1–12</div>
  </div>
  <a
    href="/observation-quiz"
    className="px-3 py-1 text-[11px] font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800"
  >
    View
  </a>
</div>
                  {/* Card 2 */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div>
                      <div className="text-xs font-semibold text-slate-700">Math Diagnostic Test</div>
                      <div className="text-[11px] text-slate-500">90-minute adaptive · Grades 1–12</div>
                    </div>
                    <a
                      href="/math-diagnostic"
                      className="px-3 py-1 text-[11px] font-semibold rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Run
                    </a>
                  </div>
                  {/* Card 3 */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div>
                      <div className="text-xs font-semibold text-slate-700">ELA Diagnostic Test</div>
                      <div className="text-[11px] text-slate-500">90-minute reading & writing · Grades 1–12</div>
                    </div>
                    <a
                      href="/ela-diagnostic"
                      className="px-3 py-1 text-[11px] font-semibold rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Run
                    </a>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Auto-places students into{" "}
                    <span className="font-semibold text-slate-700">Tier 1, Tier 2, or Tier 3</span> support.
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">Students tested</div>
                    <div className="text-sm font-semibold text-slate-900">1,250+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="py-10 border-y border-slate-100 bg-white/70" id="who-for">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Built for real classrooms and real families.
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                Whether you serve 20 students or 2,000, DEBs Diagnostic Hub helps you move from “I think they’re behind”
                to “I know exactly what they need.”
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-semibold text-amber-600 uppercase mb-1">Schools & Programs</div>
                <p className="text-sm text-slate-700 mb-2">
                  Run grade-wide diagnostics and export clean reports for leadership, MTSS teams, and data meetings.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5">
                  <li>• Launch full-grade tests with one link</li>
                  <li>• Tier placement overview by class or cohort</li>
                  <li>• Download-ready for planning meetings</li>
                </ul>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-semibold text-sky-600 uppercase mb-1">Tutoring & Afterschool</div>
                <p className="text-sm text-slate-700 mb-2">
                  Stop guessing where to start. Use diagnostics to form groups, set goals, and track growth over time.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5">
                  <li>• Skill-by-skill breakdowns</li>
                  <li>• Group students by need in clicks</li>
                  <li>• Show families proof of progress</li>
                </ul>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-semibold text-emerald-600 uppercase mb-1">Parents & Families</div>
                <p className="text-sm text-slate-700 mb-2">
                  One adaptive test and a clear report — no jargon, no shame, no guessing about where your child stands.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5">
                  <li>• Easy-to-read summaries</li>
                  <li>• Concrete next steps you can take</li>
                  <li>• Option to join DEBs pods for support</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-14" id="how-it-works">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">How DEBs Diagnostic Hub Works</h2>
              <p className="text-sm sm:text-base text-slate-500">
                Designed by an educator, built like a product. No messy spreadsheets, no mystery scores — just a smooth,
                student-friendly flow.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-5 text-sm">
              {/* Step 1 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <div className="font-semibold text-slate-900">Choose your test</div>
                </div>
                <p className="text-slate-600 text-xs">Select from Math, ELA, or Observation quizzes for grades 1–12.</p>
              </div>

              {/* Step 2 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <div className="font-semibold text-slate-900">Write your test with the timer</div>
                </div>
                <p className="text-slate-600 text-xs">
                  Students complete the diagnostic online with a built-in timer (45 minutes for Observation; 90 minutes
                  for Math and ELA), so focus stays high and pacing is clear.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <div className="font-semibold text-slate-900">Auto-grade & tier</div>
                </div>
                <p className="text-slate-600 text-xs">
                  The system pinpoints exact gaps and auto-places each student into Tier 1, Tier 2, or Tier 3 support.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <div className="font-semibold text-slate-900">Take action</div>
                </div>
                <p className="text-slate-600 text-xs">
                  Use the report to inform instruction, enroll in a DEBs pod, or bring the data to your child’s school
                  team. No more guessing — just a clear next step.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DIAGNOSTIC TEST CARDS */}
        <section className="py-14 bg-slate-900" id="tests">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Your Diagnostic Suite, All in One Hub</h2>
                <p className="text-sm text-slate-300 max-w-xl">
                  Mix and match tests to fit your students. Each diagnostic is built to surface real gaps — not just
                  give a random score.
                </p>
              </div>
              <a
                href="#pricing"
                className="inline-flex px-4 py-2 text-xs sm:text-sm font-semibold rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300"
              >
                See pricing
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Observation Quiz */}
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
                <div className="text-xs font-semibold text-amber-300 uppercase mb-1">Observation Quiz</div>
                <h3 className="font-semibold mb-2">Learning Styles Snapshot</h3>
                <p className="text-xs text-slate-300 mb-3">
                  A 45-minute observation-based tool that helps families and teachers see how a child naturally learns
                  best: visual, auditory, or hands-on.
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1.5 mb-4">
                  <li>• 45-minute guided observation</li>
                  <li>• Parent & teacher-friendly checklist</li>
                  <li>• Clear learning profile summary</li>
                </ul>
                <button className="w-full px-4 py-2 text-xs font-semibold rounded-full bg-white text-slate-900 hover:bg-slate-100">
                  Preview this quiz
                </button>
              </div>

              {/* Math Diagnostic */}
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
                <div className="text-xs font-semibold text-sky-300 uppercase mb-1">Math Diagnostic</div>
                <h3 className="font-semibold mb-2">Math Skills FastTrack</h3>
                <p className="text-xs text-slate-300 mb-3">
                  A 90-minute adaptive assessment that pinpoints exact math skill gaps across grade levels — fractions,
                  fluency, equations, and more.
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1.5 mb-4">
                  <li>• 90-minute adaptive diagnostic</li>
                  <li>• Multiple-choice + word problems</li>
                  <li>• Skill breakdown + tier recommendation</li>
                </ul>
                <button className="w-full px-4 py-2 text-xs font-semibold rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300">
                  See sample math report
                </button>
              </div>

              {/* ELA Diagnostic */}
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
                <div className="text-xs font-semibold text-emerald-300 uppercase mb-1">ELA Diagnostic</div>
                <h3 className="font-semibold mb-2">Reading & Writing Snapshot</h3>
                <p className="text-xs text-slate-300 mb-3">
                  A 90-minute diagnostic that measures comprehension, vocabulary, grammar, and writing to reveal each
                  student’s true literacy level.
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1.5 mb-4">
                  <li>• 90-minute reading & writing assessment</li>
                  <li>• Inferential questions + writing task</li>
                  <li>• Clear feedback for families & staff</li>
                </ul>
                <button className="w-full px-4 py-2 text-xs font-semibold rounded-full bg-white text-slate-900 hover:bg-slate-100">
                  Explore ELA diagnostic
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES STRIP */}
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="flex gap-3">
                <div className="mt-1 h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Auto-grading & tier placement</div>
                  <p className="text-xs text-slate-600">
                    Score reports in minutes, not days. Know exactly who needs Tier 1, 2, or 3 support.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Parent-friendly reporting</div>
                  <p className="text-xs text-slate-600">
                    Clean summaries families can understand and share with schools, without any jargon.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Clear next steps</div>
                  <p className="text-xs text-slate-600">
                    Every report includes a suggested pathway — from light support to deeper intervention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-14 bg-slate-50" id="pricing">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Simple, upfront pricing. No surprises.
              </h2>
              <p className="text-sm sm:text-base text-slate-500">
                One test, one clear price. Your child gets a full adaptive diagnostic and a parent-friendly report you
                can actually use.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-sm">
              {/* Grades 1–6 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-6 flex flex-col">
                <div className="text-xs font-semibold text-emerald-600 uppercase mb-1">Grades 1–6</div>
                <h3 className="font-bold text-lg mb-1">Grades 1–6 Diagnostic</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Ideal for early and upper elementary students who need a clear check-in on Math or ELA.
                </p>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  $99
                  <span className="text-base font-normal text-slate-500"> / student</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  Adaptive Math or ELA diagnostic + detailed results report.
                </p>
                <ul className="text-[11px] text-slate-600 space-y-1.5 mb-6">
                  <li>• 45–90 minute adaptive assessment</li>
                  <li>• Skill breakdown + tier recommendation</li>
                  <li>• Parent summary you can share with teachers</li>
                </ul>
                <button 
                  onClick={() => openGradeDialog("1-6")}
                  className="mt-auto w-full px-4 py-2 text-xs font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  Book Grades 1–6 Diagnostic
                </button>
              </div>

              {/* Grades 7–12 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-amber-400 p-6 flex flex-col shadow-lg shadow-amber-100">
                <div className="text-xs font-semibold text-amber-600 uppercase mb-1">Grades 7–12</div>
                <h3 className="font-bold text-lg mb-1">Grades 7–12 Diagnostic</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Perfect for middle and high school students who need to know exactly where they stand before big
                  exams.
                </p>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  $120
                  <span className="text-base font-normal text-slate-500"> / student</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  Adaptive Math or ELA diagnostic + detailed results report.
                </p>
                <ul className="text-[11px] text-slate-600 space-y-1.5 mb-6">
                  <li>• 45–90 minute adaptive assessment</li>
                  <li>• Pinpoints gaps in higher-level content</li>
                  <li>• Tier recommendation + suggested next steps</li>
                </ul>
                <button 
                  onClick={() => openGradeDialog("7-12")}
                  className="mt-auto w-full px-4 py-2 text-xs font-semibold rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300"
                >
                  Book Grades 7–12 Diagnostic
                </button>
              </div>

              {/* Schools & Programs */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-6 flex flex-col">
                <div className="text-xs font-semibold text-sky-600 uppercase mb-1">Schools & Programs</div>
                <h3 className="font-bold text-lg mb-1">Group & School Pricing</h3>
                <p className="text-xs text-slate-500 mb-4">
                  For full classes, grade levels, or whole programs. Custom plans built around your numbers and goals.
                </p>
                <div className="text-2xl font-bold text-slate-900 mb-1">Custom</div>
                <p className="text-[11px] text-slate-500 mb-4">Per-school or per-cohort pricing available.</p>
                <ul className="text-[11px] text-slate-600 space-y-1.5 mb-6">
                  <li>• Bulk student diagnostics</li>
                  <li>• Staff training & onboarding support</li>
                  <li>• Data exports for your existing systems</li>
                </ul>
                <button className="mt-auto w-full px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 text-slate-800 hover:bg-white">
                  Contact us for a quote
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 bg-white" id="faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Questions, answered.</h2>
              <p className="text-sm text-slate-500">
                No fluff, just clear answers. If you still have questions, we can talk through your specific context.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="font-semibold text-slate-900 cursor-pointer">
                  Is DEBs Diagnostic Hub only for schools?
                </summary>
                <p className="mt-2 text-xs text-slate-600">
                  No! While we built it with schools in mind, it's perfect for tutoring centers, afterschool programs,
                  homeschool co-ops, and individual parents who want clear data on their child's academic standing.
                </p>
              </details>

              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="font-semibold text-slate-900 cursor-pointer">
                  What subjects and grade levels are supported?
                </summary>
                <p className="mt-2 text-xs text-slate-600">
                  Currently, we offer Math and ELA diagnostics for grades 1–12, plus a learning styles Observation Quiz.
                  We're actively building diagnostics for additional subjects and grade bands.
                </p>
              </details>

              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="font-semibold text-slate-900 cursor-pointer">
                  Can we integrate this with our existing systems?
                </summary>
                <p className="mt-2 text-xs text-slate-600">
                  Yes! For school and district partners, we offer custom integrations with your student information
                  system (SIS) and learning management system (LMS). Contact us to discuss your specific needs.
                </p>
              </details>

              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="font-semibold text-slate-900 cursor-pointer">
                  Do you offer training for teachers and staff?
                </summary>
                <p className="mt-2 text-xs text-slate-600">
                  Absolutely. Every school and program partner gets onboarding support, including live training
                  sessions, video walkthroughs, and ongoing support from our team.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-14 bg-slate-900" id="cta">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Ready to stop guessing and start placing students with confidence?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mb-6">
              DEBs Diagnostic Hub is your bridge between “They’re struggling” and “Here’s exactly what they need next.”
              Let’s build a plan that works for your students, your staff, and your family.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-3">
              <a
                href="mailto:info@debslearnacademy.com"
                className="inline-flex px-5 py-2.5 text-sm font-semibold rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300"
              >
                Book a 20-minute call
              </a>
              <a
                href="#pricing"
                className="inline-flex px-4 py-2 text-sm font-semibold rounded-full border border-slate-600 text-slate-100 hover:bg-slate-800"
              >
                See diagnostic pricing
              </a>
            </div>
            <p className="text-[11px] text-slate-500">
              Prefer to explore quietly first? We’ll send a sample report and a read-only tour of the hub.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} D.E.Bs LEARNING ACADEMY. All rights reserved.</div>
          <div className="flex flex-wrap gap-4">
            <span>DEBs Diagnostic Hub · Bronx, NY</span>
            <a href="https://www.debslearnacademy.com" className="hover:text-slate-700">
              debslearnacademy.com
            </a>
            <a href="/admin/login" className="hover:text-slate-700">
              Admin Login
            </a>
          </div>
        </div>
      </footer>

      {/* Grade Range Test Dialog */}
      <GradeRangeTestDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        gradeRange={selectedGradeRange}
      />
    </div>
  );
}
