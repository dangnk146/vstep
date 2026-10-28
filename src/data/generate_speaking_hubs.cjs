const fs = require('fs');
const path = require('path');

// 1. Path configurations
const DATA_DIR = __dirname;
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const OUTPUT_JSON = path.join(DATA_DIR, 'speaking_hubs.json');

// 2. 5 Topic Hubs Configuration with Cross-Part Links, Vocab & Skeletons
const HUBS_CONFIG = {
  education: {
    id: 'education',
    title: 'Education, Learning & Skills',
    vietnameseTitle: 'Giáo dục, Học tập & Kỹ năng',
    icon: 'GraduationCap',
    coreTheme: 'Phương pháp giáo dục, kỹ năng học tập, môi trường học đường, áp lực học tập và ngoại ngữ.',
    crossPartDynamics: {
      part1: 'Hỏi về thói quen cá nhân: Học tiếng Anh, môn học yêu thích, thói quen đọc sách, trường lớp cũ/mới, tự học trực tuyến.',
      part2: 'Tình huống ra quyết định: Chọn trường học cho con/bản thân, chọn khóa học kỹ năng mềm (soft skills), chọn nghề dạy học (teaching career), chọn cách luyện nói tiếng Anh hiệu quả nhất.',
      part3: 'Thảo luận sâu về xã hội: Ứng dụng AI trong giảng dạy, cấm điện thoại trong lớp học, cách xử lý học sinh quậy phá/vô kỷ luật, áp lực đồng trang lứa (peer pressure), vai trò của thư viện truyền thống, lợi ích du học (studying abroad).'
    },
    coreKeywords: [
      'Academic curriculum', 'Pedagogical methodology', 'Critical thinking skills',
      'Lifelong learning', 'Extracurricular activities', 'Peer pressure',
      'Well-rounded individual', 'Broaden one\'s horizons', 'Autonomous learner', 'Interactive learning environment'
    ],
    universalReasons: [
      'Sharpen cognitive agility & analytical mindset (Mài giũa tư duy phân tích và khả năng tự học)',
      'Expand academic qualifications & career opportunities (Nâng cao bằng cấp và cơ hội nghề nghiệp tương lai)',
      'Foster interpersonal communication & teamwork abilities (Rèn luyện giao tiếp xã hội và khả năng làm việc nhóm)'
    ]
  },
  health: {
    id: 'health',
    title: 'Health, Fitness & Lifestyle',
    vietnameseTitle: 'Sức khỏe, Ăn uống & Lối sống',
    icon: 'HeartPulse',
    coreTheme: 'Chế độ dinh dưỡng, thể dục thể thao, thói quen ăn uống, sức khỏe tâm thần và cân bằng cuộc sống.',
    crossPartDynamics: {
      part1: 'Trải nghiệm ăn uống & sinh hoạt: Thích trà xanh/trà sữa, ăn chay, ăn ngoài vs tự nấu, thói quen nghỉ ngơi giải lao (taking breaks), kiểm tra sức khỏe, đạp xe, khi bị ốm.',
      part2: 'Lựa chọn phương án sinh hoạt: Chọn nhà hàng ăn tối cùng bạn bè/gia đình, chọn nghề nghiệp chăm sóc sức khỏe (Health and Wellness), chọn hoạt động thể chất dã ngoại cuối tuần.',
      part3: 'Vấn đề sức khỏe cộng đồng: Giải pháp cho vấn đề béo phì / béo phì ở trẻ em, lợi ích khi chơi thể thao đồng đội, rủi ro chấn thương do tập luyện sai cách, tầm quan trọng của giữ bình tĩnh và cân bằng công việc - cuộc sống (work-life balance).'
    },
    coreKeywords: [
      'Balanced & nutritious diet', 'Sedentary lifestyle', 'Physical fitness & stamina',
      'Mental well-being', 'Cardiovascular endurance', 'Childhood obesity epidemic',
      'Work-life balance', 'Endorphin release', 'Nutritional intake', 'Recharge one\'s batteries'
    ],
    universalReasons: [
      'Fortify immune resilience & ward off chronic ailments (Củng cố hệ miễn dịch, phòng ngừa bệnh tật)',
      'Alleviate mental distress & induce positive mood (Xua tan mệt mỏi, sản sinh năng lượng tích cực)',
      'Establish discipline & sustain prolonged vitality (Xây dựng lối sống kỷ luật và duy trì sự dẻo dai)'
    ]
  },
  technology: {
    id: 'technology',
    title: 'Technology, Digital Media & AI',
    vietnameseTitle: 'Công nghệ, Thiết bị số & Mạng xã hội',
    icon: 'Cpu',
    coreTheme: 'Thiết bị công nghệ cá nhân, mạng xã hội, internet, AI và chuyển đổi thói quen giao tiếp.',
    crossPartDynamics: {
      part1: 'Thói quen dùng thiết bị: Điện thoại thông minh, đồng hồ thông minh (wearable tech), mạng xã hội, mua sắm qua mạng, sở thích chụp ảnh & quay video.',
      part2: 'Xử lý tình huống kỹ thuật số: Xử lý khi chuyển nhầm tiền qua tài khoản ngân hàng trực tuyến (banking app), chọn thiết bị công nghệ làm quà tặng khoa học.',
      part3: 'Tác động sâu rộng của công nghệ: Vai trò của Trí tuệ nhân tạo (AI), trào lưu làm video & sáng tạo nội dung online, e-book thay thế sách giấy, giao tiếp trực tiếp (face-to-face) vs giao tiếp qua mạng xã hội.'
    },
    coreKeywords: [
      'Cutting-edge technology', 'Artificial intelligence (AI)', 'Digital distraction',
      'Virtual interaction', 'Algorithm optimization', 'Cyber hygiene & privacy',
      'Instantaneous connectivity', 'Screen addiction', 'Technological literacy', 'Automation'
    ],
    universalReasons: [
      'Optimize productivity & eliminate repetitive administrative tasks (Tối ưu hóa hiệu suất, tự động hóa tác vụ)',
      'Provide limitless access to global repositories of information (Kết nối thông tin và tri thức toàn cầu không giới hạn)',
      'Mitigate risks of sedentary isolation & superficial virtual relationships (Cảnh báo nguy cơ phụ thuộc công nghệ và mất kết nối thực tế)'
    ]
  },
  work: {
    id: 'work',
    title: 'Work, Career & Personal Finance',
    vietnameseTitle: 'Công việc, Sự nghiệp & Tài chính',
    icon: 'Briefcase',
    coreTheme: 'Môi trường làm việc, văn hóa doanh nghiệp, khởi nghiệp, kỹ năng công sở và tài chính cá nhân.',
    crossPartDynamics: {
      part1: 'Thói quen làm việc & tiền bạc: Tiết kiệm tiền, điều kiện làm việc nơi công sở, kế hoạch nghề nghiệp tương lai, tinh thần làm việc nhóm (teamwork).',
      part2: 'Lựa chọn công việc & môi trường: Chọn 1 trong 3 lời mời làm việc (3 job offers), chọn quà chia tay/nghỉ hưu cho sếp/đồng nghiệp, chọn hoạt động team-building gắn kết nhân sự.',
      part3: 'Thị trường lao động & sự nghiệp: Khởi nghiệp và tự làm chủ (Self-employment), yếu tố quyết định lựa chọn nghề nghiệp (lương bổng vs đam mê), giải pháp thất nghiệp ở người trẻ, học hỏi từ thất bại để thành công.'
    },
    coreKeywords: [
      'Career advancement trajectory', 'Job satisfaction & remuneration', 'Entrepreneurial acumen',
      'Financial independence', 'Corporate culture', 'Professional networking',
      'Adaptability to market shifts', 'Youth unemployment', 'Workplace diplomacy', 'Resilience through failure'
    ],
    universalReasons: [
      'Secure long-term financial autonomy & livelihood stability (Đảm bảo tự chủ tài chính và sinh kế bền vững)',
      'Cultivate leadership competencies & industry reputation (Phát triển năng lực lãnh đạo và nâng cao vị thế nghề nghiệp)',
      'Harness personal strengths to contribute meaningfully to organization (Phát huy sở trường và cống hiến cho tổ chức)'
    ]
  },
  society: {
    id: 'society',
    title: 'Environment, Society & Community',
    vietnameseTitle: 'Môi trường, Đô thị & Đời sống Xã hội',
    icon: 'Trees',
    coreTheme: 'Bảo vệ môi trường tự nhiên, giao thông đô thị, gia đình, vật nuôi, văn hóa truyền thống và an ninh trật tự.',
    crossPartDynamics: {
      part1: 'Đời sống cộng đồng & gia đình: Quê hương, cây xanh xung quanh, nuôi thú cưng, thời tiết & mùa vụ, phương tiện giao thông & kẹt xe, phim ảnh, quan hệ gia đình & bạn bè, làm tình nguyện.',
      part2: 'Giải quyết vấn đề xã hội: Biện pháp giảm thiểu tai nạn giao thông và kẹt xe đô thị, chọn vật nuôi cho con nhỏ, chọn hình thức du lịch cho bạn bè đến thăm, chọn địa điểm họp lớp (class reunion).',
      part3: 'Chính sách & cộng đồng vĩ mô: Lợi ích của xe điện (EVs), bảo vệ môi trường & lối sống xanh, trách nhiệm của người nuôi thú cưng, giải pháp kéo giảm tỷ lệ tội phạm đô thị, phát triển du lịch bền vững, gìn giữ lễ hội truyền thống, thuê người giúp việc gia đình.'
    },
    coreKeywords: [
      'Environmental sustainability', 'Eco-friendly transit (EVs)', 'Urban traffic congestion',
      'Civic responsibility', 'Pet ownership stewardship', 'Crime prevention initiatives',
      'Cultural heritage preservation', 'Sustainable eco-tourism', 'Community cohesion', 'Carbon footprint reduction'
    ],
    universalReasons: [
      'Curb environmental pollution & foster ecological equilibrium (Giảm thiểu ô nhiễm môi trường và bảo vệ hệ sinh thái)',
      'Enhance urban livability & safeguard communal safety (Nâng cao chất lượng đô thị và đảm bảo an ninh trật tự)',
      'Preserve cultural identity & strengthen familial and societal bonds (Gìn giữ bản sắc truyền thống và thắt chặt tình cảm gắn kết xã hội)'
    ]
  }
};

