

# School Demo Page (`/demo`) with 3-Tier Institutional Pricing

## What We're Building

A public, shareable `/demo` page targeting principals and district supervisors. Combines a professional walkthrough of the platform with interactive sandbox features and the three pricing options you specified.

## Page Sections

### 1. Hero
- Professional headline: "Data-Driven Diagnostic Testing for Your School"
- Subheadline about tier placement, automated grading, parent-ready reports
- Two CTAs: "Try a Sample Test" (scroll) and "Request a Quote" (scroll)
- Trust stats: students tested, grade coverage, subjects

### 2. How It Works (School Edition)
- 4-step visual flow: Enroll students → Students take diagnostics → AI grades + tier placement → Class-wide reports + parent letters

### 3. Interactive Sandbox
- "Try a Sample Test" buttons linking to existing diagnostic routes with `?demo=true` query param (5 questions, no login)
- Inline sample results preview (reuse `SampleResultsDialog` data) showing all 3 tiers
- Sample certificate preview link

### 4. School Pricing — 3 Options Side by Side

Three cards in a row:

**Option A — Per Student Diagnostic License**
- $25–$40 per student, minimum 25 students
- Best for: Small Saturday Academy programs
- Includes: Individual diagnostic, tier placement, parent report

**Option B — School Site License (Semester)**
- $3,500–$7,500 per semester
- Pricing depends on: grade bands, student count, reporting depth
- Badge: "Most Popular"
- Includes: Unlimited diagnostics, class-wide reports, admin dashboard access

**Option C — Diagnostic + Intervention Partnership**
- $7,500–$15,000 per semester
- Badge: "Premium"
- Includes: Diagnostic Hub, grouping recommendations, tier strategy, optional staff training
- Full consultation and implementation support

### 5. Request a Quote Form
- Fields: Name, Title/Role, School Name, District, Email, Phone, Estimated Students, Grade Levels (checkboxes), Interested Package (A/B/C dropdown), Message
- Submits to `demo_requests` table
- Success confirmation toast

## Technical Changes

| Item | Detail |
|------|--------|
| New file | `src/pages/SchoolDemo.tsx` |
| New route | `/demo` added to `App.tsx` |
| DB migration | Create `demo_requests` table (id uuid, name text, title text, school_name text, district text, email text, phone text, student_count int, grade_levels text[], package_interest text, message text, created_at timestamptz default now()) |
| RLS | Anonymous insert allowed (public form); admin-only select |
| No auth required | Entire page is public |

