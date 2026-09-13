// Web-app entry point for the pure parent-report builder shared with the edge functions.
// Used by the admin editor (defaults/preview) and by tests; the parent page itself only renders
// what the server returns.
export {
  defaultParentReportContent, parentReportView, sectionScores, sanitizeParentReportContent, findForbiddenParentKeys,
  findForbiddenParentPhrases, defaultHomeSupportPlan, sanitizeHomeSupportPlan, PARENT_REPORT_TITLE, REPORT_PREPARING_MESSAGE, PLACEMENT_NOTE, SECTION_ORDER,
  HOME_SUPPORT_TITLE, type HomeSupportPlan, type HomeSupportView,
} from "../../supabase/functions/_shared/tachs-report";
