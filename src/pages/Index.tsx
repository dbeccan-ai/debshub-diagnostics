import { Users, Activity, Target, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Tier = "Tier 1" | "Tier 2" | "Tier 3";
type TestStatus = "In Progress" | "Completed";

interface MyTest {
  id: string;
  label: string; // e.g. "Math Diagnostic – Grade 7"
  type: "Math" | "ELA" | "Observation";
  grade: string; // e.g. "7"
  tier?: Tier; // optional – only for completed tests
  status: TestStatus;
  date: string; // e.g. "Dec 1, 2025"
  score?: string; // e.g. "72%"
  link: string; // where clicking the button goes
}

// Example tests for "Dahalia"
// You can later replace this with real data from your backend.
const myTests: MyTest[] = [
  {
    id: "1",
    label: "Math Diagnostic – Grade 7",
    type: "Math",
    grade: "7",
    status: "Completed",
    date: "Dec 1, 2025",
    tier: "Tier 2",
    score: "72%",
    link: "/reports/math-grade-7", // replace with your real route
  },
  {
    id: "2",
    label: "ELA Diagnostic – Grade 7",
    type: "ELA",
    grade: "7",
    status: "Completed",
    date: "Nov 28, 2025",
    tier: "Tier 1",
    score: "88%",
    link: "/reports/ela-grade-7",
  },
  {
    id: "3",
    label: "Math Diagnostic – Grade 8",
    type: "Math",
    grade: "8",
    status: "In Progress",
    date: "In progress · last opened Nov 30, 2025",
    link: "/math-diagnostic?resume=1", // resume link
  },
  {
    id: "4",
    label: "ELA Diagnostic – Grade 8",
    type: "ELA",
    grade: "8",
    status: "In Progress",
    date: "In progress · last opened Nov 29, 2025",
    link: "/ela-diagnostic?resume=1",
  },
];

function tierBadgeColor(tier: Tier) {
  switch (tier) {
    case "Tier 1":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Tier 2":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Tier 3":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "";
  }
}

function statusBadgeColor(status: TestStatus) {
  if (status === "Completed") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  return "bg-amber-100 text-amber-800 border-amber-200";
}

export default function DashboardPage() {
  // Later you can swap this out for the logged-in user's name
  const userName = "Dahalia";

  const completedCount = myTests.filter((t) => t.status === "Completed").length;
  const inProgressCount = myTests.filter((t) => t.status === "In Progress").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header / Greeting */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Welcome back, {userName}.</h1>
            <p className="mt-1 text-sm text-slate-500">
              Here’s where you can see your diagnostics, resume unfinished tests, and understand exactly what the
              results mean.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
              <a href="/math-diagnostic">
                New Math Diagnostic
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-300 text-slate-800 hover:bg-white">
              <a href="/ela-diagnostic">
                New ELA Diagnostic
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Top Stats – now personal to the logged-in user */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnostics completed</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{completedCount}</div>
              <p className="mt-1 text-xs text-slate-500">Finished tests with full reports and tier placement.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests in progress</CardTitle>
              <Activity className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{inProgressCount}</div>
              <p className="mt-1 text-xs text-slate-500">You can pause and resume within the test windows.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next recommended step</CardTitle>
              <Target className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-slate-900">Review your latest diagnostic report</div>
              <p className="mt-1 text-xs text-slate-500">
                Use the most recent completed test to decide which pod (Tier 1, 2, or 3) is the best fit.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Layout: My Tests + Tiers */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: My Tests list */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">My diagnostic tests</CardTitle>
                <CardDescription className="text-xs">
                  These are the tests associated with your account — both finished and in progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {myTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{test.label}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {test.type} · Grade {test.grade}
                        {test.tier && (
                          <>
                            {" · "}
                            <span
                              className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] ml-1 ${tierBadgeColor(
                                test.tier,
                              )}`}
                            >
                              {test.tier}
                            </span>
                          </>
                        )}
                        {test.score && (
                          <>
                            {" · "}
                            <span className="ml-1 font-medium text-slate-700">Score: {test.score}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{test.date}</div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Badge
                        variant="outline"
                        className={`border px-2 py-0.5 text-[11px] ${statusBadgeColor(test.status)}`}
                      >
                        {test.status}
                      </Badge>
                      <Button
                        asChild
                        size="sm"
                        className={`h-7 px-3 text-[11px] ${
                          test.status === "In Progress"
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        <a href={test.link}>{test.status === "In Progress" ? "Resume test" : "View results"}</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Tier next steps (Depths Method pods) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Recommended next steps by tier</CardTitle>
                <CardDescription className="text-xs">
                  After each diagnostic, your child is placed into a Tier so you know exactly how much support they
                  need.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-800">Tier 1 · Minimal Support</span>
                    <span className="text-[11px] font-medium text-emerald-700">4-Week Pod</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-900/80">
                    For small gaps. Short pod, lighter practice, and a mastery check before exit.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 border-emerald-300 bg-white text-[11px] text-emerald-800 hover:bg-emerald-50"
                  >
                    <a href="/pods/tier-1">View Tier 1 pod details</a>
                  </Button>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-800">Tier 2 · Some Struggle</span>
                    <span className="text-[11px] font-medium text-amber-700">10-Week Pod</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-900/80">
                    For noticeable gaps. Longer pod, deeper practice, and mid-pod mock diagnostics.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 border-amber-300 bg-white text-[11px] text-amber-800 hover:bg-amber-50"
                  >
                    <a href="/pods/tier-2">View Tier 2 pod details</a>
                  </Button>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-red-800">Tier 3 · Needs a Lot</span>
                    <span className="text-[11px] font-medium text-red-700">15-Week Pod</span>
                  </div>
                  <p className="mt-1 text-[11px] text-red-900/80">
                    For students who are significantly behind. Intensive pod, weekly 1:1s, and monthly full diagnostics
                    before exit.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 border-red-300 bg-white text-[11px] text-red-800 hover:bg-red-50"
                  >
                    <a href="/pods/tier-3">View Tier 3 pod details</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
