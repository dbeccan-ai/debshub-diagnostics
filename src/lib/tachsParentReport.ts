// Web-app entry point for the pure parent-report builder shared with the edge functions.
// Used by the admin editor (defaults/preview) and by tests; the parent page itself only renders
// what the server returns.
export {
  defaultParentReportContent, parentReportView, sectionScores, sanitizeParentReportContent, findForbiddenParentKeys,
  findForbiddenParentPhrases, PARENT_REPORT_TITLE, REPORT_PREPARING_MESSAGE, PLACEMENT_NOTE, SECTION_ORDER,
} from "../../supabase/functions/_shared/tachs-report";
