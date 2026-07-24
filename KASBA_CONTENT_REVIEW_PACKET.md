# KASBA Content Review Packet

**For: an education / learning-science subject-matter expert**
**Purpose:** Every row below is currently seeded with a placeholder target level of 3/5, uniform across every domain and every K/A/S/B/A dimension. This was a deliberate structural placeholder, not a real assessment standard — it exists so the system's scoring engine has something to compute against, not because 3/5 reflects any real judgment about what "proficient" means for that domain. Your job is to fill in the Reviewed Target Level and Notes columns; nothing else needs to change in the code once you do.

**How to give this back:** for each row, either confirm 3 is reasonable, or replace it with a real number (1-5) and say why. If a domain shouldn't be uniform across all five KASBA dimensions (e.g., Knowledge target should differ from Attitude target), say so in the notes — that's a real, valid finding, and it means the underlying code needs a small change to support per-dimension targets instead of one target per domain (currently the case).

---

## Teacher Domains (api/src/cli/seed-teacher-capabilities.ts)

| Code | Domain | Current Description | Placeholder Target | Reviewed Target | Notes |
|---|---|---|---|---|---|
| TCH-SUBJ | Subject Knowledge | Depth and accuracy of subject-matter expertise in the teacher's assigned subject(s). | 3/5 | | |
| TCH-PED | Pedagogical Ability | Ability to translate subject knowledge into effective instruction for the student's level. | 3/5 | | |
| TCH-SKILL | Teaching Skills | Practical classroom delivery skills — pacing, explanation clarity, questioning technique. | 3/5 | | |
| TCH-BEH | Behaviour | Observable professional conduct in the classroom and with colleagues. | 3/5 | | |
| TCH-ATT | Professional Attitude | Disposition toward continuous improvement, feedback, and student wellbeing. | 3/5 | | |
| TCH-COMM | Communication | Clarity and effectiveness of communication with students, parents, and staff. | 3/5 | | |
| TCH-TECH | Technology | Effective use of classroom and instructional technology. | 3/5 | | |
| TCH-MGMT | Classroom Management | Ability to maintain a productive, safe, and orderly learning environment. | 3/5 | | |
| TCH-ASSESS | Assessment | Skill in designing, administering, and interpreting student assessments. | 3/5 | | |
| TCH-ENGAGE | Student Engagement | Ability to motivate and sustain active student participation. | 3/5 | | |

## Student Domains (api/src/cli/seed-student-capabilities.ts)

| Code | Domain | Current Description | Placeholder Target | Reviewed Target | Notes |
|---|---|---|---|---|---|
| STU-CRIT | Critical Thinking | Ability to analyze information, question assumptions, and reason toward sound conclusions. | 3/5 | | |
| STU-COMM | Communication | Clarity and effectiveness expressing ideas verbally and in writing. | 3/5 | | |
| STU-CREAT | Creativity | Ability to generate original ideas and approaches to problems. | 3/5 | | |
| STU-COLLAB | Collaboration | Ability to work productively with peers toward a shared goal. | 3/5 | | |
| STU-PROB | Problem Solving | Ability to identify problems and apply appropriate methods to solve them. | 3/5 | | |
| STU-DIGI | Digital Literacy | Effective and responsible use of digital tools for learning. | 3/5 | | |
| STU-LEAD | Leadership | Ability to take initiative and positively influence peers in group settings. | 3/5 | | |

Reviewer note flagged in the seed script itself, worth your attention: "Knowledge/Ability/Skill/Behaviour/Attitude" appear in the roadmap's own domain list alongside these 7 — but those five ARE the KASBA scoring dimensions applied to every domain below, not separate domains themselves. Seeding them as their own rows would double-count. Confirm this reasoning holds, or flag if it doesn't.

## Healthcare Workforce Domains (api/src/cli/seed-healthcare-workforce-capabilities.ts)

Scope note: staff professional-practice competency only. Zero patient/clinical-care content — that was deliberately excluded as outside what this system should ever generate or assess.

| Code | Domain | Current Description | Placeholder Target | Reviewed Target | Notes |
|---|---|---|---|---|---|
| HC-CLINPRAC | Clinical Practice Standards | Adherence to the institution's own documented clinical practice standards and protocols — not a source of clinical guidance itself. | 3/5 | | |
| HC-PATSAFE | Patient Safety Practice | Staff competency in the institution's patient safety procedures (hand hygiene, identification protocols, incident reporting). | 3/5 | | |
| HC-COMM | Clinical Communication | Clarity and effectiveness communicating with patients, families, and the care team. | 3/5 | | |
| HC-TEAMWORK | Interdisciplinary Teamwork | Ability to collaborate effectively across roles in a care team. | 3/5 | | |
| HC-DOCUMENT | Clinical Documentation Quality | Accuracy, completeness, and timeliness of required documentation practices. | 3/5 | | |
| HC-TECH | Medical Technology Proficiency | Effective use of the institution's clinical and administrative technology systems. | 3/5 | | |
| HC-CRISIS | Crisis Response | Composure and procedural adherence during emergency situations. | 3/5 | | |
| HC-PROFDEV | Professional Development | Engagement with continuing education and skill maintenance requirements. | 3/5 | | |

---

## For whoever applies the reviewer's answers back into the codebase

Each seed script's run() function builds a KasbaElement per dimension with targetLevel: 3 hardcoded. Once real numbers come back, the change is a direct value substitution in the relevant .ts file — no schema change needed unless the reviewer flags the per-dimension-target issue noted above.
