# Section 1: User Roles, Permissions & View Isolation

> **Benchmark Goal**: Guarantee strict role separation, protect employee privacy, enable dual views for managers, and provide zero-friction account provisioning.

---

## 1. User Roles Overview

The system supports **3 distinct roles** for a firm of 10 to 30 people:

### A. Employee (Individual Contributor)
* **Access**: Strictly restricted to their own personal todo list (**`My Tasks`**).
* **Isolation Guarantee**: Under no circumstances can an employee see peer tasks, team lists, or global boards.
* **Creation Flow**: When an employee creates a task, the `Assignee` field is **permanently auto-filled and locked to themselves**.
* **Completion Flow**: For personal subtasks (`creator_id === assignee_id`), they can directly check it off to `Done`. For assigned deliverables (`creator_id !== assignee_id`), checking it off moves it to `Needs Review` for manager sign-off.
* **Deletion Protection**: Employees **cannot** delete tasks assigned to them by a manager (prevents hiding delayed deliverables).

### B. Manager
* **Dual-Role Workflow**: Managers are also active contributors with their own work.
* **Interface Switcher**: Top navigation toggle between:
  1. **`My Tasks`**: Their own personal task list (behaves identically to an employee view).
  2. **`Team Board`**: The "People-First" operational command center showing all team members, active deliverables, blockers, and review queues.
* **Assignment Authority**: Can assign core deliverables to any team member or themselves.
* **Review Authority**: Approves or requests revisions on deliverables completed by team members.
* **Deadline Authority**: Only managers and admins can extend deadlines on assigned deliverables (tags task as *"Deadline Extended by Manager"* to preserve employee streaks).

### C. Admin (Firm Leadership / Executive)
* **Full Oversight**: Full access to all team members, departments, and boards.
* **Manager Bottleneck Widget**: Specialized dashboard view highlighting any manager with tasks pending review or blocked for >24 hours.
* **User Provisioning**: Dedicated Admin Settings panel to create, edit, and deactivate team accounts (eliminates complex public signups or email token invites).

---

## 2. Permission & Capability Matrix

| Feature / Action | Employee | Manager | Admin |
| :--- | :---: | :---: | :---: |
| View `My Tasks` | ✅ | ✅ | ✅ |
| View `Team Board` (People-First Grid) | ❌ | ✅ | ✅ |
| View Admin Bottleneck Widget | ❌ | ❌ | ✅ |
| Create Self-Task (Auto-filled Assignee) | ✅ | ✅ | ✅ |
| Assign Task to Other Team Members | ❌ | ✅ | ✅ |
| Complete Self-Task Directly to `Done` | ✅ | ✅ | ✅ |
| Submit Assigned Task for `Needs Review` | ✅ | ✅ (to Admin) | N/A |
| Sign-Off / Approve Team Deliverables | ❌ | ✅ | ✅ |
| Request Revisions with Feedback Note | ❌ | ✅ | ✅ |
| Extend / Modify Due Dates | ❌ | ✅ | ✅ |
| Create / Deactivate User Accounts | ❌ | ❌ | ✅ |

---

## 3. Account Provisioning Flow (Lazy Senior Dev Standard)

* **No Public Registration**: Prevents unauthorized access or spam.
* **Admin Setup**: Admin opens Settings ➔ Clicks **`+ Add Team Member`**:
  * Fields: Full Name, Email, Role (`EMPLOYEE` / `MANAGER` / `ADMIN`), Designation, and Temporary Password (or PIN).
  * Takes <30 seconds per user. Entire firm of 20 people onboarded in under 10 minutes.
* **Soft Deactivation (`is_active = false`)**: When an employee leaves, their account is deactivated rather than deleted, keeping all historical tasks, blockers, and audit timelines 100% intact.
