import fs from 'fs/promises';
import path from 'path';
import {
  type ClassifiedExamRecord,
  type SubtopicDescriptor,
  type TrendDatasetResponse,
  shiftIsoDate,
  sortBatchesChronologically,
  HUB_META,
} from './examTrendsShared';

type RawIndexEntry = {
  school: string;
  batch: string;
  file: string;
  count: number;
};

type RawIndexJson = {
  schools?: string[];
  batches?: string[];
  speaking?: RawIndexEntry[];
  writing?: RawIndexEntry[];
};

type RawExamItem = {
  id?: string;
  'Mã câu hỏi'?: string;
  skill?: string;
  part?: string;
  'Phần thi'?: string;
  school?: string;
  'Mã trường'?: string;
  batch?: string;
  'Đợt thi'?: string;
  group?: string;
  'Bộ đề / Nhóm chủ đề'?: string;
  title?: string;
  'Tiêu đề đề bài'?: string;
  content?: string;
  'Nội dung chi tiết'?: string;
  isNew?: boolean;
  addedAt?: string;
  hint?: {
    essayType?: string;
    letterType?: string;
    purpose?: string;
    [key: string]: unknown;
  };
};

type RawMindmapNode = {
  id: string;
  title: string;
  viTitle?: string;
  children?: RawMindmapNode[];
};

type RawMindmapFile = {
  id: string;
  title: string;
  leftBranches?: RawMindmapNode[];
  rightBranches?: RawMindmapNode[];
};