// 3. Classification Engine with High-Precision Priority Matching
function classifyQuestion(q) {
  const title = (q.title || '').toLowerCase();
  const titleAndGroup = `${q.title || ''} ${q.group || ''}`.toLowerCase();
  const content = (q.content || '').toLowerCase();

  // Priority 1: High-specificity title checks
  if (/crime|police|prison|neighborhood safe/i.test(title)) return 'society';
  if (/traffic|congestion|accident|commuting|vehicle|car\b|transport/i.test(title)) return 'society';
  if (/pet\b|animal|plant|greenery|recycle|waste|weather|season|rain|hometown|countryside|touris|travel|vacation|festival/i.test(title)) return 'society';
  if (/english|foreign language|study abroad|school|teach|subject|curriculum|exam|freshmen|student misbehavior|discipline children|peer pressure|librar/i.test(title)) return 'education';
  if (/tea|drink|diet|vegetarian|food|cuisine|eat out|eating out|restaurant|dine|obesity|weight|fitness|gym|cycling|exercise|sport|sickness|medical check|stay calm|work-life balance/i.test(title)) return 'health';
  if (/artificial intelligence|\bai\b|internet|mobile phone|smartphone|smartwatch|wearable|online shopping|shopping online|invention|e-book|digital reading|social media|post.*video|content creation|transferred money|face-to-face/i.test(title)) return 'technology';
  if (/job|career|workplace|working condition|work & career|teamwork|colleague|retirement|farewell|saving money|professional skill|team-building|self-employment|entrepreneurship|unemployment|failure.*success|personal habit.*success/i.test(title)) return 'work';

  // Priority 2: Fallback to combined title & group
  if (/artificial intelligence|\bai\b|internet|mobile phone|smartphone|smartwatch|wearable|shopping online|invention|e-book|digital reading|social media|post.*video|content creation|transferred money|face-to-face/i.test(titleAndGroup)) {
    return 'technology';
  }
  if (/educat|school|teach|student|english|foreign language|study|subject|reading habit|reading & leisure|read book|library|science|discipline|misbehavior|peer pressure|university|freshmen|online learning|creative class|soft skill/i.test(titleAndGroup)) {
    return 'education';
  }
  if (/health|diet|vegetarian|food|cuisine|drink|tea|milk tea|green tea|eat out|eating out|restaurant|dine|sickness|medical check-up|obesity|lose weight|fitness|exercise|gym|cycling|taking break|being alone|daily meal|happiness|stay calm|work-life balance|physical activity|team sport/i.test(titleAndGroup)) {
    return 'health';
  }
  if (/job|career|workplace|working condition|work & career|teamwork|colleague|retirement|farewell|saving money|professional skill|team-building|self-employment|entrepreneurship|unemployment|failure.*success|personal habit.*success/i.test(titleAndGroup)) {
    return 'work';
  }

  // Priority 3: Fallback check on content
  if (/artificial intelligence|\bai\b|smartphone|mobile device|software|app\b/i.test(content)) return 'technology';
  if (/teach.*method|classroom|curriculum|pedagogy|study abroad/i.test(content)) return 'education';
  if (/dietary|nutrition|workout|physical health|aerobic|obese/i.test(content)) return 'health';
  if (/workplace culture|recruitment|employer|employee|salary scale/i.test(content)) return 'work';

  // Default: Environment, Society & Community
  return 'society';
}

