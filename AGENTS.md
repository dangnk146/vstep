<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# VSTEP Data Management & Mindmap Hubs Workflow

Whenever the user asks to add or update new exam questions into `src/data/speaking/` or `src/data/writing/` or `src/data/index.json`:
1. **Maintain Schema Consistency**: Always ensure new question objects adhere to the standard schema (`id`, `school`, `batch`, `part`, `group`, `title`, `content`).
2. **Auto-Update Topic Hubs & Mindmaps**:
   Run the automation script immediately after updating `index.json`:
   ```bash
   node src/data/generate_speaking_hubs.cjs
   ```
   This will automatically re-classify all questions across Part 1, Part 2, and Part 3 into the 5 core Topic Hubs and refresh `src/data/speaking_hubs.json`.

# VSTEP Speaking Hint Generation Standards (example-speaking.md)
When generating or updating speaking hints in `src/data/goiy/`:
1. **No Automation Scripts**: Write content directly into Markdown files and `goiy.json`. Do NOT use Python/JS generation scripts.
2. **Teacher's Framework**: Always follow the teacher's core thinking pattern from `example-speaking.md` (Direct Answer -> Reasons tied to Mental health, Physical health, Relationships, Knowledge, Convenience -> Concrete example).
3. **Strict B1-B2 Level**: Strictly ban overly academic/esoteric words (e.g. *distraction-free*, *quiet sanctuary*, *tangible reading experience*, *succumb to*, *formidable legal deterrence*). Use natural, everyday, spoken English that learners can easily memorize and say under exam pressure.

