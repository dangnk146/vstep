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
