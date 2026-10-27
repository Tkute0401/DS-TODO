# Section 2: Task Lifecycle, Blocker Engine & Accountability

> **Benchmark Goal**: Ensure zero timeline slippage by replacing silent procrastination with immediate, actionable transparency at every step of a deliverable's life.

---

## 1. Zero-Friction Task Creation (The 3-Input Rule)

To prevent the form-bloat that destroyed the previous in-house tracker, task creation is locked to **maximum 3 inputs**:

1. **Title / Deliverable**: Text input nudging for a concrete deliverable noun:
   * *Placeholder*: `"e.g., Final 30s Promo Cut, Client Pitch Deck, Raw Footage Dump"`
2. **Assignee**:
   * In `My Tasks`: **Automatically locked to the logged-in user** (zero dropdown clicks).
   * In `Team Board`: Defaults to the selected team member card.
3. **Due Date**: Date selector defaulting to firm's local **End of Business Day (7:00 PM)**.

*Time to create a personal task: 2 seconds (Type title ➔ Press `Enter`).*

---

## 2. The 4-State Task Lifecycle

```
┌─────────┐      ┌───────────────┐      ┌────────────────┐      ┌────────┐
│  TO DO  │ ───► │  IN PROGRESS  │ ───► │  NEEDS REVIEW  │ ───► │  DONE  │
└─────────┘      └───────────────┘      └────────────────┘      └────────┘
                        │                        │
                        ▼                        ▼
                 ┌───────────────┐        ┌──────────────┐
                 │    BLOCKED    │        │  REVISIONS   │
                 │   (Alerts)    │        │  REQUESTED   │
                 └───────────────┘        └──────────────┘
```

### State A: `TO DO`
* Task is queued for today or upcoming.
* Visual state: Clean neutral card.

### State B: `IN PROGRESS`
* Active work has begun.
* Visual state: Breathing cyan / electric-blue accent border.

### State C: `BLOCKED` (The Accountability Domino Engine)
* Triggered when an employee cannot proceed.
* **The Blocker Modal (10-second submission)**:
  1. *Who/What is blocking this?*
     * **[ Colleague ]**: Dropdown of team members (e.g. *Rahul Sharma - Videographer*).
     * **[ Client ]**: One-click select.
     * **[ External ]**: Vendor / software / asset issue.
  2. *Reason / Missing Item*: Mandatory 1-line note (*"Need the raw footage from Sunday's shoot"*).
* **The Immediate Consequences**:
  * **For the Blocked Employee**: Clock pauses; task turns amber/hazard striped with note: *"Waiting on Rahul"*.
  * **For the Responsible Colleague (Rahul)**: Instantly receives urgent notification + an actionable card at the very top of their screen:
    > **🚨 You are blocking Video Editor on: Promo Video**  
    > *Note: "Need raw footage from Sunday's shoot"*  
    > **`[ Mark Resolved / Delivered ]`** button
  * **For the Manager**: People-First Board lights up with dependency alert: `[Editor] ➔ BLOCKED BY ➔ [Rahul]`.
* **The Resolution Loop**:
  * Rahul clicks `Mark Resolved`.
  * Blocker card clears from Rahul's screen.
  * Editor gets instant alert: *"Rahul resolved your blocker! Ready to resume?"* ➔ Clicks `Resume` ➔ Returns to `IN PROGRESS`.

### State D: `NEEDS REVIEW` (Manager Sign-Off Gate)
* Deliverable is ready for inspection.
* **Deliverable Link**: Optional 1-click URL (Google Drive, Figma, Frame.io, Dropbox).
* **Manager Actions**:
  * **`Approve & Award Kudos`**: Moves officially to `DONE`. Triggers confetti burst and increments employee streak.
  * **`Request Changes`**: Prompts mandatory 1-line feedback (*"Fix sound levels at 0:15"*). Flips status back to `IN PROGRESS` with amber tag: *"Revisions Requested by Manager"*.
* **Aging Indicators**:
  * In review >24 hours: Turns amber on Manager dashboard.
  * In review >48 hours: Turns red on Manager dashboard and flags the **Admin Bottleneck Widget**.

### State E: `DONE`
* Deliverable officially completed, verified, and archived.
* Completed items older than 7 days automatically roll into the **Archive / History** tab to keep the active workspace blazing fast.

---

## 3. Daily Operational Rhythm & Special States

* **Unfinished Task Rollover**: Tasks from yesterday that were not finished automatically pin to the top of `My Tasks` under:  
  **`🔴 Rolled Over From Yesterday (X Tasks)`**. They never hide in the past.
* **Emergency P0 Priority**: Managers can toggle **`⚡ Urgent / P0`** on any task. It pins itself to the absolute top of the employee's screen with an animated electric pulse border.
* **Self-Task Exception**: Subtasks created by an employee for themselves (`creator_id === assignee_id`) skip `Needs Review` and check off directly to `DONE`.