interface ClassificationRule {
  hubId: string;
  subtopicId: string;
  /** High-precision patterns checked with higher weight on title/purpose */
  strong: RegExp[];
  /** Secondary supporting patterns */
  support?: RegExp[];
  /** Optional negative guard to avoid cross-topic misfires */
  exclude?: RegExp;
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const MINDMAP_DIR = path.join(DATA_DIR, 'mindmap');
const HUB_FILES = ['work', 'education', 'health', 'technology', 'society', 'letters'] as const;
const DATE_REGEX = /(\d{2})\/(\d{2})\/(\d{4})/;

/**
 * High-precision rules mapping Speaking (P1/P2/P3) & Writing Task 2 exams
 * to the 57 mindmap subtopics. No silent fallback is used; unmatched items
 * remain null (separated cleanly as "Chưa gom nhánh").
 */
const THEMATIC_SUBTOPIC_RULES: ClassificationRule[] = [
  // ===================== WORK (10) =====================
  {
    hubId: 'work',
    subtopicId: 'work-job-hopping',
    strong: [
      /\bjob[-\s]?hopp/i,
      /\bjob\s+hugging\b/i,
      /\bchanging\s+jobs?\b/i,
      /\bswitch(?:ing)?\s+(?:jobs?|careers?)\b/i,
      /\blose\s+their\s+jobs?\b/i,
      /\blosing\s+(?:a\s+)?job\b/i,
      /\bjob\s+dismissal\b/i,
      /\bquit(?:ting)?\s+(?:a\s+)?job\b/i,
    ],
  },
  {
    hubId: 'work',
    subtopicId: 'work-self-employment',
    strong: [
      /\bself[-\s]?employ/i,
      /\bentrepreneur/i,
      /\bstart(?:ing)?\s+(?:a\s+|your\s+own\s+)?business\b/i,
      /\bown\s+business\b/i,
      /\bwork(?:ing)?\s+for\s+(?:yourself|themselves)\b/i,
      /\bfreelanc/i,
    ],
  },
  {
    hubId: 'work',
    subtopicId: 'work-remote-public',
    strong: [
      /\bremote\s+work/i,
      /\bwork(?:ing)?\s+from\s+home\b/i,
      /\btelecommut/i,
      /\bwork(?:ing)?\s+in\s+public\s+(?:places?|spaces?)\b/i,
      /\bcoworking\b/i,
      /\bcoffee\s+shop.*work/i,
    ],
  },
  {
    hubId: 'work',
    subtopicId: 'work-gap-year-graduation',
    strong: [
      /\bgap\s+year\b/i,
      /\bafter\s+(?:university\s+)?graduation\b/i,
      /\bpost[-\s]?graduation\b/i,
      /\byear\s+off\s+before\s+university\b/i,
    ],
  },
  {
    hubId: 'work',
    subtopicId: 'work-youth-unemployment',
    strong: [
      /\bunemploy/i,
      /\bjobless/i,
      /\bfind(?:ing)?\s+(?:a\s+)?job\b/i,
      /\bgraduate\s+employment\b/i,
    ],
  },
  {
    hubId: 'work',
    subtopicId: 'work-sales-health-careers',
    strong: [
      /\bsales\s+manager\b/i,
      /\bhealth\s+and\s+wellness\b/i,
      /\bhealthcare\s+career\b/i,
      /\bmedical\s+career\b/i,
    ],
  },
  {
    hubId: 'work',
    subtopicId: 'work-teaching-english-careers',
    strong: [
      /\bteaching\s+(?:job|career|profession)\b/i,
      /\bschool\s+to\s+teach\b/i,
      /\bjob\s+to\s+practice\s+english\b/i,
      /\bbecoming\s+a\s+teacher\b/i,
      /\benglish\s+tutor/i,
    ],
  },
  {
    hubId: 'work',
    subtopicId: 'work-soft-skills-leadership',
    strong: [
      /\bsoft\s+skills?\b/i,
      /\bskills?\s+(?:development\s+)?course\b/i,
      /\bleadership\b/i,
      /\bolder\s+leaders?\b/i,
      /\bteamwork\b/i,
      /\bteam[-\s]?building\b/i,
      /\bjob\s+interview\b/i,
      /\bgood\s+relationships?\s+at\s+(?:the\s+)?workplace\b/i,
      /\bworkplace\s+relationships?\b/i,
      /\bcolleagues?\b/i,
    ],
    exclude: /\bretirement\s+gift|farewell\s+gift\b/i,
  },
  {
    hubId: 'work',
    subtopicId: 'work-balance-stress',
    strong: [
      /\bwork[-\s]?life\s+balance\b/i,
      /\bworkplace\s+stress\b/i,
      /\bjob\s+stress\b/i,
      /\bworking\s+conditions?\b/i,
      /\boverwork\b/i,
      /\bburnout\b/i,
      /\bwork\s+pressure\b/i,
    ],
  },
  {
    hubId: 'work',
    subtopicId: 'work-job-choice-location',
    strong: [
      /\bjob\s+choice\b/i,
      /\bchoosing\s+a\s+(?:new\s+)?job\b/i,
      /\bjob\s+offers?\b/i,
      /\bcareer\s+(?:location|development|choice|plan|path)\b/i,
      /\bchoosing\s+a\s+(?:type\s+of\s+)?company\b|\bcompany\s+to\s+work\s+for\b/i,
      /\bfactors?\s+(?:influencing|when)\s+choosing\s+a\s+job\b/i,
      /\bwork\s*&\s*career\b/i,
      /\bsaving\s+money\b|\bmoney\s*&\s*saving\b|\bpersonal\s+finance\b/i,
      /\bpart[-\s]?time\s+job\b/i,
      /\bideal\s+job\b|\bdream\s+job\b/i,
    ],
  },

  // ===================== TECHNOLOGY (9) =====================
  {
    hubId: 'technology',
    subtopicId: 'tech-artificial-intelligence',
    strong: [
      /\bartificial\s+intelligence\b/i,
      /\bAI\b/,
      /\bchatgpt\b|\bautomation\b|\brobots?\b/i,
    ],
    exclude: /\beducation|school|student|classroom|learning|teach/i,
  },
  {
    hubId: 'technology',
    subtopicId: 'tech-ewaste',
    strong: [/\be[-\s]?waste\b/i, /\belectronic\s+waste\b/i, /\bdiscarded\s+electronics\b/i],
  },
  {
    hubId: 'technology',
    subtopicId: 'tech-cybercrime',
    strong: [
      /\bcybercrime\b/i,
      /\bmalicious\s+websites?\b/i,
      /\bonline\s+(?:scam|fraud|safety|security|privacy)\b/i,
      /\bcyber[-\s]?security\b|\bhack(?:ing|ers?)\b|\bfake\s+news\b/i,
    ],
  },
  {
    hubId: 'technology',
    subtopicId: 'tech-cashless-bank',
    strong: [
      /\bcashless\b/i,
      /\btransferred\s+money\b/i,
      /\bbank(?:ing)?\s+app\b|\bonline\s+banking\b|\bdigital\s+payment\b|\be[-\s]?wallet\b/i,
    ],
  },
  {
    hubId: 'technology',
    subtopicId: 'tech-online-shopping',
    strong: [
      /\bonline\s+shopping\b/i,
      /\bshopping\s+online\b/i,
      /\be[-\s]?commerce\b/i,
      /\bshop(?:ping)?\s+on\s+the\s+internet\b/i,
    ],
  },
  {
    hubId: 'technology',
    subtopicId: 'tech-communication-body-language',
    strong: [
      /\bface[-\s]?to[-\s]?face\b/i,
      /\bbody\s+language\b/i,
      /\bnon[-\s]?verbal\b/i,
      /\bdirect\s+communication\b/i,
    ],
  },
  {
    hubId: 'technology',
    subtopicId: 'tech-smartphones-work-class',
    strong: [
      /\bmobile\s+phones?\s+(?:at|in|for)\s+(?:work|school|class)/i,
      /\bworkplace\s+mobile\s+phone/i,
      /\bbanning\s+mobile\s+phones?\b/i,
      /\ballowing\s+mobile\s+phones?\b/i,
      /\bphones?\s+in\s+(?:the\s+)?classroom/i,
      /\bmobile\s+phones?\b/i,
      /\bsmartwatch|\bwearable\s+tech|\bsmartphones?\b/i,
    ],
    exclude: /\bchildren\s+(?:spending|using)\b/i,
  },
  {
    hubId: 'technology',
    subtopicId: 'tech-social-media-friends',
    strong: [
      /\bsocial\s+media\b/i,
      /\bsocial\s+network(?:ing)?\b/i,
      /\bonline\s+social\s+circles?\b/i,
      /\bsharing\s+our\s+lives\s+online\b|\bsharing\s+.*online\b/i,
      /\bpost(?:ing)?\s+videos?\b/i,
      /\bcontent\s+creat(?:ion|ors?)\b/i,
      /\binfluencers?\b|\bvlog/i,
    ],
  },
  {
    hubId: 'technology',
    subtopicId: 'tech-internet-addiction',
    strong: [
      /\binternet\s+(?:overuse|addiction|use|usage)\b/i,
      /\bcompulsive\s+internet\b/i,
      /\bscreen\s+time\b/i,
      /\bexcessive\s+time\s+on\s+electronic\s+devices\b/i,
      /\bchildren\s+using\s+(?:smartphones?|mobile\s+phones?|electronic\s+devices?)/i,
      /\baddicted\s+to\s+(?:phones?|internet|games?|video\s+games?)\b/i,
      /\bcomputer\s+games?\b|\bvideo\s+games?\b|\bgaming\b/i,
      /\bmodern\s+technology\b|\binventions?\b|\btelevision\b|\bwatching\s+tv\b/i,
    ],
  },

  // ===================== EDUCATION (11) =====================
  {
    hubId: 'education',
    subtopicId: 'edu-online-ai-phones',
    strong: [
      /\bonline\s+learning\b/i,
      /\be[-\s]?learning\b|\bdistance\s+learning\b|\bvirtual\s+class/i,
      /\bartificial\s+intelligence.*(?:education|students?|learning|school|classroom)/i,
      /\b(?:education|students?|learning|school|classroom).*\bAI\b/i,
      /\bcomputer\s+technology\s+in\s+(?:education|learning|classroom)\b/i,
      /\bself[-\s]?study\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-reading-ebooks-libraries',
    strong: [
      /\breading\s+(?:books?|habits?|e[-\s]?books?|blogs?|articles?)\b/i,
      /\be[-\s]?books?\b|\bpaper\s+books?\b|\bprinted\s+books?\b/i,
      /\blibrar(?:y|ies)\b/i,
      /\bbooks?\s*&\s*reading\b|\breading\s+to\s+children\b/i,
      /\bnewspaper|\bmagazines?\b|\breading\s+online\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-foreign-languages',
    strong: [
      /\bforeign\s+language/i,
      /\blearn(?:ing)?\s+(?:a\s+)?(?:new\s+|second\s+)?language/i,
      /\blearn(?:ing)?\s+english\b/i,
      /\benglish\s+(?:learning|study|speaking|language)\b/i,
      /\bmultilingual|\bbilingual\b/i,
      /\blanguage\s+learning\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-study-abroad-governance',
    strong: [
      /\bstudy(?:ing)?\s+abroad\b/i,
      /\boverseas\s+study\b|\binternational\s+students?\b/i,
      /\bstudent\s+voice\b|\buniversity\s+academic\s+policies\b|\bgovernance\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-schools-teachers-preschool',
    strong: [
      /\bqualities\s+of\s+(?:an?\s+)?(?:effective|good|outstanding)\s+teacher\b/i,
      /\bpreschool\b|\bkindergarten\b|\bprimary\s+school\b|\bhigh\s+school\b/i,
      /\bparental\s+pressure.*teachers?\b/i,
      /\bhomeschool/i,
      /\bprivate\s+school|\bpublic\s+school|\bschool\s+uniform/i,
      /\bteachers?\s+(?:role|importance|qualities)\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-science-stem-interest',
    strong: [
      /\binterest\s+in\s+science\b/i,
      /\bscience\s+learning\b|\bSTEM\b|\bscientific\b|\bschool\s+subjects?\b|\bfavorite\s+subject/i,
      /\bmathematics\b|\bhistory\s+subject\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-museums-culture-arts',
    strong: [
      /\bmuseums?\b/i,
      /\bcultural\s+heritage\b|\bnational\s+(?:culture|history)\b/i,
      /\bhistoric\s+pagoda\b|\bhistorical\s+(?:sites?|places?)\b/i,
      /\bpreserving\s+(?:traditional\s+)?culture\b|\bpromote\s+and\s+preserve\s+national\s+culture\b/i,
      /\barts?\s+and\s+crafts?\b|\bdrawing\b|\bphotography\b|\bpainting\b|\bcinema\b|\bfilms?\b|\bmovies?\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-stress-behavior-discipline',
    strong: [
      /\bacademic\s+pressure\b|\bexam\s+(?:stress|pressure)\b/i,
      /\bpeer\s+pressure\b|\bpressure\s+on\s+teenagers?\b/i,
      /\bcheating\s+in\s+an?\s+exam\b/i,
      /\bstudent\s+misbehavior\b|\bdiscipline\s+(?:children|students?)\b|\bschool\s+bullying\b/i,
      /\bhomework\b|\bstandardized\s+tests?\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-campus-housing-sports',
    strong: [
      /\bchoosing\s+a\s+university\b|\badvising.*university\b/i,
      /\bdormitor|\bcampus\b|\bfirst[-\s]?year\s+university\s+student\b|\bfreshmen\b/i,
      /\bstudent\s+accommodation\b|\buniversity\s+life\b/i,
    ],
    exclude: /\bwelcome\s+event\b/i,
  },
  {
    hubId: 'education',
    subtopicId: 'edu-extracurricular-music-skills',
    strong: [
      /\bmusical\s+instruments?\b|\bmusic\s+education\b|\blistening\s+to\s+music\b|\bmusic\b/i,
      /\bextracurricular\b/i,
      /\bcourse\s+for\s+self[-\s]?development\b|\bself[-\s]?development\b/i,
      /\bcreative\s+activities\b|\bsummer\s+camp\b/i,
    ],
  },
  {
    hubId: 'education',
    subtopicId: 'edu-higher-ed-success',
    strong: [
      /\beducation\s+(?:is\s+the\s+key|as\s+the\s+key)\b/i,
      /\bhigher\s+education\b|\buniversity\s+degree\b|\bcollege\s+education\b/i,
      /\bfailures?\b|\bhard\s+work.*success\b|\bpersonal\s+habits?.*success\b|\blifelong\s+learning\b/i,
      /\bschool\s+days?\b|\beducation\s+system\b/i,
    ],
  },

  // ===================== HEALTH (6) =====================
  {
    hubId: 'health',
    subtopicId: 'health-fast-food',
    strong: [
      /\bfast\s+food\b/i,
      /\bjunk\s+food\b/i,
      /\bprocessed\s+food\b|\bsugary\s+drinks?\b|\bmilk\s+tea\b|\bgreen\s+tea\b|\bbeverages?\b|\bdrinking\s+habits?\b/i,
    ],
  },
  {
    hubId: 'health',
    subtopicId: 'health-obesity-weight',
    strong: [
      /\bobesity\b|\bobese\b/i,
      /\boverweight\b|\blose\s+weight\b|\bweight\s+loss\b|\bweight\s+management\b/i,
    ],
  },
  {
    hubId: 'health',
    subtopicId: 'health-public-smoking',
    strong: [/\bsmoking\b|\bcigarettes?\b|\btobacco\b|\bvaping\b/i],
  },
  {
    hubId: 'health',
    subtopicId: 'health-exercise-sports',
    strong: [
      /\bteam\s+sports?\b|\bplaying\s+sports?\b|\bsports?\s+participation\b/i,
      /\bdoing\s+exercise\b|\bimproper\s+exercise\b|\bphysical\s+(?:exercise|activity|fitness)\b/i,
      /\bcycling\b|\bjogging\b|\bwalking\b|\bswimming\b|\bgym\b|\bworkout\b|\bdancing\s*&\s*body\b/i,
      /\bsports?\b/i,
    ],
    exclude: /\bcampus\s+sports\s+infrastructure\b/i,
  },
  {
    hubId: 'health',
    subtopicId: 'health-staying-calm',
    strong: [
      /\bstay(?:ing)?\s+calm\b/i,
      /\bmental\s+health\b|\bmanage\s+stress\b|\brelax(?:ation|ing)\b|\btaking\s+breaks?\b|\bbeing\s+alone\b|\bhappiness\b|\bsleep(?:ing)?\s+habits?\b/i,
    ],
  },
  {
    hubId: 'health',
    subtopicId: 'health-healthy-lifestyle',
    strong: [
      /\bhealthy\s+(?:lifestyle|food|habits?)\b|\bstay(?:ing)?\s+healthy\b|\beating\s+habits?\b|\bbad\s+habits?\b/i,
      /\bvegetarian\b|\bbalanced\s+diet\b|\bbreakfast\b|\bdiet\b|\bnutrition\b/i,
      /\bmedical\s+check[-\s]?ups?\b|\bsickness\b|\bwhen\s+(?:you\s+are\s+)?sick\b|\bhealth\s+care\b/i,
    ],
  },

  // ===================== SOCIETY (21) =====================
  {
    hubId: 'society',
    subtopicId: 'soc-electric-vehicles',
    strong: [
      /\belectric\s+vehicles?\b|\bEVs?\b|\belectric\s+cars?\b/i,
      /\bgreen\s+energy\b|\brenewable\s+energy\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-traffic-motorbikes-safety',
    strong: [
      /\btraffic\s+(?:congestion|jam|accidents?|safety|lights?)\b/i,
      /\broad\s+safety\b|\bmotorbikes?\b|\bpublic\s+transport\b|\bcommut(?:ing|e)\b|\bdriving\b|\bcar\s+ownership\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-air-plastic-fashion',
    strong: [
      /\bair\s+pollution\b|\bplastic\s+(?:waste|pollution|bags?)\b|\bfast\s+fashion\b/i,
      /\brecycl(?:ing|e)\b|\bprotect(?:ing)?\s+the\s+environment\b|\benvironmental\s+protection\b|\bclimate\s+change\b|\bglobal\s+warming\b|\bcarbon\s+emissions?\b|\bgreen\s+living\b/i,
      /\bparks?\s*&\s*public\s+green\s+spaces?\b|\bplants?\b|\btrees?\b|\bgreenery\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-water-biodiversity',
    strong: [
      /\bfresh\s*water\b|\bwater\s+(?:shortage|conservation|pollution|scarcity)\b/i,
      /\bbiodiversity\b|\bwildlife\b|\bendangered\s+species\b|\bforests?\b|\bdeforestation\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-urbanization-living',
    strong: [
      /\burbanization\b|\burban\s+life\b|\bcity\s+(?:life|living)\b|\bbig\s+cities\b/i,
      /\bcountryside\b|\brural\s+living\b|\bhometown\b/i,
      /\bapartment\s+living\b|\bliving\s+in\s+an?\s+apartment\b|\bhouse\s+vs\s+apartment\b|\bneighborhood\b|\bneighbours?\b|\bneighbors?\b|\baccommodation\b/i,
    ],
    exclude: /\bmountain\s+climbing|student\s+accommodation|university\b/i,
  },
  {
    hubId: 'society',
    subtopicId: 'soc-tourism-cities',
    strong: [
      /\btourism\b|\btourist\s+cities\b|\beco[-\s]?tourism\b|\bspiritual\s+tourism\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-trip-planning',
    strong: [
      /\bmountain\s+climbing\s+trip\b|\bplanning\s+a\s+(?:summer\s+)?holiday\s+trip\b/i,
      /\btravel\s+(?:tour|information|itinerary)\b|\bhosting\s+a\s+foreign\s+friend\b|\bvisiting\s+friend\b/i,
      /\btrip\s+to\s+singapore\b|\baccommodation\s+for\s+a\s+.*trip\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-travel-holidays-tet',
    strong: [
      /\btravell?ing\b|\btravel\s+preferences?\b|\bexploring\s+new\s+places\b/i,
      /\btet\s+holiday\b|\bfestivals?\b|\bpublic\s+holidays?\b|\bvacations?\b|\bairplane\s+travel\b|\bflying\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-family-marriage-life',
    strong: [
      /\bnuclear\s+famil|\bextended\s+famil|\bmarriage\b|\bmarrying\b|\bstaying\s+single\b|\bsingle\s+life\b/i,
      /\bgetting\s+married\b|\bdelaying\s+marriage\b|\bdivorce\b|\bdomestic\s+relationships?\b|\bfamily\s+(?:life|bonding|members?|&)\b/i,
      /\bparents?\s+and\s+teenagers?\b|\bconflicts?\s+between\s+parents?\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-chores-helper-independence',
    strong: [
      /\bhousehold\s+chores?\b|\bhousework\b|\bdomestic\s+helper\b|\bhiring\s+a\s+(?:maid|helper)\b/i,
      /\bgeneration\s+gap\b|\bliving\s+independently\b|\bbecome\s+independent\b|\braising\s+children\b|\bparenting\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-friendship-consumer-fame',
    strong: [
      /\bfriendships?\b|\bclose\s+friends?\b|\bmaking\s+friends?\b|\bfit\s+in\s+with\s+friends\b/i,
      /\bcelebrity\b|\bfamous\s+people\b|\bfame\b/i,
      /\bshopping\b|\bclothes?\s*&\s*shopping\b|\bfashion\b|\bconsumer\b|\badvertising\b/i,
    ],
    exclude: /\bonline\s+shopping|shopping\s+online|fast\s+fashion|birthday\s+gift|sick\s+friend|visiting\s+friend\b/i,
  },
  {
    hubId: 'society',
    subtopicId: 'soc-pets-responsibility',
    strong: [/\bpets?\b|\bkeeping\s+(?:household\s+)?pets?\b|\bpet\s+ownership\b|\bdogs?\s+and\s+cats?\b|\banimals?\b/i],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-volunteering-community',
    strong: [/\bvolunteer(?:ing)?\b|\bcharity\b|\bcommunity\s+service\b|\bhelping\s+(?:the\s+community|others)\b|\bdo(?:ing)?\s+volunteer\b/i],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-local-food',
    strong: [
      /\blocal\s+food\b|\bimported\s+food\b|\bagriculture\b|\bfarmers?\b|\btraditional\s+food\b|\bcuisine\b|\bstreet\s+food\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-crime-public-safety',
    strong: [
      /\bcrime\b|\bcriminals?\b|\bpolice\b|\bprison\b|\bpenalizing\s+public\s+misbehavior\b|\bpublic\s+safety\b|\bneighborhood\s+safe\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-gifts-colleagues',
    strong: [
      /\bretirement\s+gift\b|\bfarewell\s+gift\b|\bgift\s+for\s+a\s+(?:senior\s+)?(?:colleague|boss|teacher)\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-gifts-family-friends',
    strong: [
      /\bbirthday\s+gift\b|\bcultural\s+gift\b|\bgift\s+for\s+(?:a\s+)?(?:sick\s+friend|mother|father|friend|child|wedding|exchange\s+student)\b|\bchoosing\s+a\s+gift\b|\bgift[-\s]?giving\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-kids-and-creative',
    strong: [
      /\bniece\b|\bnephew\b|\bbabysitting\b|\beducational\s+day\s+out\s+for\s+a\s+young\b|\byoung\s+pupils?\b|\bcreative\s+class/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-parties-events',
    strong: [
      /\bbirthday\s+party\b|\byear[-\s]?end\s+party\b|\bfreshmen\s+welcome\s+event\b|\borganizing\s+(?:a\s+)?(?:party|event|wedding)\b|\bcelebrating\s+a\s+.*party\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-dining-and-hosting',
    strong: [
      /\bdining\s+out\b|\beating\s+out\b|\bplace\s+to\s+dine\b|\boffering\s+a\s+meal\b|\bcooking\b|\brestaurant\b|\bclass\s+reunion\b/i,
    ],
  },
  {
    hubId: 'society',
    subtopicId: 'soc-free-time-weekends',
    strong: [
      /\bweekend\s+(?:activities|outing|plans?)\b|\bspending\s+a\s+free\s+weekend\b|\boutdoor\s+activities\b|\bfree\s+time\b|\bhobbies?\b|\bleisure\b|\bweather\b|\brainy\s+days?\b|\bseasons?\b/i,
    ],
  },
];

/**
 * High-precision rules mapping Writing Task 1 exams to the 6 letter types in letters.json.
 */
const LETTER_SUBTOPIC_RULES: ClassificationRule[] = [
  {
    hubId: 'letters',
    subtopicId: 'letter-apology',
    strong: [
      /\bapolog(?:y|ize|ising|izing)\b/i,
      /\blate\s+(?:assignment|submission|arrival)\b/i,
      /\bsorry\b|\bmissed\s+(?:the\s+)?(?:meeting|class|party)\b|\bunable\s+to\s+attend\b|\bexcuse\b|\bregret\b/i,
    ],
  },
  {
    hubId: 'letters',
    subtopicId: 'letter-complaint',
    strong: [
      /\bcomplain(?:t|ing)?\b/i,
      /\bdissatisf/i,
      /\bpoor\s+service\b|\bbroken\b|\bdamaged\b|\brefund\b|\bhotel\s+feedback\b|\bnoise\s+problem\b|\bdefective\b/i,
      /\bprovide\s+problem\b/i,
    ],
  },
  {
    hubId: 'letters',
    subtopicId: 'letter-thank-you',
    strong: [
      /\bthank(?:ing|\s+you|\s*-?\s*you)?\b/i,
      /\bgratitude\b|\bappreciat(?:ion|e)\b|\bhomestay\b/i,
    ],
  },
  {
    hubId: 'letters',
    subtopicId: 'letter-request',
    strong: [
      /\brequest(?:ing)?\b|\binquir(?:y|ing)\b|\bapplication\b|\bapply(?:ing)?\b/i,
      /\bjob\s+(?:inquiry|application)\b|\bdegree\s+admission\b|\benroll|\bregister\b|\bbooking\b|\basking\s+for\s+information\b|\bformal\s+inquiry\b/i,
    ],
  },
  {
    hubId: 'letters',
    subtopicId: 'letter-advice-invitation',
    strong: [
      /\badvis(?:e|ing)\b|\badvice\b|\brecommend(?:ing|ation)?\b|\bsuggest(?:ion|ing)?\b/i,
      /\binvit(?:e|ing|ation)\b|\bitinerary\b|\btravel\s+plan\b|\bconcert\s+invitation\b|\bcharity\s+gala\b|\bweight\s+loss\b|\bguiding\s+a\s+friend\b|\bplanning\s+for\s+a\s+foreign\s+friend/i,
    ],
  },
  {
    hubId: 'letters',
    subtopicId: 'letter-information',
    strong: [
      /\bprovide\s+info(?:rmation)?\b|\bgive\s+info(?:rmation)?\b|\binform(?:ing|ation)?\b/i,
      /\bintroduc(?:e|ing)\b|\bdescribing\b|\bshare\s+personal\b|\bsharing\s+experience\b|\bconfirm(?:ing)?\s+(?:availability|sunday)\b|\bhanding\s+over\s+work\b|\breplying\s+to\b|\bformal\s+reply\b|\bcongratulat/i,
      /\bupdate\b|\bdirections?\b|\bnew\s+house\b|\bnew\s+hobby\b/i,
    ],
  },
];

function extractIsoDate(group?: string): string | null {
  if (!group) return null;
  const m = group.match(DATE_REGEX);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function normalizePart(rawPart?: string, rawVnPart?: string): string {
  const src = (rawPart || rawVnPart || '').toLowerCase().replace(/\s+/g, '');
  if (src.includes('part1') || src.includes('task1')) return 'part1';
  if (src.includes('part2') || src.includes('task2')) return 'part2';
  if (src.includes('part3')) return 'part3';
  return src || 'part1';
}

function cleanTitle(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/^Topic\s+\d+:\s*/i, '')
    .replace(/^Part\s+\d+\s*-\s*(?:Topic|Situation)\s+\d+:\s*/i, '')
    .replace(/^Task\s+\d+(?:\.\d+)?:\s*/i, '')
    .replace(/^Writing\s+Task\s+\d+(?:\.\d+)?:\s*/i, '')
    .trim();
}

function scoreRule(
  rule: ClassificationRule,
  title: string,
  meta: string,
  content: string
): number {
  const combinedHeader = `${title} ${meta}`;
  if (rule.exclude && rule.exclude.test(combinedHeader)) {
    return 0;
  }

  let score = 0;
  for (const re of rule.strong) {
    if (re.test(title)) score += 4;
    else if (meta && re.test(meta)) score += 2.5;
    else if (re.test(content)) score += 1;
  }

  if (rule.support) {
    for (const re of rule.support) {
      if (re.test(title)) score += 2;
      else if (re.test(content)) score += 0.5;
    }
  }

  return score;
}

function classifyExam(
  item: RawExamItem,
  skill: 'speaking' | 'writing',
  part: string
): { hubId: string | null; subtopicId: string | null } {
  const title = item.title || item['Tiêu đề đề bài'] || '';
  const group = item.group || item['Bộ đề / Nhóm chủ đề'] || '';
  const purpose = typeof item.hint?.purpose === 'string' ? item.hint.purpose : '';
  const content = (item.content || item['Nội dung chi tiết'] || '').slice(0, 700);

  const isLetter = skill === 'writing' && part === 'part1';
  const rules = isLetter ? LETTER_SUBTOPIC_RULES : THEMATIC_SUBTOPIC_RULES;
  const metaText = isLetter ? purpose : group;

  let bestRule: ClassificationRule | null = null;
  let bestScore = 0;

  for (const rule of rules) {
    const score = scoreRule(rule, title, metaText, content);
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  // Require at least a clear match (>= 1.0) so random incidental words do not misfire
  if (!bestRule || bestScore < 1) {
    return { hubId: null, subtopicId: null };
  }

  return { hubId: bestRule.hubId, subtopicId: bestRule.subtopicId };
}

function extractSubtopicNames(rawTitle: string, fallbackVi?: string) {
  const enMatch = rawTitle.match(/\(([^)]+)\)/);
  const enTitle = enMatch ? enMatch[1].trim() : rawTitle;
  const viTitle = rawTitle.includes('(')
    ? rawTitle.split('(')[0].trim()
    : fallbackVi || rawTitle;
  return { viTitle, enTitle };
}

let cachedDataset: TrendDatasetResponse | null = null;

export async function getExamTrendsDataset(): Promise<TrendDatasetResponse> {
  if (process.env.NODE_ENV === 'production' && cachedDataset) {
    return cachedDataset;
  }

  // 1. Load subtopic catalog from src/data/mindmap/*.json
  const subtopics: SubtopicDescriptor[] = [];
  await Promise.all(
    HUB_FILES.map(async (hubId) => {
      const filePath = path.join(MINDMAP_DIR, `${hubId}.json`);
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw) as RawMindmapFile;
      const branches = [
        ...(Array.isArray(parsed.leftBranches) ? parsed.leftBranches : []),
        ...(Array.isArray(parsed.rightBranches) ? parsed.rightBranches : []),
      ];
      const hubTitle = HUB_META[hubId]?.title || parsed.title || hubId;
      for (const branch of branches) {
        for (const child of branch.children || []) {
          const { viTitle, enTitle } = extractSubtopicNames(child.title, child.viTitle);
          subtopics.push({
            id: child.id,
            hubId,
            hubTitle,
            title: child.title,
            viTitle,
            enTitle,
          });
        }
      }
    })
  );

  // Preserve consistent hub order
  const hubOrder = new Map<string, number>(HUB_FILES.map((h, i) => [h, i]));
  subtopics.sort(
    (a, b) => (hubOrder.get(a.hubId) ?? 99) - (hubOrder.get(b.hubId) ?? 99)
  );

  // 2. Load index.json and all speaking/writing exam files
  const indexRaw = await fs.readFile(path.join(DATA_DIR, 'index.json'), 'utf8');
  const indexJson = JSON.parse(indexRaw) as RawIndexJson;

  const records: ClassifiedExamRecord[] = [];
  const loadSkill = async (skill: 'speaking' | 'writing', entries: RawIndexEntry[]) => {
    const fileContents = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(DATA_DIR, entry.file);
        const raw = await fs.readFile(fullPath, 'utf8');
        const list = JSON.parse(raw) as RawExamItem[];
        return { entry, list: Array.isArray(list) ? list : [] };
      })
    );

    for (const { entry, list } of fileContents) {
      for (const item of list) {
        const id = String(item.id || item['Mã câu hỏi'] || '').trim();
        if (!id) continue;
        const part = normalizePart(item.part, item['Phần thi']);
        const school = String(item.school || item['Mã trường'] || entry.school || '').trim();
        const batch = String(item.batch || item['Đợt thi'] || entry.batch || '').trim();
        const group = String(item.group || item['Bộ đề / Nhóm chủ đề'] || '').trim();
        const rawTitle = String(item.title || item['Tiêu đề đề bài'] || '').trim();
        const date = extractIsoDate(group);

        const { hubId, subtopicId } = classifyExam(item, skill, part);

        records.push({
          id,
          title: cleanTitle(rawTitle) || rawTitle,
          school,
          batch,
          date,
          skill,
          part,
          hubId,
          subtopicId,
          essayType:
            typeof item.hint?.essayType === 'string' ? item.hint.essayType : null,
          letterType:
            typeof item.hint?.letterType === 'string' ? item.hint.letterType : null,
          isNew: Boolean(item.isNew),
          addedAt: typeof item.addedAt === 'string' ? item.addedAt : null,
        });
      }
    }
  };

  await Promise.all([
    loadSkill('speaking', indexJson.speaking || []),
    loadSkill('writing', indexJson.writing || []),
  ]);

  let latestExamDate: string | null = null;
  for (const r of records) {
    if (r.date && (!latestExamDate || r.date > latestExamDate)) {
      latestExamDate = r.date;
    }
  }

  const dataset: TrendDatasetResponse = {
    ok: true,
    generatedAt: new Date().toISOString(),
    batches: sortBatchesChronologically(indexJson.batches || []),
    schools: indexJson.schools || [],
    latestExamDate,
    recentWindowStart: latestExamDate ? shiftIsoDate(latestExamDate, -13) : null,
    subtopics,
    records,
  };

  if (process.env.NODE_ENV === 'production') {
    cachedDataset = dataset;
  }

  return dataset;
}
