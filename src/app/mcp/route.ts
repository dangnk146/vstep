import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import {
  applyExamFilters,
  formatExamsAsMarkdown,
  getExamMetadata,
  loadExamDataset,
  toCleanExamRecord,
} from '@/lib/mcpExams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Create a stateless, read-only VSTEP MCP server instance with 4 exam-fetching tools.
 */
function createVstepMcpServer(): McpServer {
  const server = new McpServer({
    name: 'vstep-exams-mcp',
    version: '1.0.0',
  });

  server.registerTool(
    'list_exam_filters',
    {
      title: 'Danh sách trường, đợt thi và thống kê đề VSTEP',
      description:
        'Lấy danh sách các trường (schools), đợt/tháng thi (batches như 09/2026, 10/2026, 11/2026), tên bộ đề (groups) và số lượng đề theo từng kỹ năng/phần thi.',
      inputSchema: {
        school: z.string().optional().describe('Lọc thống kê theo mã trường (VD: VLU, HUST, CTU).'),
        batch: z.string().optional().describe('Lọc thống kê theo đợt/tháng (VD: 09/2026 hoặc 09).'),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ school, batch }) => {
      const metadata = await getExamMetadata({ school, batch });
      return {
        content: [{ type: 'text', text: JSON.stringify(metadata, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_exams',
    {
      title: 'Lấy danh sách đề thi VSTEP theo bộ lọc',
      description:
        'Tìm và lấy các đề thi Speaking/Writing từ ngân hàng đề VSTEP theo đợt/tháng (VD: 09/2026, 10/2026, 11/2026 hoặc "09"), trường (VLU, HUST, CTU...), kỹ năng, part/task, nhóm đề hoặc từ khóa.',
      inputSchema: {
        batches: z
          .array(z.string())
          .optional()
          .describe('Danh sách đợt/tháng thi cần lấy, VD: ["09/2026"] hoặc ["09"].'),
        schools: z
          .array(z.string())
          .optional()
          .describe('Danh sách mã trường cần lấy, VD: ["VLU", "HUST", "CTU"].'),
        skill: z
          .enum(['all', 'speaking', 'writing'])
          .optional()
          .describe('Kỹ năng cần lấy (all, speaking, writing).'),
        part: z
          .enum([
            'all',
            'speaking-part1',
            'speaking-part2',
            'speaking-part3',
            'writing-task1',
            'writing-task2',
            'part1',
            'part2',
            'part3',
            'task1',
            'task2',
          ])
          .optional()
          .describe('Phần thi cụ thể (VD: speaking-part2, writing-task1, part2, task1...).'),
        group: z.string().optional().describe('Lọc theo tên bộ đề / ngày thi (tìm gần đúng).'),
        query: z.string().optional().describe('Từ khóa tìm trong tiêu đề, nội dung hoặc mã đề.'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe('Số lượng đề tối đa trả về mỗi lần (mặc định 30, tối đa 200).'),
        offset: z.number().int().min(0).optional().describe('Vị trí bắt đầu phân trang (mặc định 0).'),
        format: z
          .enum(['json', 'markdown'])
          .optional()
          .describe('Định dạng trả về: json (mặc định) hoặc markdown giống chức năng Xuất Markdown.'),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ batches, schools, skill, part, group, query, limit = 30, offset = 0, format = 'json' }) => {
      const dataset = await loadExamDataset();
      const matched = applyExamFilters(dataset.prompts, {
        batches,
        schools,
        skill,
        part,
        group,
        query,
      });

      const sliced = matched.slice(offset, offset + limit);

      if (format === 'markdown') {
        const md = formatExamsAsMarkdown(sliced);
        const paginationNote =
          matched.length > offset + sliced.length
            ? `\n*Đang hiển thị ${sliced.length}/${matched.length} đề (offset=${offset}, limit=${limit}). Gọi lại với offset=${offset + limit} để lấy tiếp.*\n`
            : '';
        return {
          content: [{ type: 'text', text: `${md}${paginationNote}` }],
        };
      }

      const payload = {
        totalMatched: matched.length,
        returnedCount: sliced.length,
        offset,
        limit,
        hasMore: offset + sliced.length < matched.length,
        items: sliced.map(toCleanExamRecord),
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_exam_by_id',
    {
      title: 'Lấy chi tiết đề thi theo mã đề',
      description: 'Lấy nội dung đầy đủ của 1 hoặc nhiều đề thi theo danh sách mã đề (id).',
      inputSchema: {
        ids: z
          .array(z.string())
          .min(1)
          .max(20)
          .describe('Danh sách mã đề cần lấy, VD: ["vlu11-speaking-part2-1"].'),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ ids }) => {
      const dataset = await loadExamDataset();
      const map = new Map(dataset.prompts.map((item) => [item.id, item]));
      const items = ids
        .map((id) => map.get(id.trim()))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map(toCleanExamRecord);

      return {
        content: [{ type: 'text', text: JSON.stringify({ found: items.length, items }, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_random_exam',
    {
      title: 'Bốc ngẫu nhiên đề thi VSTEP',
      description: 'Chọn ngẫu nhiên 1 hoặc nhiều đề thi theo bộ lọc (tháng/đợt, trường, kỹ năng, phần thi, từ khóa).',
      inputSchema: {
        batches: z.array(z.string()).optional().describe('Danh sách đợt/tháng thi, VD: ["09/2026"].'),
        schools: z.array(z.string()).optional().describe('Danh sách mã trường, VD: ["VLU"].'),
        skill: z.enum(['all', 'speaking', 'writing']).optional().describe('Kỹ năng cần bốc ngẫu nhiên.'),
        part: z
          .enum([
            'all',
            'speaking-part1',
            'speaking-part2',
            'speaking-part3',
            'writing-task1',
            'writing-task2',
            'part1',
            'part2',
            'part3',
            'task1',
            'task2',
          ])
          .optional()
          .describe('Phần thi cụ thể.'),
        query: z.string().optional().describe('Từ khóa lọc trước khi bốc ngẫu nhiên.'),
        count: z.number().int().min(1).max(10).optional().describe('Số đề ngẫu nhiên cần lấy (mặc định 1, tối đa 10).'),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ batches, schools, skill, part, query, count = 1 }) => {
      const dataset = await loadExamDataset();
      const pool = applyExamFilters(dataset.prompts, {
        batches,
        schools,
        skill,
        part,
        query,
      });

      const copy = [...pool];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }

      const selected = copy.slice(0, Math.min(count, copy.length)).map(toCleanExamRecord);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ poolSize: pool.length, count: selected.length, items: selected }, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

async function handleMcpRequest(request: Request): Promise<Response> {
  // Normalize Accept header for relaxed HTTP/MCP callers while preserving strict spec support
  const accept = request.headers.get('accept') || '';
  let normalizedRequest = request;
  if (
    request.method === 'POST' &&
    (!accept.includes('application/json') || !accept.includes('text/event-stream'))
  ) {
    const headers = new Headers(request.headers);
    headers.set('accept', 'application/json, text/event-stream');
    normalizedRequest = new Request(request, { headers });
  }

  const server = createVstepMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  try {
    const response = await transport.handleRequest(normalizedRequest);
    return withCors(response);
  } finally {
    await transport.close();
    await server.close();
  }
}

function methodNotAllowedResponse(): Response {
  return withCors(
    Response.json(
      {
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null,
      },
      { status: 405, headers: { Allow: 'GET, POST, OPTIONS' } },
    ),
  );
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE() {
  return methodNotAllowedResponse();
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const accept = request.headers.get('accept') || '';

  // Per MCP Streamable HTTP spec, stateless servers return 405 for standalone GET SSE stream probes
  if (accept.includes('text/event-stream') && !accept.includes('text/html')) {
    return methodNotAllowedResponse();
  }

  // Server-computed metadata before rendering response
  const metadata = await getExamMetadata();
  const endpointUrl = new URL('/mcp', request.url).toString();

  if (accept.includes('application/json') && !accept.includes('text/html')) {
    return withCors(
      Response.json({
        ok: true,
        name: 'vstep-exams-mcp',
        endpoint: endpointUrl,
        mode: 'read-only',
        tools: ['list_exam_filters', 'get_exams', 'get_exam_by_id', 'get_random_exam'],
        metadata,
      }),
    );
  }

  const batchListHtml = metadata.batches
    .map(
      (b) =>
        `<span class="pill"><code>${escapeHtml(b)}</code><span>${metadata.byBatch[b] ?? 0} đề</span></span>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>vstep-exams-mcp</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #09090b;
      --surface: #111114;
      --surface-2: #18181b;
      --border: #27272a;
      --text: #fafafa;
      --muted: #a1a1aa;
      --accent: #ef4444;
      --ok: #22c55e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, #181216 0%, var(--bg) 52%);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      display: grid;
      place-items: center;
      padding: 24px 16px;
    }
    main { width: 100%; max-width: 640px; display: grid; gap: 12px; }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px 20px;
    }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .dot {
      width: 8px; height: 8px; border-radius: 999px;
      background: var(--ok);
      box-shadow: 0 0 10px var(--ok);
    }
    h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .status {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 9px; border-radius: 999px;
      border: 1px solid #14532d; background: #052e16; color: #86efac;
      font-size: 11px; font-weight: 600; font-family: ui-monospace, monospace;
    }
    .endpoint {
      margin-top: 14px;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 9px 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12.5px;
      color: #e4e4e7;
      overflow-x: auto;
    }
    .endpoint span { color: var(--accent); font-weight: 700; margin-right: 6px; }
    .stats {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .stat {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
    }
    .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .stat-val { margin-top: 2px; font-size: 18px; font-weight: 700; font-family: ui-monospace, monospace; }
    .pills { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
    .pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--surface-2); border: 1px solid var(--border);
      border-radius: 6px; padding: 4px 8px; font-size: 12px; color: var(--muted);
    }
    .pill code { color: var(--text); font-family: ui-monospace, monospace; }
    .section-title {
      margin: 0 0 10px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--muted);
    }
    .tools { display: grid; gap: 8px; }
    .tool {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
    }
    .tool-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .tool-name { font-family: ui-monospace, monospace; font-size: 13px; font-weight: 700; color: #fca5a5; }
    .ro { font-family: ui-monospace, monospace; font-size: 10px; color: var(--muted); border: 1px solid var(--border); padding: 1px 6px; border-radius: 4px; }
    .tool-desc { margin: 4px 0 0; font-size: 12.5px; color: var(--muted); }
    .schools { margin-top: 10px; font-size: 11.5px; color: var(--muted); font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <div class="top">
        <div class="brand">
          <span class="dot" aria-hidden="true"></span>
          <h1>vstep-exams-mcp</h1>
        </div>
        <span class="status">STREAMABLE HTTP · READ-ONLY</span>
      </div>
      <div class="endpoint">
        <div><span>MCP</span>${escapeHtml(endpointUrl)}</div>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Tổng đề</div>
          <div class="stat-val">${metadata.totalInBank}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Trường</div>
          <div class="stat-val">${metadata.schools.length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Đợt thi</div>
          <div class="stat-val">${metadata.batches.length}</div>
        </div>
      </div>
      <div class="pills">${batchListHtml}</div>
      <div class="schools">${escapeHtml(metadata.schools.join(' · '))}</div>
    </section>

    <section class="panel">
      <h2 class="section-title">Tools</h2>
      <div class="tools">
        <div class="tool">
          <div class="tool-head"><span class="tool-name">list_exam_filters</span><span class="ro">GET</span></div>
          <p class="tool-desc">Danh sách trường, đợt/tháng thi, nhóm đề và thống kê số lượng.</p>
        </div>
        <div class="tool">
          <div class="tool-head"><span class="tool-name">get_exams</span><span class="ro">GET</span></div>
          <p class="tool-desc">Lấy &amp; lọc đề theo batches, schools, skill, part, query (JSON / Markdown).</p>
        </div>
        <div class="tool">
          <div class="tool-head"><span class="tool-name">get_exam_by_id</span><span class="ro">GET</span></div>
          <p class="tool-desc">Lấy chi tiết 1 hoặc nhiều đề theo danh sách mã đề ids.</p>
        </div>
        <div class="tool">
          <div class="tool-head"><span class="tool-name">get_random_exam</span><span class="ro">GET</span></div>
          <p class="tool-desc">Bốc ngẫu nhiên đề thi theo điều kiện lọc.</p>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`;

  return withCors(
    new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }),
  );
}

