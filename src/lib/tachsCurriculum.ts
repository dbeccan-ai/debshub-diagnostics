// Web-app entry point for the ADMIN-ONLY TACHS curriculum builder. Imported only by the admin-guarded
// curriculum page (never by parent/student pages — a regression test enforces this).
export { buildTachsCurriculum, sectionProfile, CURRICULUM_MILESTONES, type TachsCurriculum, type CurriculumWeek } from "../../supabase/functions/_shared/tachs-curriculum";
