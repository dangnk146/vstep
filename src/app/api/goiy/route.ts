import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type GoiyEntry = {
  file: string;
  title: string;
  skill?: string;
  part?: string;
  school?: string;
  batch?: string;
};

type GoiyIndex = Record<string, GoiyEntry>;

type ParsedTableRow = {
  no: string;
  thinking?: string;
  answer: string;
  reason: string;
  example: string;
};

type GoiyItemResult = {
  id: string;
  title: string;
  markdown: string;
  questions: string[];
  table: ParsedTableRow[];
};

const GOIY_DIR = path.join(process.cwd(), 'src', 'data', 'goiy');

function parseMarkdownTable(markdown: string): { questions: string[]; table: ParsedTableRow[] } {
  const lines = markdown.split('\n');
  const questions: string[] = [];
  const tableRows: ParsedTableRow[] = [];

  let inTable = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Collect questions (e.g., "1. What do you like...")
    const qMatch = line.match(/^\d+\.\s+(.+)$/);
    if (qMatch && !inTable) {
      questions.push(qMatch[1].trim());
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim());

      // Skip header and divider rows
      if (cells.some((cell) => /^:?-+:?$/.test(cell))) {
        inTable = true;
        continue;
      }
      const firstCell = cells[0].toLowerCase().replace(/\*/g, '').trim();
      if (firstCell === '#' || firstCell === 'option' || firstCell === 'phần' || firstCell === 'stt') {
        inTable = true;
        continue;
      }

      if (inTable) {
        if (cells.length >= 5) {
          // 5-column table: # | 💡 Cách suy luận | Answer | Reason | Example
          const no = cells[0].replace(/\*\*/g, '').trim();
          const thinking = cells[1].trim();
          const answer = cells[2].trim();
          const reason = cells[3].trim();
          const example = cells.slice(4).join(' | ').trim();
          if (no || answer || reason || thinking) {
            tableRows.push({ no, thinking, answer, reason, example });
          }
        } else if (cells.length === 4) {
          // 4-column table: # | Answer | Reason | Example
          const no = cells[0].replace(/\*\*/g, '').trim();
          const answer = cells[1].trim();
          const reason = cells[2].trim();
          const example = cells[3].trim();
          if (no || answer || reason) {
            tableRows.push({ no, thinking: '', answer, reason, example });
          }
        } else if (cells.length === 3) {
          // Part 2 with 3 columns: Option | 💡 Cách suy luận | Lý do
          const rawAnswer = cells[0].trim();
          const lowerAnswer = rawAnswer.toLowerCase();
          const isSelected = lowerAnswer.includes('chọn') && !lowerAnswer.includes('không');
          const isNotSelected = lowerAnswer.includes('không');
          
          if (isSelected || isNotSelected) {
            const no = isSelected ? '✓' : '✗';
            const thinking = cells[1].trim();
            const reason = cells[2].trim();
            tableRows.push({ no, thinking, answer: rawAnswer, reason, example: '' });
          } else {
            // General 3-column table: # | Answer | Reason
            const no = cells[0].replace(/\*\*/g, '').trim() || String(tableRows.length + 1);
            const answer = cells[1].trim();
            const reason = cells[2].trim();
            if (no || answer || reason) {
              tableRows.push({ no, thinking: '', answer, reason, example: '' });
            }
          }
        } else if (cells.length === 2) {
          const rawAnswer = cells[0].trim();
          const reason = cells[1].trim();
          const lowerAnswer = rawAnswer.toLowerCase();
          const isSelected = lowerAnswer.includes('chọn') && !lowerAnswer.includes('không');
          const isNotSelected = lowerAnswer.includes('không');
          const no = isSelected ? '✓' : isNotSelected ? '✗' : String(tableRows.length + 1);
          if (rawAnswer || reason) {
            tableRows.push({ no, thinking: '', answer: rawAnswer, reason, example: '' });
          }
        }
      }
    }
  }

  return { questions, table: tableRows };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id')?.trim();

    // Strictly require ID. Never expose the list of all available hints to client.
    if (!idParam) {
      return NextResponse.json(
        { ok: false, error: 'Yêu cầu mã câu hỏi (id). Không thể liệt kê toàn bộ gợi ý.' },
        { status: 400 }
      );
    }

    const indexPath = path.join(GOIY_DIR, 'goiy.json');
    let index: GoiyIndex = {};
    try {
      const indexRaw = await fs.readFile(indexPath, 'utf8');
      index = JSON.parse(indexRaw) as GoiyIndex;
    } catch {
      return NextResponse.json({ ok: false, error: 'Chưa cấu hình kho gợi ý.' }, { status: 404 });
    }

    // Support combined IDs e.g. "vlu10-speaking-part1-1+vlu10-speaking-part1-2"
    // Also handle spaces if '+' was unescaped by query string parser
    const ids = idParam
      .split(/[+,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    const results: GoiyItemResult[] = [];

    for (const targetId of ids) {
      const entry = index[targetId];
      if (!entry || !entry.file) continue;

      try {
        const mdPath = path.join(GOIY_DIR, path.basename(entry.file));
        const markdown = await fs.readFile(mdPath, 'utf8');
        const parsed = parseMarkdownTable(markdown);

        results.push({
          id: targetId,
          title: entry.title || targetId,
          markdown,
          questions: parsed.questions,
          table: parsed.table,
        });
      } catch (err) {
        console.warn(`Could not read markdown file ${entry.file}:`, err);
      }
    }

    return NextResponse.json({
      ok: true,
      items: results,
    });
  } catch (error) {
    console.error('Error fetching goiy:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
