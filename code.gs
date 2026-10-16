const SKILLS = ["speaking", "writing", "listening"];

const FIELD_ALIASES = {
  school: ["ma truong", "truong", "school", "school code"],
  batch: ["dot thi", "thang thi", "ky thi", "batch", "month"],
  id: ["id", "ma de", "ma cau hoi", "exam id", "question id"],
  part: ["part", "phan", "phan thi", "task", "ky nang", "section"],
  group: ["bo de", "nhom chu de", "bo de nhom chu de", "group", "category"],
  title: ["title", "tieu de", "tieu de de bai", "ten de", "chu de", "topic"],
  content: ["content", "noi dung", "noi dung chi tiet", "de thi", "cau hoi", "question", "prompt"],
  videoId: ["video id", "youtube id", "youtube", "link video", "video", "url"]
};

function getSheetForSkill(ss, skill) {
  if (skill === "listening") {
    return ss.getSheetByName("listining") || ss.getSheetByName("listening");
  }
  return ss.getSheetByName(skill);
}

function normalizeHeader(value) {
  return String(value || "")
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findFieldIndex(headers, field) {
  const aliases = FIELD_ALIASES[field].map(normalizeHeader);
  return headers.findIndex(function(header) {
    const normalized = normalizeHeader(header);
    return aliases.indexOf(normalized) !== -1;
  });
}

function getSheetRecords(skill) {
  const sheet = getSheetForSkill(SpreadsheetApp.getActiveSpreadsheet(), skill);
  if (!sheet) {
    throw new Error("Missing sheet for skill: " + skill);
  }

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function(header) {
    return String(header || "").trim();
  });
  const schoolIndex = findFieldIndex(headers, "school");
  const batchIndex = findFieldIndex(headers, "batch");
  const requiredFields = skill === "listening"
    ? ["part", "videoId"]
    : ["id", "part", "group", "title", "content", "school", "batch"];
  const missingFields = requiredFields.filter(function(field) {
    return findFieldIndex(headers, field) < 0;
  });
  if (missingFields.length) {
    throw new Error("Sheet " + sheet.getName() + " is missing required columns: " + missingFields.join(", "));
  }

  return values.slice(1).reduce(function(records, row, rowIndex) {
    if (row.every(function(value) { return !String(value || "").trim(); })) return records;
    const record = {};
    headers.forEach(function(header, index) {
      if (header) record[header] = row[index];
    });

    const partIndex = findFieldIndex(headers, "part");
    const titleIndex = findFieldIndex(headers, "title");
    const contentIndex = findFieldIndex(headers, "content");
    const idIndex = findFieldIndex(headers, "id");
    const groupIndex = findFieldIndex(headers, "group");
    const videoIndex = findFieldIndex(headers, "videoId");
    const metadataIndexes = [schoolIndex, batchIndex, partIndex, titleIndex, idIndex, groupIndex, videoIndex];
    const content = contentIndex >= 0
      ? String(row[contentIndex] || "").trim()
      : headers.reduce(function(lines, header, index) {
        const value = String(row[index] || "").trim();
        if (value && metadataIndexes.indexOf(index) === -1) lines.push(header + ": " + value);
        return lines;
      }, []).join("\n");

    const rawPart = partIndex >= 0 ? String(row[partIndex] || "").trim() : "";
    const rawVideoId = videoIndex >= 0 ? String(row[videoIndex] || "").trim() : "";
    const videoMatch = rawVideoId.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i);
    const videoId = videoMatch ? videoMatch[1] : rawVideoId;
    const school = schoolIndex >= 0 ? String(row[schoolIndex] || "").trim() : "";
    const batch = batchIndex >= 0 ? String(row[batchIndex] || "").trim() : "";

    record.id = idIndex >= 0 && row[idIndex]
      ? String(row[idIndex]).trim()
      : skill + "-" + (rowIndex + 2);
    record.skill = skill;
    record.school = school;
    record.batch = batch;
    record.part = normalizePart(rawPart);
    record.group = groupIndex >= 0 ? String(row[groupIndex] || "").trim() : "";
    record.title = titleIndex >= 0 && row[titleIndex]
      ? String(row[titleIndex]).trim()
      : "Đề " + (rowIndex + 1);
    record.content = content;
    if (videoId) record.videoId = videoId;
    records.push(record);
    return records;
  }, []);
}

function normalizePart(value) {
  const text = normalizeHeader(value);
  const match = text.match(/(?:part|phan|task)\s*([123])/);
  if (match) return "part" + match[1];
  if (/^[123]$/.test(text)) return "part" + text;
  return text;
}

function parseMonthYear(input) {
  if (!input) return { month: null, year: null };
  const text = String(input).trim();
  let match = text.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?/);
  if (match) {
    const month = parseInt(match[2], 10);
    return month >= 1 && month <= 12
      ? { year: parseInt(match[1], 10), month: month }
      : { month: null, year: null };
  }

  match = text.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    return month >= 1 && month <= 12
      ? { month: month, year: parseInt(match[2], 10) }
      : { month: null, year: null };
  }

  match = text.match(/^\d{1,2}[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const month = parseInt(match[2], 10);
    return month >= 1 && month <= 12
      ? { month: month, year: parseInt(match[3], 10) }
      : { month: null, year: null };
  }

  return { month: null, year: null };
}

function matchesBatch(recordBatch, requestedBatch) {
  if (!requestedBatch) return true;
  const requested = parseMonthYear(requestedBatch);
  const existing = parseMonthYear(recordBatch);
  if (requested.month && requested.year && existing.month && existing.year) {
    return requested.month === existing.month && requested.year === existing.year;
  }
  return normalizeHeader(recordBatch) === normalizeHeader(requestedBatch);
}

