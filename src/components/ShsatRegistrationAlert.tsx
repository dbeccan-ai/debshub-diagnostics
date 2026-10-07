import { CalendarDays, AlertCircle } from "lucide-react";
import { SHSAT_CYCLE, formatLongDate } from "@/lib/shsatConfig";

/** SHSAT-only registration banner. Render only on SHSAT pages. */
export default function ShsatRegistrationAlert() {
  return (
    <section aria-label="SHSAT registration" className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            SHSAT Registration Is Open — Deadline {formatLongDate(SHSAT_CYCLE.registrationDeadline)}
          </h2>
          <p className="text-base text-muted-foreground">
            Registration opened {formatLongDate(SHSAT_CYCLE.registrationOpens)}. Register through your school counselor or the NYC Department of Education.
          </p>
        </div>
      </div>
      <div className="rounded-lg bg-card border p-4">
        <p className="font-semibold flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4" aria-hidden /> {SHSAT_CYCLE.year} test dates</p>
        <ul className="grid sm:grid-cols-2 gap-1 text-base">
          {SHSAT_CYCLE.testDates.map((d) => <li key={d.date}>• {d.label}</li>)}
        </ul>
      </div>
    </section>
  );
}
