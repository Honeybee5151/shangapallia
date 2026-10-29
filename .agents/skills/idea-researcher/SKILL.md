---
name: idea-researcher
description: >-
  Conduct academic, empirical, or technical research on Miles Raven Alv Sunhede's
  Idea Fragments (Ideas 1–15) and update live research progress dossiers on the
  Shangapallia website. Activate whenever the user asks to research an idea, advance
  research progress, stress-test a fragment, design an experiment, or check idea
  research status.
---

# Idea Researcher Skill (Shangapallia)

Use this workflow whenever researching one or more ideas from `data/fragments.js` and publishing progress to the website's **AI Research Dossier** tab.

## Workflow Steps

1. **Inspect Current Status**
   Run the CLI status table to see which ideas are queued or in progress:
   ```powershell
   node scripts/research-cli.js status
   ```

2. **Read the Verbatim Fragment**
   Read the target fragment (`id: "1"`–`"15"`) in `data/fragments.js` and any existing entry in `data/research.json`. Preserve Miles's original voice and terminology while identifying testable claims, assumptions, and open questions.

3. **Investigate & Verify Literature**
   - Search for real peer-reviewed literature, books, empirical studies, and counterarguments.
   - Verify every citation's author names, year, title, and URL. Never invent citations.
   - Be intellectually honest: highlight both where established research strongly validates Miles's intuition and where hard tensions or edge cases (e.g., Goodhart's Law, reactance, measurement validity) arise.

4. **Update `data/research.json`**
   Each entry under `dossiers["<id>"]` follows this schema:
   ```json
   {
     "fragmentId": "1",
     "stage": "Literature & Feasibility",
     "progress": 55,
     "updatedAt": "YYYY-MM-DD",
     "agentName": "Descriptive Research Agent Role",
     "summary": "2–3 sentence executive synthesis of current research status.",
     "milestones": [
       { "label": "Milestone description", "done": true }
     ],
     "findings": [
       { "title": "Finding heading", "detail": "Detailed analytical paragraph." }
     ],
     "citations": [
       {
         "authors": "Author Name(s)",
         "year": "YYYY",
         "title": "Work Title",
         "relevance": "1-sentence link to Miles's idea.",
         "url": "https://..."
       }
     ],
     "nextSteps": [
       "Concrete next research action"
     ]
   }
   ```

5. **Validate & Sync to Website Bundle**
   Always run the sync command after editing `data/research.json`:
   ```powershell
   node scripts/research-cli.js sync
   ```
   This validates all fields/types and regenerates `data/research.js` for instant local and GitHub Pages rendering.
