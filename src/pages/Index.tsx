import { useState } from "react";
import { GradeRangeTestDialog } from "@/components/GradeRangeTestDialog";
import { HeroTestDropdown } from "@/components/HeroTestDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SampleResultsDialog } from "@/components/SampleResultsDialog";
import ReadingRecoveryPreviewDialog from "@/components/ReadingRecoveryPreviewDialog";
import { useTranslation } from "@/hooks/useTranslation";

export default function Page() {
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedGradeRange, setSelectedGradeRange] = useState<"1-6" | "7-12">("1-6");
  const { t } = useTranslation();

  const openGradeDialog = (range: "1-6" | "7-12") => {
    setSelectedGradeRange(range);
    setGradeDialogOpen(true);
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
              {t.nav.howItWorks}
            </a>
            <a href="#tests" className="text-slate-600 hover:text-slate-900">
              {t.nav.diagnosticTests}
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">
              {t.nav.pricing}
            </a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900">
              {t.nav.faq}
            </a>
          </nav>

          {/* Language & Auth buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />
            <a href="/auth" className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50">
              {t.nav.login}
            </a>
            <a
              href="#cta"
              className="hidden sm:inline-flex px-4 py-1.5 text-sm font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800"
            >
              {t.nav.getStarted}
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
                {t.hero.badge}
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                {t.hero.title} <span className="text-amber-500">{t.hero.titleHighlight}</span>.
              </h1>

              <p className="text-slate-600 text-sm sm:text-base mb-4 max-w-xl">
                {t.hero.description}
              </p>

              <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-xl">
                {t.hero.subDescription}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <a
                  href="#pricing"
                  className="inline-flex px-5 py-2.5 text-sm font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {t.hero.bookDiagnostic}
                </a>
                <SampleResultsDialog
                  buttonText={t.hero.seeSampleResults}
                  className="inline-flex px-4 py-2 text-sm font-semibold rounded-full border border-slate-300 text-slate-700 hover:bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {t.hero.adaptiveTesting}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  {t.hero.tierPlacement}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {t.hero.parentReports}
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
                    <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">{t.dashboard.title}</div>
                    <div className="text-sm font-semibold text-slate-900">{t.dashboard.subtitle}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    ● {t.dashboard.live}
                    <span>{t.dashboard.autoGrading}</span>
                  </span>
                </div>

                <div className="grid gap-3">
                  {/* Card 1 - Reading Recovery */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{t.dashboard.readingRecovery}</div>
                      <div className="text-[11px] text-slate-500">{t.dashboard.readingRecoveryDesc}</div>
                    </div>
                    <ReadingRecoveryPreviewDialog>
                      <button className="px-3 py-1 text-[11px] font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800">
                        {t.dashboard.preview}
                      </button>
                    </ReadingRecoveryPreviewDialog>
                  </div>
                  {/* Card 2 - Math Diagnostic */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{t.dashboard.mathDiagnostic}</div>
                      <div className="text-[11px] text-slate-500">{t.dashboard.mathDesc}</div>
                    </div>
                    <HeroTestDropdown type="math" buttonLabel={t.dashboard.run} />
                  </div>
                  {/* Card 3 - ELA Diagnostic */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{t.dashboard.elaDiagnostic}</div>
                      <div className="text-[11px] text-slate-500">{t.dashboard.elaDesc}</div>
                    </div>
                    <HeroTestDropdown type="ela" buttonLabel={t.dashboard.run} />
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    {t.dashboard.autoPlaces}{" "}
                    <span className="font-semibold text-slate-700">{t.dashboard.tierSupport}</span> {t.dashboard.support}
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">{t.dashboard.studentsTested}</div>
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
                {t.whoFor.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                {t.whoFor.description}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-semibold text-amber-600 uppercase mb-1">{t.whoFor.schools}</div>
                <p className="text-sm text-slate-700 mb-2">
                  {t.whoFor.schoolsDesc}
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5">
                  <li>• {t.whoFor.schoolsItem1}</li>
                  <li>• {t.whoFor.schoolsItem2}</li>
                  <li>• {t.whoFor.schoolsItem3}</li>
                </ul>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-semibold text-sky-600 uppercase mb-1">{t.whoFor.tutoring}</div>
                <p className="text-sm text-slate-700 mb-2">
                  {t.whoFor.tutoringDesc}
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5">
                  <li>• {t.whoFor.tutoringItem1}</li>
                  <li>• {t.whoFor.tutoringItem2}</li>
                  <li>• {t.whoFor.tutoringItem3}</li>
                </ul>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="text-xs font-semibold text-emerald-600 uppercase mb-1">{t.whoFor.parents}</div>
                <p className="text-sm text-slate-700 mb-2">
                  {t.whoFor.parentsDesc}
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5">
                  <li>• {t.whoFor.parentsItem1}</li>
                  <li>• {t.whoFor.parentsItem2}</li>
                  <li>• {t.whoFor.parentsItem3}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-14" id="how-it-works">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{t.howItWorks.title}</h2>
              <p className="text-sm sm:text-base text-slate-500">
                {t.howItWorks.description}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-5 text-sm">
              {/* Step 1 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <div className="font-semibold text-slate-900">{t.howItWorks.step1Title}</div>
                </div>
                <p className="text-slate-600 text-xs">{t.howItWorks.step1Desc}</p>
              </div>

              {/* Step 2 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <div className="font-semibold text-slate-900">{t.howItWorks.step2Title}</div>
                </div>
                <p className="text-slate-600 text-xs">
                  {t.howItWorks.step2Desc}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <div className="font-semibold text-slate-900">{t.howItWorks.step3Title}</div>
                </div>
                <p className="text-slate-600 text-xs">
                  {t.howItWorks.step3Desc}
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <div className="font-semibold text-slate-900">{t.howItWorks.step4Title}</div>
                </div>
                <p className="text-slate-600 text-xs">
                  {t.howItWorks.step4Desc}
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
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">{t.tests.title}</h2>
                <p className="text-sm text-slate-300 max-w-xl">
                  {t.tests.description}
                </p>
              </div>
              <a
                href="#pricing"
                className="inline-flex px-4 py-2 text-xs sm:text-sm font-semibold rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300"
              >
                {t.tests.seePricing}
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Reading Recovery Diagnostic */}
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
                <div className="text-xs font-semibold text-amber-300 uppercase mb-1">{t.dashboard.readingRecovery}</div>
                <h3 className="font-semibold mb-2">{t.tests.readingRecoveryTitle}</h3>
                <p className="text-xs text-slate-300 mb-3">
                  {t.tests.readingRecoveryDesc}
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1.5 mb-4">
                  <li>• {t.tests.readingRecoveryItem1}</li>
                  <li>• {t.tests.readingRecoveryItem2}</li>
                  <li>• {t.tests.readingRecoveryItem3}</li>
                </ul>
                <a href="/auth" className="block w-full px-4 py-2 text-xs font-semibold rounded-full bg-white text-slate-900 hover:bg-slate-100 text-center">
                  {t.tests.learnMoreProgramme}
                </a>
              </div>

              {/* Math Diagnostic */}
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
                <div className="text-xs font-semibold text-sky-300 uppercase mb-1">{t.dashboard.mathDiagnostic}</div>
                <h3 className="font-semibold mb-2">{t.tests.mathTitle}</h3>
                <p className="text-xs text-slate-300 mb-3">
                  {t.tests.mathDesc}
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1.5 mb-4">
                  <li>• {t.tests.mathItem1}</li>
                  <li>• {t.tests.mathItem2}</li>
                  <li>• {t.tests.mathItem3}</li>
                </ul>
                <button 
                  onClick={scrollToPricing}
                  className="w-full px-4 py-2 text-xs font-semibold rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300"
                >
                  {t.tests.startMath}
                </button>
              </div>

              {/* ELA Diagnostic */}
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5">
                <div className="text-xs font-semibold text-emerald-300 uppercase mb-1">{t.dashboard.elaDiagnostic}</div>
                <h3 className="font-semibold mb-2">{t.tests.elaTitle}</h3>
                <p className="text-xs text-slate-300 mb-3">
                  {t.tests.elaDesc}
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1.5 mb-4">
                  <li>• {t.tests.elaItem1}</li>
                  <li>• {t.tests.elaItem2}</li>
                  <li>• {t.tests.elaItem3}</li>
                </ul>
                <button 
                  onClick={scrollToPricing}
                  className="w-full px-4 py-2 text-xs font-semibold rounded-full bg-white text-slate-900 hover:bg-slate-100"
                >
                  {t.tests.startEla}
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
                  <div className="font-semibold text-slate-900">{t.features.autoGrading}</div>
                  <p className="text-xs text-slate-600">
                    {t.features.autoGradingDesc}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{t.features.parentReports}</div>
                  <p className="text-xs text-slate-600">
                    {t.features.parentReportsDesc}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm">
                  ✓
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{t.features.tierPlacement}</div>
                  <p className="text-xs text-slate-600">
                    {t.features.tierPlacementDesc}
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
                {t.pricing.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-500">
                {t.pricing.description}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-sm">
              {/* Grades 1–6 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-6 flex flex-col">
                <div className="text-xs font-semibold text-emerald-600 uppercase mb-1">{t.pricing.grades16}</div>
                <h3 className="font-bold text-lg mb-1">{t.pricing.grades16Desc}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {t.pricing.mathEla}
                </p>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  $99
                  <span className="text-base font-normal text-slate-500"> / {t.pricing.perStudent}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  {t.pricing.includes}
                </p>
                <ul className="text-[11px] text-slate-600 space-y-1.5 mb-6">
                  <li>• {t.pricing.mathEla}</li>
                  <li>• {t.pricing.tierPlacement}</li>
                  <li>• {t.pricing.skillBreakdown}</li>
                  <li>• {t.pricing.parentSummary}</li>
                </ul>
                <button 
                  onClick={() => openGradeDialog("1-6")}
                  className="mt-auto w-full px-4 py-2 text-xs font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {t.pricing.startDiagnostic}
                </button>
              </div>

              {/* Grades 7–12 */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-amber-400 p-6 flex flex-col shadow-lg shadow-amber-100">
                <div className="text-xs font-semibold text-amber-600 uppercase mb-1">{t.pricing.grades712}</div>
                <h3 className="font-bold text-lg mb-1">{t.pricing.grades712Desc}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {t.pricing.mathEla}
                </p>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  $120
                  <span className="text-base font-normal text-slate-500"> / {t.pricing.perStudent}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  {t.pricing.includes}
                </p>
                <ul className="text-[11px] text-slate-600 space-y-1.5 mb-6">
                  <li>• {t.pricing.mathEla}</li>
                  <li>• {t.pricing.tierPlacement}</li>
                  <li>• {t.pricing.skillBreakdown}</li>
                  <li>• {t.pricing.parentSummary}</li>
                </ul>
                <button 
                  onClick={() => openGradeDialog("7-12")}
                  className="mt-auto w-full px-4 py-2 text-xs font-semibold rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300"
                >
                  {t.pricing.startDiagnostic}
                </button>
              </div>

              {/* Schools & Programs */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-6 flex flex-col">
                <div className="text-xs font-semibold text-sky-600 uppercase mb-1">{t.pricing.schoolsTitle}</div>
                <h3 className="font-bold text-lg mb-1">{t.pricing.schoolsDesc}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {t.pricing.bulk}
                </p>
                <div className="text-2xl font-bold text-slate-900 mb-1">{t.pricing.contactUs}</div>
                <p className="text-[11px] text-slate-500 mb-4">{t.pricing.includes}</p>
                <ul className="text-[11px] text-slate-600 space-y-1.5 mb-6">
                  <li>• {t.pricing.bulk}</li>
                  <li>• {t.pricing.dedicated}</li>
                  <li>• {t.pricing.customReports}</li>
                </ul>
                <button className="mt-auto w-full px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 text-slate-800 hover:bg-white">
                  {t.pricing.contactUs}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 bg-white" id="faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{t.faq.title}</h2>
            </div>

            <div className="space-y-3 text-sm">
              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="font-semibold text-slate-900 cursor-pointer">
                  {t.faq.q1}
                </summary>
                <p className="mt-2 text-xs text-slate-600">
                  {t.faq.a1}
                </p>
              </details>

              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="font-semibold text-slate-900 cursor-pointer">
                  {t.faq.q2}
                </summary>
                <p className="mt-2 text-xs text-slate-600">
                  {t.faq.a2}
                </p>
              </details>

              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="font-semibold text-slate-900 cursor-pointer">
                  {t.faq.q3}
                </summary>
                <p className="mt-2 text-xs text-slate-600">
                  {t.faq.a3}
                </p>
              </details>

              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="font-semibold text-slate-900 cursor-pointer">
                  {t.faq.q4}
                </summary>
                <p className="mt-2 text-xs text-slate-600">
                  {t.faq.a4}
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-14 bg-slate-900" id="cta">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {t.cta.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mb-6">
              {t.cta.description}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-3">
              <a
                href="mailto:info@debslearnacademy.com"
                className="inline-flex px-5 py-2.5 text-sm font-semibold rounded-full bg-amber-400 text-slate-900 hover:bg-amber-300"
              >
                {t.cta.bookCall}
              </a>
              <a
                href="#pricing"
                className="inline-flex px-4 py-2 text-sm font-semibold rounded-full border border-slate-600 text-slate-100 hover:bg-slate-800"
              >
                {t.cta.viewPricing}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>{t.footer.copyright}</div>
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