// 4. Main Generator
function generateSpeakingHubs() {
  console.log('🔄 Đang phân tích index.json và các đề thi Speaking...');
  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`❌ Không tìm thấy file: ${INDEX_PATH}`);
    process.exit(1);
  }

  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const speakingEntries = indexData.speaking || [];

  const hubs = {};
  for (const [key, val] of Object.entries(HUBS_CONFIG)) {
    hubs[key] = {
      ...val,
      stats: { total: 0, part1: 0, part2: 0, part3: 0 },
      questions: {
        part1: [],
        part2: [],
        part3: []
      }
    };
  }

  let totalQuestions = 0;

  speakingEntries.forEach((entry) => {
    const filePath = path.join(DATA_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Bỏ qua file: ${filePath}`);
      return;
    }

    const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    list.forEach((q) => {
      let part = q.part || (q['Phần thi'] ? q['Phần thi'].replace('speaking-', '') : '');
      if (!['part1', 'part2', 'part3'].includes(part)) return;

      const hubKey = classifyQuestion(q);
      const cleanTitle = (q.title || q['Tiêu đề đề bài'] || '')
        .replace(/^(Topic \d+:|Part \d+( - Situation \d+)?:)\s*/i, '')
        .trim();

      const item = {
        id: q.id || q['Mã câu hỏi'] || '',
        school: q.school || entry.school || '',
        batch: q.batch || entry.batch || '',
        part: part,
        title: cleanTitle || q.title || '',
        rawTitle: q.title || q['Tiêu đề đề bài'] || '',
        content: q.content || q['Nội dung chi tiết'] || ''
      };

      hubs[hubKey].questions[part].push(item);
      hubs[hubKey].stats[part]++;
      hubs[hubKey].stats.total++;
      totalQuestions++;
    });
  });

  // 5. Save JSON file
  const outputData = {
    generatedAt: new Date().toISOString(),
    totalSpeakingQuestions: totalQuestions,
    hubCount: Object.keys(hubs).length,
    hubs: hubs
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(outputData, null, 2), 'utf8');

  console.log(`\n✅ XUẤT THÀNH CÔNG!`);
  console.log(`- File dữ liệu JSON: ${OUTPUT_JSON}`);
  console.log(`- Tổng số câu hỏi phân tích: ${totalQuestions}`);
  console.log('--------------------------------------------------');
  for (const hub of Object.values(hubs)) {
    console.log(
      `📌 ${hub.title.padEnd(35)}: Tổng ${hub.stats.total.toString().padStart(2)} đề | P1: ${hub.stats.part1} | P2: ${hub.stats.part2} | P3: ${hub.stats.part3}`
    );
  }
}

// Export for module use and execute directly
if (require.main === module) {
  generateSpeakingHubs();
}

module.exports = {
  generateSpeakingHubs,
  HUBS_CONFIG,
  classifyQuestion
};
