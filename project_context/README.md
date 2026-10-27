# Project Context & Verification Suite
## Master Index & Guardrails

This directory serves as the **Single Source of Truth (SSOT)** for the Dynamic Todo & Team Accountability Engine. Every architectural decision, user story, edge case, and acceptance criterion is cataloged here by section.

Before and during implementation, we will benchmark every piece of code against these documents to ensure we build **only what is needed**, adhere to the **"Lazy Senior Dev"** philosophy in [ponytail.md](file:///c:/Users/Lenovo/Documents/ds/.agents/rules/ponytail.md), and meet the uncompromising quality standards of [AGENTS.md](file:///c:/Users/Lenovo/Documents/ds/.agents/AGENTS.md).

---

## Directory Navigation

| File | Purpose | Key Focus |
| :--- | :--- | :--- |
| **[01_ROLES_AND_PERMISSIONS.md](file:///c:/Users/Lenovo/Documents/ds/project_context/01_ROLES_AND_PERMISSIONS.md)** | User hierarchy, view access & privacy | Employee isolation, dual manager views, admin super-visibility |
| **[02_TASK_LIFECYCLE_AND_BLOCKERS.md](file:///c:/Users/Lenovo/Documents/ds/project_context/02_TASK_LIFECYCLE_AND_BLOCKERS.md)** | Core workflow & accountability engine | 3-input creation, blocker domino chain, sign-off & revision loop |
| **[03_FUNK_AND_AESTHETICS.md](file:///c:/Users/Lenovo/Documents/ds/project_context/03_FUNK_AND_AESTHETICS.md)** | Dopamine, gamification & visual vibe | Animated flame streaks, kudos stickers, victory screens, sound ASMR, themes |
| **[04_TECH_STACK_AND_SCHEMA.md](file:///c:/Users/Lenovo/Documents/ds/project_context/04_TECH_STACK_AND_SCHEMA.md)** | Engineering blueprints & data model | Next.js, Neon Serverless Postgres, SQL schema, PWA configuration |
| **[05_ACCEPTANCE_CHECKLIST.md](file:///c:/Users/Lenovo/Documents/ds/project_context/05_ACCEPTANCE_CHECKLIST.md)** | Verification gate & test criteria | Itemized checklist to prevent sidetracking and certify Phase 1 / Phase 2 completion |

---

## The 4 Non-Negotiable Guardrails (Anti-Sidetrack Rules)

1. **The Radical Simplicity Rule**: Task creation must never require more than **3 inputs**: (1) Title/Deliverable, (2) Assignee, (3) Due Date. Never add sub-projects, sprint points, or 10-field forms.
2. **The Employee Privacy Rule**: Employees must strictly only see their own tasks. Data isolation is enforced at the database query level (`WHERE assignee_id = session.user.id`), never on the frontend.
3. **The Anti-Bottleneck Rule**: Tasks cannot linger in `Needs Review` or `Blocked` without escalating. 24h/48h aging warnings signal that the bottleneck is on the reviewer.
4. **The Phased Discipline Rule**: We build and certify **Phase 1 (The Core Iron Engine)** first. Phase 2 (Extended Funk Suite) is layered on top only after Phase 1 passes every check.
