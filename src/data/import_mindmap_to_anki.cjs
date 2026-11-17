/**
 * Import VSTEP Mindmap data directly into Anki via Anki MCP Server (port 3141).
 * Creates 5 separate standalone decks using model 'Cơ bản'.
 * For each item, generates 2 independent cards:
 *   - Card 1 (EN -> VI): Mặt trước = English, Mặt sau = Tiếng Việt
 *   - Card 2 (VI -> EN): Mặt trước = Tiếng Việt, Mặt sau = English (Tiếng Việt ở trước!)
 *
 * Format B:
 *   - VSTEP Mindmap - 01 Work
 *   - VSTEP Mindmap - 02 Education
 *   - VSTEP Mindmap - 03 Health
 *   - VSTEP Mindmap - 04 Technology
 *   - VSTEP Mindmap - 05 Society
 *
 * Cleans text: pure plain text, NO HTML, stripped emoji & prompt/label colon prefixes.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ANKI_MCP_PORT = 3141;

const TOPICS = [
  { id: 'work', file: 'work.json', deck: 'VSTEP Mindmap - 01 Work', label: 'Công việc & Sự nghiệp' },
  { id: 'education', file: 'education.json', deck: 'VSTEP Mindmap - 02 Education', label: 'Giáo dục & Học tập' },
  { id: 'health', file: 'health.json', deck: 'VSTEP Mindmap - 03 Health', label: 'Sức khỏe & Lối sống' },
  { id: 'technology', file: 'technology.json', deck: 'VSTEP Mindmap - 04 Technology', label: 'Công nghệ & AI' },
  { id: 'society', file: 'society.json', deck: 'VSTEP Mindmap - 05 Society', label: 'Xã hội & Môi trường' }
];

let reqCounter = 1;

function callTool(name, args) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name, arguments: args },
      id: ++reqCounter
    });
    const payloadBytes = Buffer.byteLength(payload, 'utf8');

    const req = http.request({
      hostname: '127.0.0.1',
      port: ANKI_MCP_PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payloadBytes,
        'Accept': 'application/json, text/event-stream'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const idx = body.indexOf('data: ');
        if (idx !== -1) {
          try {
            const parsed = JSON.parse(body.slice(idx + 6)).result;
            if (parsed && parsed.content && parsed.content[0] && parsed.content[0].text) {
              try {
                parsed.parsedText = JSON.parse(parsed.content[0].text);
              } catch (e) {}
            }
            resolve(parsed);
          } catch (e) {
            resolve({ error: e.message, body });
          }
        } else {
          resolve({ error: 'No data in SSE stream', body });
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
}

function cleanSentence(t) {
  if (!t) return '';
  let s = String(t).trim();
  // Strip emojis & variation selectors
  s = s.replace(/^[\p{Extended_Pictographic}\uFE00-\uFE0F\s]+/u, '');
  // Strip label prefixes ending with colon like 'Speaking Part 2 (Chọn Công ty lớn): '
  if (s.includes(':')) {
    const colonIdx = s.indexOf(':');
    const prefix = s.slice(0, colonIdx);
    if (/Speaking|Part|Nhánh|Quan điểm|Định nghĩa|Khuyên|Yêu cầu|Cấu trúc|Đề bài|Lắp vào|Ghi nhớ|Bác bỏ|Lý do|Cách|Tác hại|Giải pháp|Khi nào|Bạn|Về|Vai trò/i.test(prefix) || prefix.length < 80) {
      s = s.slice(colonIdx + 1).trim();
    }
  }
  // Strip any remaining leading symbols/colons
  s = s.replace(/^[:\s\p{Extended_Pictographic}\uFE00-\uFE0F-]+/u, '').trim();
  return s;
}

// Helper to push a pair of cards: EN->VI and VI->EN
function addPair(notesArray, enText, viText, extraTags) {
  const en = cleanSentence(enText);
  const vi = cleanSentence(viText);
  if (!en || !vi) return;

  // Thẻ 1: Chiều EN -> VI (Mặt trước: Tiếng Anh, Mặt sau: Tiếng Việt)
  notesArray.push({
    fields: {
      'Mặt trước': en,
      'Mặt sau': vi
    },
    tags: [...extraTags, 'en_to_vi']
  });

  // Thẻ 2: Chiều VI -> EN (Mặt trước: Tiếng Việt, Mặt sau: Tiếng Anh)
  notesArray.push({
    fields: {
      'Mặt trước': vi,
      'Mặt sau': en
    },
    tags: [...extraTags, 'vi_to_en']
  });
}

async function main() {
  console.log('🚀 Starting VSTEP Mindmap -> Anki Import (Model: Cơ bản, 2 chiều độc lập)...');

  const totalSummary = {
    topics: 0,
    created: 0,
    skipped: 0,
    failed: 0
  };

  for (const item of TOPICS) {
    console.log(`\n========================================`);
    console.log(`📂 Processing: ${item.deck} (${item.label})`);

    // 1. Create standalone deck
    const deckRes = await callTool('create_deck', { deck_name: item.deck });
    const deckInfo = deckRes?.parsedText || deckRes?.structuredContent;
    console.log(`   Deck status: ${deckInfo?.message || 'Deck ready'}`);

    // 2. Read mindmap data
    const filePath = path.join(__dirname, 'mindmap', item.file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const notes = [];
    const seenVocab = new Set();

    const branches = [...(data.leftBranches || []), ...(data.rightBranches || [])];

    // A. Extract Vocabulary (Kho từ vựng gốc + từ vựng kế thừa)
    for (const b of branches) {
      for (const kw of b.keywords || []) {
        const word = cleanSentence(kw.word);
        const meaning = cleanSentence(kw.meaning);
        const key = word.toLowerCase();
        if (word && meaning && !seenVocab.has(key)) {
          seenVocab.add(key);
          addPair(notes, word, meaning, ['vstep', 'vocabulary', item.id]);
        }
      }

      for (const c of b.children || []) {
        for (const kw of c.keywords || []) {
          const word = cleanSentence(kw.word);
          const meaning = cleanSentence(kw.meaning);
          const key = word.toLowerCase();
          if (word && meaning && !seenVocab.has(key)) {
            seenVocab.add(key);
            addPair(notes, word, meaning, ['vstep', 'vocabulary', item.id, c.id]);
          }
        }

        // B. Extract Nhánh 1, 2, 3, 4
        for (const it of c.items || []) {
          addPair(notes, it.text, it.viText, ['vstep', 'argument_branch', item.id, c.id]);
        }

        // C. Extract 3 câu trong [Phản xạ Speaking]
        const are = c.areSkeleton;
        if (are) {
          // Câu 1: [Phản xạ Speaking]
          addPair(notes, are.answer, are.answerVi, ['vstep', 'speaking_reflection', item.id, c.id]);

          // Câu 2: [Bác bỏ / Mở rộng]
          addPair(notes, are.reason, are.reasonVi, ['vstep', 'speaking_rebuttal', item.id, c.id]);

          // Câu 3: [Sơ đồ Lắp Template / Example]
          addPair(notes, are.example, are.exampleVi, ['vstep', 'writing_template', item.id, c.id]);
        }
      }
    }

    console.log(`   Total cards to push (both directions): ${notes.length} (Unique items: ${notes.length / 2}, Vocab: ${seenVocab.size})`);

    // 3. Batch push to Anki (chunks of 30) using model 'Cơ bản'
    const BATCH_SIZE = 30;
    let deckCreated = 0;
    let deckSkipped = 0;
    let deckFailed = 0;

    for (let i = 0; i < notes.length; i += BATCH_SIZE) {
      const batch = notes.slice(i, i + BATCH_SIZE);
      const res = await callTool('add_notes', {
        deck_name: item.deck,
        model_name: 'Cơ bản',
        notes: batch,
        allow_duplicate: false
      });

      const out = res?.parsedText || res?.structuredContent;
      if (out) {
        deckCreated += out.created || 0;
        deckSkipped += out.skipped || 0;
        deckFailed += out.failed || 0;
        console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${out.created} created, ${out.skipped} skipped.`);
      } else {
        console.warn(`   ⚠️ Batch ${Math.floor(i / BATCH_SIZE) + 1} unexpected response:`, res);
      }
    }

    console.log(`   Done ${item.deck}: ${deckCreated} created, ${deckSkipped} skipped, ${deckFailed} failed.`);
    totalSummary.topics++;
    totalSummary.created += deckCreated;
    totalSummary.skipped += deckSkipped;
    totalSummary.failed += deckFailed;
  }

  console.log(`\n========================================`);
  console.log(`🎉 ALL DONE! Total Summary:`);
  console.log(`   Topics processed: ${totalSummary.topics}`);
  console.log(`   Cards created:    ${totalSummary.created}`);
  console.log(`   Cards skipped:    ${totalSummary.skipped}`);
  console.log(`   Cards failed:     ${totalSummary.failed}`);
  console.log(`========================================\n`);
}

main().catch(err => {
  console.error('Fatal error in import script:', err);
  process.exit(1);
});
