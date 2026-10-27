export interface MindmapItem {
  id: string;
  text: string;
  badge?: string;
}

export interface MindmapNode {
  id: string;
  title: string;
  badge?: string;
  tags?: string[];
  color?: string; // hex color code
  items?: (string | MindmapItem)[];
  children?: MindmapNode[];
}

export interface MindmapTopic {
  id: 'education' | 'environment' | 'lifestyles' | 'technology' | 'transport' | 'work' | 'tourism' | 'society';
  title: string;
  vietnameseTitle: string;
  description: string;
  icon: string;
  centerNode: {
    title: string;
    subtitle: string;
    categoryBadge: string;
  };
  leftBranches: MindmapNode[];
  rightBranches: MindmapNode[];
}

export const MINDMAP_TOPICS: MindmapTopic[] = [
  // 1. EDUCATION
  {
    id: 'education',
    title: 'School / Education',
    vietnameseTitle: 'Giáo dục & Học đường',
    description: 'Từ vựng, cơ sở vật chất, vai trò thầy cô, bạn bè và mục đích giáo dục cho VSTEP Writing & Speaking.',
    icon: 'GraduationCap',
    centerNode: {
      title: 'School / Education',
      subtitle: 'Trường học & Giáo dục',
      categoryBadge: 'VSTEP Chủ đề 1',
    },
    leftBranches: [
      {
        id: 'edu-general',
        title: 'General (Tổng quan)',
        badge: 'Tổng quan',
        tags: ['Cơ sở vật chất', 'Con người', 'Đồ dùng học tập'],
        color: '#f97316', // Orange
        children: [
          {
            id: 'edu-gen-subjects',
            title: 'subjects / departments / discipline / curriculum:',
            color: '#f97316',
            items: [
              '-y (anatomy, oncology,...); ics (physics, mathematics, economics...)',
            ],
          },
          {
            id: 'edu-gen-supplies',
            title: 'school supplies / stationery items:',
            color: '#f97316',
            items: [
              'book, textbook, notebook, workbook, board-chalk-marker',
            ],
          },
          {
            id: 'edu-gen-facilities',
            title: 'school facilities:',
            color: '#f97316',
            items: [
              '-class with (projector, TV, board), lecture hall, playground, library, computer room, center, sport center, playing field, laboratory (do experiments), hall of residence / dormitory...',
            ],
          },
          {
            id: 'edu-gen-people',
            title: 'People in schools:',
            color: '#f97316',
            items: [
              '(vice) - president / rector / principal / school head / headmaster / headmistress; head teacher; monitor;',
            ],
          },
        ],
      },
      {
        id: 'edu-friends',
        title: 'Friends (Bạn bè)',
        badge: 'Bạn bè',
        tags: ['Mối quan hệ', 'Giao tiếp xã hội', 'Gắn kết'],
        color: '#8b5cf6', // Purple
        children: [
          {
            id: 'edu-friends-siblings',
            title: 'siblings & close peers:',
            color: '#8b5cf6',
            items: [
              'enjoy each other\'s company, see eye to eye,...',
            ],
          },
          {
            id: 'edu-friends-old',
            title: 'old school friends:',
            color: '#8b5cf6',
            items: [
              'keep in touch, build lifelong networks',
            ],
          },
        ],
      },
    ],
    rightBranches: [
      {
        id: 'edu-purposes',
        title: 'Purposes of Edu (Mục đích)',
        badge: 'Mục đích',
        tags: ['Trí tuệ & Nghề nghiệp', 'Thể chất', 'Nuôi dưỡng nhân cách'],
        color: '#f43f5e', // Rose
        children: [
          {
            id: 'edu-pur-intellectual',
            title: 'Intellectual and Work',
            color: '#f43f5e',
            items: [
              'theoretical knowledge',
              'practical and professional skills, gain hands-on experiences, improve career prospects',
              'sharpen interpersonal and intrapersonal skills (independent and critical thinking; problem-solving; communication and social skills,...)',
            ],
          },
          {
            id: 'edu-pur-physical',
            title: 'Physical',
            color: '#f43f5e',
            items: [
              '-develop (physical fitness, healthy lifestyle)',
            ],
          },
          {
            id: 'edu-pur-psychological',
            title: 'Psychological',
            color: '#f43f5e',
            items: [
              '-self-cultivation (sự nuôi dưỡng / rèn luyện nhân cách)',
            ],
          },
        ],
      },
      {
        id: 'edu-teachers',
        title: 'Teachers (Thầy cô)',
        badge: 'Thầy cô',
        tags: ['Phương pháp giảng dạy', 'Tạo cảm hứng', 'Chuyên môn'],
        color: '#10b981', // Emerald
        children: [
          {
            id: 'edu-teach-methods',
            title: 'teaching & delivery:',
            color: '#10b981',
            items: [
              'impart / deliver knowledge (creatively / in the creative way; with learner-oriented method)',
            ],
          },
          {
            id: 'edu-teach-inspire',
            title: 'motivation & feedback:',
            color: '#10b981',
            items: [
              'interact, inspire and motivate students (to have life-long passion for learning); give feedback on sth',
            ],
          },
          {
            id: 'edu-teach-traits',
            title: 'qualities & expertise:',
            color: '#10b981',
            items: [
              'adj: dedicated, supportive, understanding',
              'N: be experts in their fields, be established',
            ],
          },
        ],
      },
    ],
  },

  // 2. ENVIRONMENT
  {
    id: 'environment',
    title: 'Environment',
    vietnameseTitle: 'Môi trường & Biến đổi khí hậu',
    description: 'Vấn đề môi trường, nguyên nhân phát sinh và giải pháp từ cấp độ toàn cầu đến cá nhân.',
    icon: 'Trees',
    centerNode: {
      title: 'ENVIRONMENT',
      subtitle: 'Môi trường Sinh thái',
      categoryBadge: 'VSTEP Chủ đề 2',
    },
    leftBranches: [
      {
        id: 'env-issues',
        title: 'Issues / Problems (Vấn đề)',
        badge: 'Vấn đề',
        tags: ['Biến đổi khí hậu', 'Ô nhiễm môi trường', 'Khủng hoảng năng lượng'],
        color: '#f43f5e', // Rose
        children: [
          {
            id: 'env-issues-climate',
            title: 'climate & atmosphere:',
            color: '#f43f5e',
            items: [
              'Climate change, global warming',
            ],
          },
          {
            id: 'env-issues-pollution',
            title: 'pollution types:',
            color: '#f43f5e',
            items: [
              'Pollution: air / water / soil / noise / light pollution',
            ],
          },
          {
            id: 'env-issues-disasters',
            title: 'extreme weather:',
            color: '#f43f5e',
            items: [
              'Natural disasters / extreme weather: drought, flood, sandstorm, acid rain,...',
            ],
          },
          {
            id: 'env-issues-resources',
            title: 'resource depletion:',
            color: '#f43f5e',
            items: [
              'Energy crisis, water shortage, deforestation,...',
            ],
          },
        ],
      },
      {
        id: 'env-causes',
        title: 'Causes (Nguyên nhân)',
        badge: 'Nguyên nhân',
        tags: ['Công nghiệp hóa', 'Bùng nổ dân số', 'Tác động lâu dài'],
        color: '#f97316', // Orange
        children: [
          {
            id: 'env-cause-industrial',
            title: 'Industrial development',
            color: '#f97316',
            items: [
              'discharge / pump / release untreated / raw / toxic sewage / pollutants / contaminants into lake / sea',
            ],
          },
          {
            id: 'env-cause-population',
            title: 'Population growth',
            color: '#f97316',
            items: [
              'population explosion (deplete natural resources, increase in rubbish / garbage / trash)',
            ],
          },
          {
            id: 'env-cause-human',
            title: 'Long-term human activities',
            color: '#f97316',
            items: [
              'overexploitation of natural resources and fossil fuels over decades',
            ],
          },
        ],
      },
    ],
    rightBranches: [
      {
        id: 'env-macro-solutions',
        title: 'Macro Solutions (Giải pháp Vĩ mô)',
        badge: 'Vĩ mô',
        tags: ['Toàn cầu', 'Quốc gia', 'Năng lượng tái tạo'],
        color: '#0284c7', // Sky
        children: [
          {
            id: 'env-sol-global',
            title: 'Global level',
            color: '#0284c7',
            items: [
              'reach agreement',
              'set international standards for environmental protection',
            ],
          },
          {
            id: 'env-sol-national',
            title: 'National level',
            color: '#0284c7',
            items: [
              'enact laws',
              'raise public awareness of green lifestyle',
              'encourage low-carbon economy,',
              'exploit renewable / green energy (wind, hydro, solar power),',
              'invest in energy-saving technologies',
            ],
          },
        ],
      },
      {
        id: 'env-micro-solutions',
        title: 'Micro Solutions (Giải pháp Vi mô)',
        badge: 'Vi mô',
        tags: ['Tổ chức • Doanh nghiệp', 'Cá nhân • Lối sống', 'Quy tắc 3R'],
        color: '#10b981', // Emerald
        children: [
          {
            id: 'env-sol-org',
            title: 'Organizational level',
            color: '#10b981',
            items: [
              'promote environmentally-friendly products',
            ],
          },
          {
            id: 'env-sol-individual',
            title: 'Individual level',
            color: '#10b981',
            items: [
              'lead green consuming habits, lead green lifestyle',
              'take public transportation, avoid using throw-away / single-use products',
              'sort the daily garbage, 3R (reduce, reuse, recycle)',
            ],
          },
        ],
      },
    ],
  },

  // 3. LIFESTYLES
  {
    id: 'lifestyles',
    title: 'Lifestyles',
    vietnameseTitle: 'Lối sống & Thói quen ăn uống',
    description: 'Béo phì (nguyên nhân, tác hại, giải pháp) và so sánh chi tiết thức ăn ngoài vs nấu tại nhà.',
    icon: 'HeartPulse',
    centerNode: {
      title: 'Lifestyles',
      subtitle: 'Lối sống & Sức khỏe',
      categoryBadge: 'VSTEP Chủ đề 3',
    },
    leftBranches: [
      {
        id: 'life-obesity',
        title: 'Obesity (Béo phì)',
        badge: 'Bệnh lý',
        tags: ['Nguyên nhân ăn uống', 'Tác hại thể chất & tinh thần', 'Biện pháp can thiệp'],
        color: '#ef4444', // Red/Crimson
        children: [
          {
            id: 'life-obesity-causes',
            title: 'Causes',
            color: '#ef4444',
            items: [
              'have poor diet: consume too much fast food / processed food / ready meals; lack knowledge about good nutrition or a balanced diet.',
              'inactive / sedentary lifestyles => lack physical exercises => prefer staying at home and use technologies.',
            ],
          },
          {
            id: 'life-obesity-effects',
            title: 'Effects',
            color: '#ef4444',
            items: [
              'individuals: lead to heart disease, diabetes, high blood pressure and other conditions.',
              'lead to depression, eating disorders => being bullied / body shaming => badly affect psychological development',
              'burden on national healthcare system',
            ],
          },
          {
            id: 'life-obesity-solutions',
            title: 'Solutions',
            color: '#ef4444',
            items: [
              'family: adopting healthy eating habits',
              'Increase level of physical activity: play sports / take part in outdoor activities',
              'Reduce screen time in front of phones, computers and TV.',
            ],
          },
        ],
      },
    ],
    rightBranches: [
      {
        id: 'life-takeout',
        title: 'Takeout food / Eating out (Ăn ngoài)',
        badge: 'Ăn ngoài',
        tags: ['Tiện lợi', 'Chi phí cao', 'Nguy cơ sức khỏe'],
        color: '#f97316', // Orange
        children: [
          {
            id: 'life-takeout-pros',
            title: 'Pros',
            color: '#f97316',
            items: [
              '1. fast, convenient for busy people in modern-day society',
              '2. offer a variety of choices / dishes cooked by professional chefs',
            ],
          },
          {
            id: 'life-takeout-cons',
            title: 'Cons',
            color: '#f97316',
            items: [
              '1 junk food = processed food = low-quality food',
              'unhealthy: oily, sugary, salty, ...',
              '2 more pricey than cooking at home: the fee includes services and eating space',
              '3 results in diseases like heart attack and diabetes => use low quality ingredients and do not ensure cleanliness and hygiene of foods.',
            ],
          },
        ],
      },
      {
        id: 'life-homemade',
        title: 'Homemade food (Nấu tại nhà)',
        badge: 'Cơm nhà',
        tags: ['Dinh dưỡng lành mạnh', 'Kiểm soát ngân sách', 'Gắn kết gia đình'],
        color: '#10b981', // Emerald
        children: [
          {
            id: 'life-home-pros',
            title: 'Pros',
            color: '#10b981',
            items: [
              'cheaper: keep food in the fridge => control household budget',
              'Healthy and nutritious meals: control over the ingredients => choose fresh and natural ingredients',
              'boosts immune system and reduces the risk of health issues.',
              'Create family bonds => enjoy cooking time => give private spaces to talk',
            ],
          },
          {
            id: 'life-home-cons',
            title: 'Cons',
            color: '#10b981',
            items: [
              'more time-consuming: preparation, cooking, cleaning',
              'buying the high-quality and specialty ingredients',
              'Inconvenience and Fatigue => lead to stress',
            ],
          },
        ],
      },
    ],
  },

  // 4. TECHNOLOGY
  {
    id: 'technology',
    title: 'Technology',
    vietnameseTitle: 'Công nghệ & Đời sống số',
    description: 'Lợi ích trong công việc / học tập / giải trí, kỹ năng tin học và các mặt trái về sức khỏe, an ninh mạng.',
    icon: 'Cpu',
    centerNode: {
      title: 'TECHNOLOGY',
      subtitle: 'Công nghệ Thông tin',
      categoryBadge: 'VSTEP Chủ đề 4',
    },
    leftBranches: [
      {
        id: 'tech-cons',
        title: 'Cons & Risks (Mặt trái & Nguy cơ)',
        badge: 'Mặt trái',
        tags: ['Sức khỏe thể chất', 'Sức khỏe tinh thần', 'An ninh mạng'],
        color: '#f43f5e', // Rose
        children: [
          {
            id: 'tech-physical-health',
            title: 'physical health',
            color: '#f43f5e',
            items: [
              'sit for a long with wrong posture => backbone problem',
              'radiation; less outdoor activities',
              'stare at the screen for a long time => weaken eyesight;',
            ],
          },
          {
            id: 'tech-mental-health',
            title: 'mental health',
            color: '#f43f5e',
            items: [
              'too indulge in the virtual world => be isolated from the real world',
              'lack face-to-face conversation',
              'less quality time with family',
            ],
          },
          {
            id: 'tech-censorship',
            title: 'access to information which is not strictly censored',
            color: '#f43f5e',
            items: [
              'questionable and non-educational contents, violence',
            ],
          },
          {
            id: 'tech-cybercrime',
            title: 'cybercrime',
            color: '#f43f5e',
            items: [
              'hackers steal personal information',
              'privacy invaded / infringed',
              'personal information leaks, illegal gambling',
            ],
          },
        ],
      },
    ],
    rightBranches: [
      {
        id: 'tech-personal',
        title: 'Personal: indispensable part (Đời sống)',
        badge: 'Đời sống',
        tags: ['Thiết bị thông minh', 'Kỹ năng tin học', 'Cuộc sống tiện ích'],
        color: '#8b5cf6', // Purple
        children: [
          {
            id: 'tech-gadgets',
            title: 'gadgets (electronic devices)',
            color: '#8b5cf6',
            items: [
              'computers (laptop + desktop); tablets, smartphones; three dimensional glasses; household appliances (eg. robot vacuum cleaners help to reduce burden of doing household chores)',
            ],
          },
          {
            id: 'tech-not-buff',
            title: 'not a computer buff / techie',
            color: '#8b5cf6',
            items: [
              'back-up file when computers crash',
            ],
          },
          {
            id: 'tech-literate',
            title: 'but be computer literate',
            color: '#8b5cf6',
            items: [
              'able to use basic functions of a computer: surfing websites, using search engines, word processing, making excel spreadsheets, email,...',
            ],
          },
        ],
      },
      {
        id: 'tech-pros',
        title: 'Pros: study, work & relax (Lợi ích)',
        badge: 'Lợi ích',
        tags: ['Hiệu suất công việc', 'Giao tiếp toàn cầu', 'Kinh tế tri thức'],
        color: '#0284c7', // Sky
        children: [
          {
            id: 'tech-pros-efficiency',
            title: 'productivity & efficiency:',
            color: '#0284c7',
            items: [
              'improve work / study efficiency and productivity',
              'make life more convenient with the click of a mouse: online (learning, transaction, shopping,...)',
            ],
          },
          {
            id: 'tech-pros-connectivity',
            title: 'communication & knowledge:',
            color: '#0284c7',
            items: [
              'boost / promote communication, erase geographical barrier: make phone call / video / - face time; social media connecting like-minded people',
              'access great and free sources of information / knowledge-based economy',
            ],
          },
        ],
      },
    ],
  },

  // 5. TRANSPORT
  {
    id: 'transport',
    title: 'Transport',
    vietnameseTitle: 'Giao thông & Phương tiện đi lại',
    description: 'Giao thông công cộng vs phương tiện cá nhân, vấn đề tai nạn / ùn tắc giao thông và giải pháp.',
    icon: 'Car',
    centerNode: {
      title: 'TRANSPORT',
      subtitle: 'Hệ thống Giao thông',
      categoryBadge: 'VSTEP Chủ đề 5',
    },
    leftBranches: [
      {
        id: 'trans-problems',
        title: 'Traffic problems (Vấn nạn giao thông)',
        badge: 'Vấn đề',
        tags: ['Ùn tắc & Tai nạn', 'Ý thức chấp hành', 'Chất lượng hạ tầng'],
        color: '#ef4444', // Red/Crimson
        children: [
          {
            id: 'trans-prob-list',
            title: 'Types of problems',
            color: '#ef4444',
            items: [
              'Traffic congestion / traffic jams',
              'Traffic accidents',
            ],
          },
          {
            id: 'trans-causes',
            title: 'Causes',
            color: '#ef4444',
            items: [
              'drive carelessly / recklessly / Drunk driving/',
              'Do not follow traffic rules: run a red light / drive without a helmet / exceed the speed limit',
              'rise in the number of private vehicles',
              'Poorly maintained roadways',
            ],
          },
        ],
      },
      {
        id: 'trans-solutions',
        title: 'Solutions to traffic problems (Giải pháp)',
        badge: 'Giải pháp',
        tags: ['Chế tài xử phạt', 'Nâng cấp đường sá', 'Tuyên truyền luật'],
        color: '#10b981', // Emerald
        children: [
          {
            id: 'trans-sol-punish',
            title: 'strict penalties:',
            color: '#10b981',
            items: [
              'implement stricter punishments for driving offences (a heavier fine)',
            ],
          },
          {
            id: 'trans-sol-infra',
            title: 'infrastructure & education:',
            color: '#10b981',
            items: [
              'improve road infrastructure',
              'educate people to follow traffic rules',
            ],
          },
        ],
      },
    ],
    rightBranches: [
      {
        id: 'trans-public',
        title: 'Public transport = Mass transit (Công cộng)',
        badge: 'Công cộng',
        tags: ['Xe buýt • Tàu điện', 'Bảo vệ môi trường', 'Tiết kiệm chi phí'],
        color: '#0284c7', // Sky
        children: [
          {
            id: 'trans-public-pros',
            title: 'Pros',
            color: '#0284c7',
            items: [
              'Reduces Air Pollution (environmentally-friendly mode of transport) <= less fuel burned',
              'affordable / Improves Fuel Efficiency',
              'safe: qualified drivers with driving license and a lot of driving experiences; separate lanes',
              'Improves road congestion > more people take buses / trains means fewer vehicles on the road',
            ],
          },
          {
            id: 'trans-public-cons',
            title: 'Cons',
            color: '#0284c7',
            items: [
              '1. inconvenient: have to follow the bus schedule (have to wait)',
              '2. share public facilities with others + the buses are jam-packed with people during rush hours => not very hygienic => be at risk of contracting viruses / bacteria (covid-19)',
              '3. lack of facilities: need to raise quality standard: more bus stations / stops; comfy seats, air-conditioners, better services, security, free wifi...',
            ],
          },
        ],
      },
      {
        id: 'trans-private',
        title: 'Private transport (Phương tiện cá nhân)',
        badge: 'Cá nhân',
        tags: ['Ô tô • Xe máy', 'Chủ động thời gian', 'Tác động môi trường'],
        color: '#f97316', // Orange
        children: [
          {
            id: 'trans-private-pros',
            title: 'Pros',
            color: '#f97316',
            items: [
              '1. convenient: go anywhere at anytime',
              '2. hygienic: private-owned vehicle is taken good care of by the owner',
            ],
          },
          {
            id: 'trans-private-cons',
            title: 'Cons',
            color: '#f97316',
            items: [
              'a. not environmentally-friendly, one factor contributing to traffic congestion and carbon dioxide emission',
              'b. costlier / pricier: fuel, parking fee',
              'c. less safe',
            ],
          },
        ],
      },
    ],
  },

  // 6. WORK & CAREER (Chủ đề bổ sung phân tích từ đề thi UEH, VLU, UFM...)
  {
    id: 'work',
    title: 'Work & Career',
    vietnameseTitle: 'Công việc & Sự nghiệp',
    description: 'Tự do tài chính, làm việc từ xa, áp lực công sở, kỹ năng nghề nghiệp và phát triển bản thân (UEH, VLU).',
    icon: 'Briefcase',
    centerNode: {
      title: 'Work & Career',
      subtitle: 'Nghề nghiệp & Đời sống Công sở',
      categoryBadge: 'VSTEP Chủ đề 6 (Hot)',
    },
    leftBranches: [
      {
        id: 'work-trends',
        title: 'Modern Work Trends (Xu hướng làm việc)',
        badge: 'Xu hướng',
        tags: ['Self-employment', 'Làm việc từ xa (WFH)', 'Nhảy việc (Job-hopping)'],
        color: '#8b5cf6', // Purple
        children: [
          {
            id: 'work-trend-self',
            title: 'Self-employment & Freelancing:',
            color: '#8b5cf6',
            items: [
              'Pros: flexible working hours, autonomy in choosing clients, uncapped income potential',
              'Cons: irregular income stream, no corporate paid leaves / insurance, high financial pressure',
            ],
          },
          {
            id: 'work-trend-remote',
            title: 'Remote work & Telecommuting:',
            color: '#8b5cf6',
            items: [
              'Pros: eliminate exhausting daily commute, save transportation costs, work from home comfort',
              'Cons: blur boundaries between personal life and work, feelings of professional isolation',
            ],
          },
          {
            id: 'work-trend-hop',
            title: 'Job-hopping among youth:',
            color: '#8b5cf6',
            items: [
              'Causes: chase higher salary, seek fast promotions, desire dynamic corporate culture',
              'Drawbacks: lack of deep domain expertise, creates impression of unreliability on CV',
            ],
          },
        ],
      },
      {
        id: 'work-challenges',
        title: 'Workplace Stress (Thách thức & Áp lực)',
        badge: 'Áp lực',
        tags: ['Khủng hoảng Burnout', 'Deadlines dồn dập', 'Cân bằng cuộc sống'],
        color: '#ef4444', // Red
        children: [
          {
            id: 'work-chal-stress',
            title: 'Causes of occupational stress:',
            color: '#ef4444',
            items: [
              'tight project deadlines, overwhelming workload, high performance quotas',
              'fear of layoffs, competitive peer pressure, poor management communication',
            ],
          },
          {
            id: 'work-chal-burnout',
            title: 'Consequences of burnout:',
            color: '#ef4444',
            items: [
              'chronic mental exhaustion, severe insomnia, reduced job productivity and motivation',
              'higher staff turnover rate, negative spillover into family relationships',
            ],
          },
          {
            id: 'work-chal-solutions',
            title: 'Solutions for work-life balance:',
            color: '#ef4444',
            items: [
              'learn to prioritize tasks, set clear boundaries (disconnect emails after work hours)',
              'companies provide wellness programs, mental health counseling, team-building trips',
            ],
          },
        ],
      },
    ],
    rightBranches: [
      {
        id: 'work-skills',
        title: 'Essential Career Skills (Kỹ năng nghề nghiệp)',
        badge: 'Kỹ năng',
        tags: ['Kỹ năng mềm', 'Kỹ năng số & AI', 'Ngoại ngữ'],
        color: '#0284c7', // Sky
        children: [
          {
            id: 'work-skill-soft',
            title: 'Soft & Interpersonal skills:',
            color: '#0284c7',
            items: [
              'effective cross-cultural communication, persuasive negotiation, active listening',
              'adaptability and emotional intelligence (EQ) in handling office conflicts',
            ],
          },
          {
            id: 'work-skill-hard',
            title: 'Digital & Technical proficiency:',
            color: '#0284c7',
            items: [
              'computer literacy, data analysis, leveraging AI tools to automate repetitive tasks',
              'fluency in English as a global business language (break career glass ceilings)',
            ],
          },
        ],
      },
      {
        id: 'work-success',
        title: 'Career Advancement (Thăng tiến & Thành công)',
        badge: 'Thành công',
        tags: ['Nỗ lực vs Năng khiếu', 'Xây dựng mối quan hệ', 'Động lực làm việc'],
        color: '#10b981', // Emerald
        children: [
          {
            id: 'work-succ-effort',
            title: 'Hard work vs Natural ability:',
            color: '#10b981',
            items: [
              'diligent effort, discipline and perseverance consistently outweigh raw innate talent',
              'continuous professional learning and attending skill development workshops',
            ],
          },
          {
            id: 'work-succ-network',
            title: 'Professional networking:',
            color: '#10b981',
            items: [
              'foster authentic mentor-mentee relationships, connect with industry leaders',
              'seek constructive feedback from supervisors to rapidly correct shortcomings',
            ],
          },
        ],
      },
    ],
  },

  // 7. TRAVEL & TOURISM (Chủ đề bổ sung phân tích từ đề thi HCMUE, VLU, LHU...)
  {
    id: 'tourism',
    title: 'Travel & Tourism',
    vietnameseTitle: 'Du lịch & Giao lưu Văn hóa',
    description: 'Tác động kinh tế & văn hóa của du lịch, du lịch sinh thái, du lịch tâm linh và dịch vụ lưu trú (HCMUE, VLU).',
    icon: 'Compass',
    centerNode: {
      title: 'Travel & Tourism',
      subtitle: 'Du lịch & Trải nghiệm Văn hóa',
      categoryBadge: 'VSTEP Chủ đề 7 (Hot)',
    },
    leftBranches: [
      {
        id: 'tour-impacts',
        title: 'Impacts of Tourism (Tác động ngành du lịch)',
        badge: 'Tác động',
        tags: ['Tăng trưởng kinh tế', 'Tác động môi trường', 'Overtourism'],
        color: '#f97316', // Orange
        children: [
          {
            id: 'tour-imp-benefits',
            title: 'Economic & cultural benefits:',
            color: '#f97316',
            items: [
              'generate massive revenues, create abundant jobs (hospitality, guides, drivers, artisans)',
              'promote cultural exchange, break stereotypes, foster international mutual respect',
              'reinvest ticket profits into preserving national monuments and heritage sites',
            ],
          },
          {
            id: 'tour-imp-drawbacks',
            title: 'Drawbacks & Overtourism:',
            color: '#f97316',
            items: [
              'overcrowding ruins local tranquility, strains transportation and sewage infrastructure',
              'littering, plastic pollution, irreversible destruction of coral reefs and natural habitats',
              'commercialization leads to loss of authentic local traditions and heritage values',
            ],
          },
        ],
      },
      {
        id: 'tour-types',
        title: 'Travel Styles & Trends (Hình thức du lịch)',
        badge: 'Hình thức',
        tags: ['Du lịch tự túc', 'Tour trọn gói', 'Du lịch tâm linh'],
        color: '#8b5cf6', // Purple
        children: [
          {
            id: 'tour-type-solo',
            title: 'Solo travel vs Group tours:',
            color: '#8b5cf6',
            items: [
              'Solo backpacking: ultimate freedom, step out of comfort zone, cultivate independence',
              'Packaged group tour: comprehensive safety, well-planned itineraries, professional guide explanations',
            ],
          },
          {
            id: 'tour-type-religious',
            title: 'Religious & Heritage tourism:',
            color: '#8b5cf6',
            items: [
              'pilgrimages to ancient temples, shrines and cathedrals to seek spiritual inner peace',
              'visiting museums and historic landmarks to gain deep appreciation of national history',
            ],
          },
        ],
      },
    ],
    rightBranches: [
      {
        id: 'tour-eco',
        title: 'Sustainable Tourism (Du lịch sinh thái bền vững)',
        badge: 'Sinh thái',
        tags: ['Du lịch có trách nhiệm', 'Bảo tồn thiên nhiên', 'Hỗ trợ bản địa'],
        color: '#10b981', // Emerald
        children: [
          {
            id: 'tour-eco-principles',
            title: 'Ecotourism principles:',
            color: '#10b981',
            items: [
              'travel responsibly to natural reserves, minimize carbon emissions and ecological footprint',
              'stay at community-based homestays, purchase handmade souvenirs from local indigenous tribes',
            ],
          },
          {
            id: 'tour-eco-solutions',
            title: 'Conservation measures:',
            color: '#10b981',
            items: [
              'governments establish daily tourist quotas at vulnerable ecological destinations',
              'heavier penalties for vandalizing artifacts, strict bans on single-use plastics in national parks',
            ],
          },
        ],
      },
      {
        id: 'tour-hospitality',
        title: 'Hospitality & Services (Dịch vụ & Khách sạn)',
        badge: 'Lưu trú',
        tags: ['Đánh giá khách sạn', 'Chất lượng dịch vụ', 'Sự hài lòng du khách'],
        color: '#0284c7', // Sky
        children: [
          {
            id: 'tour-hosp-accommodations',
            title: 'Accommodation varieties:',
            color: '#0284c7',
            items: [
              'luxury 5-star hotels: premium amenities (infinity pool, fine dining, spa, 24/7 room service)',
              'budget hostels & homestays: wallet-friendly, cozy communal vibe, warm cultural immersion',
            ],
          },
          {
            id: 'tour-hosp-satisfaction',
            title: 'Key guest satisfaction factors:',
            color: '#0284c7',
            items: [
              'spotless room cleanliness and hygiene, attentive and courteous staff attitude',
              'prime location near public transit and city center, transparent pricing with no hidden fees',
            ],
          },
        ],
      },
    ],
  },

  // 8. FAMILY & SOCIETY (Chủ đề bổ sung phân tích từ đề thi VLU, DTHU...)
  {
    id: 'society',
    title: 'Family & Society',
    vietnameseTitle: 'Gia đình & Xã hội hiện đại',
    description: 'Cấu trúc gia đình, khoảng cách thế hệ, tính tự lập sớm của giới trẻ, hoạt động tình nguyện và xu hướng xã hội (VLU, DTHU).',
    icon: 'Users',
    centerNode: {
      title: 'Family & Society',
      subtitle: 'Gia đình & Mối quan hệ Xã hội',
      categoryBadge: 'VSTEP Chủ đề 8 (Hot)',
    },
    leftBranches: [
      {
        id: 'soc-family',
        title: 'Family Dynamics (Cấu trúc & Mối quan hệ)',
        badge: 'Gia đình',
        tags: ['Gia đình hạt nhân vs Nhiều thế hệ', 'Khoảng cách thế hệ', 'Chia sẻ việc nhà'],
        color: '#f43f5e', // Rose
        children: [
          {
            id: 'soc-fam-types',
            title: 'Nuclear vs Extended family:',
            color: '#f43f5e',
            items: [
              'Nuclear family: greater privacy, fewer daily conflicts between in-laws, financial autonomy',
              'Extended family: grandparents provide childcare and life wisdom, richer emotional support network',
            ],
          },
          {
            id: 'soc-fam-gap',
            title: 'Generation gap & Teen conflicts:',
            color: '#f43f5e',
            items: [
              'differing views on career choices, marriage age, social media habits and lifestyle values',
              'bridge the gap: cultivate open, judgment-free conversations, practice empathetic active listening',
            ],
          },
          {
            id: 'soc-fam-chores',
            title: 'Sharing household chores:',
            color: '#f43f5e',
            items: [
              'break gender stereotypes, alleviate stress for working wives/mothers, build harmonious family bond',
              'instill accountability, time management, and essential life independence in young children',
            ],
          },
        ],
      },
      {
        id: 'soc-youth',
        title: 'Youth & Independence (Giới trẻ & Tự lập)',
        badge: 'Giới trẻ',
        tags: ['Tự lập sớm', 'Áp lực đồng trang lứa (Peer pressure)', 'Trào lưu tiêu dùng'],
        color: '#f97316', // Orange
        children: [
          {
            id: 'soc-youth-indep',
            title: 'Early independence in youth:',
            color: '#f97316',
            items: [
              'benefits: learn financial budgeting, mature problem-solving abilities, resilient coping in hardship',
              'drawbacks: emotional vulnerability if lacking parental guidance, risk of burnout from early jobs',
            ],
          },
          {
            id: 'soc-youth-peer',
            title: 'Peer pressure & Trend-following:',
            color: '#f97316',
            items: [
              'buying expensive branded goods just to fit in with friend circles, fear of missing out (FOMO)',
              'encourage youngsters to embrace individuality, value substance over superficial exterior trends',
            ],
          },
        ],
      },
    ],
    rightBranches: [
      {
        id: 'soc-community',
        title: 'Community & Volunteerism (Gắn kết cộng đồng)',
        badge: 'Cộng đồng',
        tags: ['Hoạt động tình nguyện', 'Trách nhiệm công dân', 'Bảo tồn văn hóa'],
        color: '#10b981', // Emerald
        children: [
          {
            id: 'soc-comm-volunteer',
            title: 'Benefits of volunteer work:',
            color: '#10b981',
            items: [
              'personal growth: cultivate compassion, gratitude for life, expand social networks, enrich resume',
              'societal value: support impoverished communities, orphans, elderly homes, disaster relief',
            ],
          },
          {
            id: 'soc-comm-museums',
            title: 'Youth interest in museums & history:',
            color: '#10b981',
            items: [
              'decline due to fast-paced digital games and online short-video entertainment',
              'remedies: modernize exhibits with interactive touchscreens, virtual reality (VR) tours, free student admissions',
            ],
          },
        ],
      },
      {
        id: 'soc-trends',
        title: 'Modern Lifestyle Shifts (Chuyển dịch xã hội)',
        badge: 'Xã hội',
        tags: ['Khuynh hướng độc thân', 'Đô thị hóa', 'Thanh toán không tiền mặt'],
        color: '#0284c7', // Sky
        children: [
          {
            id: 'soc-trend-single',
            title: 'Single life vs Marriage:',
            color: '#0284c7',
            items: [
              'Single life: absolute personal freedom, prioritize career ambitions, zero domestic dispute stress',
              'Marriage: mutual companionship, emotional anchor during hardships, joy of raising offspring together',
            ],
          },
          {
            id: 'soc-trend-urban',
            title: 'Urban living vs Rural relocation:',
            color: '#0284c7',
            items: [
              'Big cities: superior medical healthcare, elite schools, diverse cultural entertainment and job pools',
              'Rural areas: clean air, serene pace, organic food, affordable housing, close-knit neighborhood',
            ],
          },
        ],
      },
    ],
  },
];