function getFilteredRecords(skill, school, batch, part, limit) {
  if (SKILLS.indexOf(skill) < 0) throw new Error("Unknown skill: " + skill);
  const records = getSheetRecords(skill).filter(function(record) {
    const matchesSchoolAndBatch = skill === "listening"
      || ((!school || normalizeHeader(record.school) === normalizeHeader(school))
        && matchesBatch(record.batch, batch));
    return matchesSchoolAndBatch
      && (!part || normalizePart(record.part) === normalizePart(part));
  });
  return typeof limit === "number" ? records.slice(0, limit) : records;
}

function getRandomRecords(skill, school, batch, part, count) {
  if (SKILLS.indexOf(skill) < 0) throw new Error("Unknown skill: " + skill);
  if (skill === "listening") {
    throw new Error("Random exam selection is only supported for Speaking and Writing.");
  }

  const sheet = getSheetForSkill(SpreadsheetApp.getActiveSpreadsheet(), skill);
  if (!sheet) throw new Error("Missing sheet for skill: " + skill);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function(header) { return String(header || "").trim(); });
  const indexes = {
    id: findFieldIndex(headers, "id"),
    part: findFieldIndex(headers, "part"),
    group: findFieldIndex(headers, "group"),
    title: findFieldIndex(headers, "title"),
    content: findFieldIndex(headers, "content"),
    school: findFieldIndex(headers, "school"),
    batch: findFieldIndex(headers, "batch")
  };
  const missingFields = Object.keys(indexes).filter(function(field) { return indexes[field] < 0; });
  if (missingFields.length) {
    throw new Error("Sheet " + sheet.getName() + " is missing required columns: " + missingFields.join(", "));
  }

  const requestedPart = part ? normalizePart(part) : "";
  const requestedSchool = normalizeHeader(school);
  const sample = [];
  let matches = 0;
  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    if (row.every(function(value) { return !String(value || "").trim(); })) continue;
    if (requestedSchool && normalizeHeader(row[indexes.school]) !== requestedSchool) continue;
    if (!matchesBatch(row[indexes.batch], batch)) continue;
    if (requestedPart && normalizePart(row[indexes.part]) !== requestedPart) continue;

    matches++;
    const selectedIndex = Math.floor(Math.random() * matches);
    if (selectedIndex < count) {
      sample[selectedIndex] = {
        id: String(row[indexes.id] || "").trim(),
        skill: skill,
        school: String(row[indexes.school] || "").trim(),
        batch: String(row[indexes.batch] || "").trim(),
        part: normalizePart(row[indexes.part]),
        group: String(row[indexes.group] || "").trim(),
        title: String(row[indexes.title] || "").trim(),
        content: String(row[indexes.content] || "").trim()
      };
    }
  }
  return sample;
}

function getApiOptions(school, batch) {
  const records = ["speaking", "writing"].reduce(function(all, skill) {
    return all.concat(getSheetRecords(skill));
  }, []);
  return {
    schools: uniqueSorted(records
      .filter(function(record) { return matchesBatch(record.batch, batch); })
      .map(function(record) { return record.school; })),
    batches: uniqueSorted(records
      .filter(function(record) {
        return !school || normalizeHeader(record.school) === normalizeHeader(school);
      })
      .map(function(record) { return record.batch; }))
  };
}

function uniqueSorted(values) {
  const found = {};
  values.forEach(function(value) {
    if (value) found[value] = true;
  });
  return Object.keys(found).sort();
}

function getApiResult(parameters) {
  const action = parameters.action || "all";
  const school = parameters.maTruong || "";
  const batch = parameters.dotThi || "";
  const skill = parameters.skill || "";
  const part = parameters.part || "";
  const requestedLimit = parseInt(parameters.limit || "1000", 10);
  const limit = Math.max(1, Math.min(isNaN(requestedLimit) ? 1000 : requestedLimit, 1000));

  if (action === "health") {
    return { ok: true, skills: SKILLS };
  }
  if (action === "options") {
    const options = getApiOptions(school, batch);
    return { ok: true, schools: options.schools, batches: options.batches };
  }
  if (action === "data") {
    if (skill) {
      return { ok: true, skill: skill, items: getFilteredRecords(skill, school, batch, part, limit) };
    }
    const result = {};
    SKILLS.forEach(function(item) {
      result[item] = getFilteredRecords(item, school, batch, part, limit);
    });
    return { ok: true, query: { maTruong: school, dotThi: batch, part: part }, data: result };
  }
  if (action === "random") {
    const count = Math.max(1, Math.min(parseInt(parameters.count || "1", 10) || 1, 10));
    const items = getRandomRecords(skill, school, batch, part, count);
    if (!items.length) {
      return { ok: false, error: "No matching exams found.", skill: skill, items: [] };
    }
    return { ok: true, skill: skill, items: items };
  }
  if (action === "all") {
    return {
      ok: true,
      query: { maTruong: school, dotThi: batch },
      speaking: getFilteredRecords("speaking", school, batch, "", limit),
      writing: getFilteredRecords("writing", school, batch, "", limit),
      listening: getFilteredRecords("listening", school, batch, "", limit)
    };
  }
  throw new Error("Unknown action: " + action);
}

function doGet(e) {
  const parameters = e && e.parameter ? e.parameter : {};
  let result;
  try {
    result = getApiResult(parameters);
  } catch (error) {
    result = { ok: false, error: error.message || String(error) };
  }

  const callback = parameters.callback || "";
  if (callback) {
    if (!/^[A-Za-z_$][\w$.]*$/.test(callback)) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Invalid callback." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(callback + "(" + JSON.stringify(result) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
