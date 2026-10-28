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
  id: 'education' | 'health' | 'technology' | 'work' | 'society' | string;
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
  {
    "id": "education",
    "title": "Education & Skills",
    "vietnameseTitle": "Giáo dục, Học tập & Kỹ năng",
    "description": "Tổng hợp 35 đề thi thật VSTEP (P1, P2, P3), từ vựng học thuật, phương pháp học, vai trò giáo viên & công nghệ giáo dục.",
    "icon": "GraduationCap",
    "centerNode": {
      "title": "Education & Skills",
      "subtitle": "Giáo dục, Học tập & Kỹ năng",
      "categoryBadge": "VSTEP Topic Hub 1 (35 đề)"
    },
    "leftBranches": [
      {
        "id": "edu-p1",
        "title": "Part 1: Thói quen & Cá nhân (10 đề)",
        "badge": "Part 1",
        "tags": [
          "10 đề thi thật",
          "Khảo sát cá nhân",
          "Phản xạ nhanh"
        ],
        "color": "#f97316",
        "children": [
          {
            "id": "edu-p1-english",
            "title": "Learning English & Practice Habits (speaking-part1-11, vlu10-part1-8):",
            "color": "#f97316",
            "items": [
              "Daily practice routine, autonomous self-study, language exchange apps",
              "Biggest hurdles: listening comprehension & speaking fluency",
              "Future self: English as a gateway to career advancement & global job market"
            ]
          },
          {
            "id": "edu-p1-reading",
            "title": "Reading Habits & Book Preferences (speaking-part1-7, speaking-part1-26, dthu10-part3-1):",
            "color": "#f97316",
            "items": [
              "Preferred genres: self-help, academic textbooks, fiction novels",
              "Reading format: digital e-books vs physical printed books",
              "Benefits: broaden horizons, enhance vocabulary & intellectual curiosity"
            ]
          },
          {
            "id": "edu-p1-school",
            "title": "School, Subjects & Study Environment (speaking-part1-24, vlu10-part1-21, vlu10-part1-22):",
            "color": "#f97316",
            "items": [
              "Favorite subjects: STEM vs humanities & social sciences",
              "Ideal study conditions: quiet library, collaborative spaces, interactive classrooms",
              "Educational institutions: public university vs private academy"
            ]
          }
        ]
      },
      {
        "id": "edu-p2",
        "title": "Part 2: Tình huống Ra quyết định (14 đề)",
        "badge": "Part 2",
        "tags": [
          "14 tình huống thi thật",
          "So sánh 3 phương án",
          "Lập luận thuyết phục"
        ],
        "color": "#8b5cf6",
        "children": [
          {
            "id": "edu-p2-method",
            "title": "Improving English Speaking (speaking-part2-6, hcmue10-part2-1):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Enroll in an intensive communication course at an English center",
              "Option B: Join a weekly English speaking club for casual practice",
              "Option C (Optimal): One-on-one partner / native tutor for instant error correction"
            ]
          },
          {
            "id": "edu-p2-softskills",
            "title": "Most Essential Student Soft Skill (vlu10-part2-3, speaking-part2-5):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Communication & public presentation skills",
              "Option B: Time management & organizational competence",
              "Option C (Optimal): Teamwork & collaborative problem solving in group projects"
            ]
          },
          {
            "id": "edu-p2-career",
            "title": "Choosing a School / Career in Teaching (speaking-part2-1, special-speaking-part2-3):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Public high school (job security & pensions)",
              "Option B: Private bilingual school (modern pedagogical facilities)",
              "Option C (Optimal): International academy (competitive salary & global environment)"
            ]
          },
          {
            "id": "edu-p2-science",
            "title": "Promoting Science Interest & Gifts (bav10-part2-1, vlu10-part2-12, ufm10-part2-1):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Interactive science book / encyclopedia as gift",
              "Option B: Field trip to a science museum / planetary center",
              "Option C: Hands-on science experiment kit for teenagers"
            ]
          }
        ]
      }
    ],
    "rightBranches": [
      {
        "id": "edu-p3",
        "title": "Part 3: Tranh luận & Xã hội (11 đề)",
        "badge": "Part 3",
        "tags": [
          "11 chủ đề vĩ mô",
          "Nguyên nhân - Hệ quả - Giải pháp"
        ],
        "color": "#0ea5e9",
        "children": [
          {
            "id": "edu-p3-ai",
            "title": "AI in Modern Education (speaking-part3-4, vlu10-part3-11):",
            "color": "#0ea5e9",
            "items": [
              "Pros: Personalized learning paths, 24/7 instant AI tutoring, automated grading",
              "Cons: Plagiarism & academic dishonesty, over-reliance, lack of emotional empathy",
              "Conclusion: AI serves as an empowering copilot, cannot replace human educators"
            ]
          },
          {
            "id": "edu-p3-discipline",
            "title": "Student Misbehavior & Discipline (special-speaking-part3-4, speaking-part3-9):",
            "color": "#0ea5e9",
            "items": [
              "Root causes: Peer pressure, academic burnout, lack of parental guidance",
              "Ineffective: Harsh physical punishment induces resentment & rebellion",
              "Constructive solutions: Counseling sessions, positive reinforcement, community service"
            ]
          },
          {
            "id": "edu-p3-global",
            "title": "Foreign Languages & Studying Abroad (speaking-part3-11, hcmue10-part3-1):",
            "color": "#0ea5e9",
            "items": [
              "Cognitive benefits: Delay dementia, sharpen multitask problem-solving abilities",
              "Career advantages: Competitive edge in multinational corporations, global networking",
              "Studying abroad: Cultural immersion, self-reliance, adapt to diverse viewpoints"
            ]
          },
          {
            "id": "edu-p3-library",
            "title": "Public Libraries in Digital Era (speaking-part3-12, vlu10-part3-14):",
            "color": "#0ea5e9",
            "items": [
              "Perception: Digitized search engines make traditional archives seem obsolete",
              "Enduring value: Democratic access to knowledge, tranquil study space, community hub"
            ]
          }
        ]
      },
      {
        "id": "edu-vocab",
        "title": "Từ vựng & Khung ARE Dùng Chung (B2-C1)",
        "badge": "Core Bank",
        "tags": [
          "Collocations B2-C1",
          "Khung ARE vạn năng",
          "Speaking & Writing"
        ],
        "color": "#10b981",
        "children": [
          {
            "id": "edu-vocab-academic",
            "title": "Academic & Pedagogical Lexicon:",
            "color": "#10b981",
            "items": [
              "academic curriculum, pedagogical methodology, learner-oriented approach",
              "autonomous learner, critical thinking skills, lifelong learning mindset",
              "extracurricular activities, holistic education, well-rounded individual"
            ]
          },
          {
            "id": "edu-vocab-are",
            "title": "Khung ARE Vạn Năng (Universal Skeleton):",
            "color": "#10b981",
            "items": [
              "Point (A): Prioritize interactive, experiential learning over passive memorization",
              "Reason (R): Stimulate cognitive curiosity & enhance long-term knowledge retention",
              "Example (E): Real-world project assignments equip students with career-ready skillsets"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "health",
    "title": "Health & Lifestyle",
    "vietnameseTitle": "Sức khỏe, Ăn uống & Lối sống",
    "description": "Tổng hợp 31 đề thi thật VSTEP (P1, P2, P3), dinh dưỡng, thể thao, phòng ngừa bệnh béo phì và cân bằng cuộc sống.",
    "icon": "HeartPulse",
    "centerNode": {
      "title": "Health & Lifestyle",
      "subtitle": "Sức khỏe, Ăn uống & Lối sống",
      "categoryBadge": "VSTEP Topic Hub 2 (31 đề)"
    },
    "leftBranches": [
      {
        "id": "health-p1",
        "title": "Part 1: Thói quen Ăn uống & Thể thao (19 đề)",
        "badge": "Part 1",
        "tags": [
          "19 đề thi thật",
          "Sở thích ẩm thực",
          "Thói quen sinh hoạt"
        ],
        "color": "#f97316",
        "children": [
          {
            "id": "health-p1-diet",
            "title": "Beverages & Dietary Choices (speaking-part1-9, speaking-part1-10, dthu10-part1-1):",
            "color": "#f97316",
            "items": [
              "Green tea vs milk tea: Antioxidants & metabolism booster vs high sugar & additives",
              "Vegetarian diet: Lower cholesterol, ethical benefits, nutrient balance concerns",
              "Eating out vs homemade meals: Convenience & social vibe vs nutritional control"
            ]
          },
          {
            "id": "health-p1-habits",
            "title": "Physical Activity & Taking Breaks (speaking-part1-3, speaking-part1-30, vlu10-part1-13):",
            "color": "#f97316",
            "items": [
              "Daily exercise: Cycling, jogging, gym workouts for cardiovascular stamina",
              "Taking breaks: Short mental intermissions prevent burnout & recharge energy",
              "Medical check-ups: Regular health screenings detect chronic diseases early"
            ]
          }
        ]
      },
      {
        "id": "health-p2",
        "title": "Part 2: Tình huống Lựa chọn Sinh hoạt (2 đề)",
        "badge": "Part 2",
        "tags": [
          "2 tình huống thi thật",
          "Gặp gỡ bạn bè",
          "Hoạt động gắn kết"
        ],
        "color": "#8b5cf6",
        "children": [
          {
            "id": "health-p2-dine",
            "title": "Choosing a Place to Dine with Friends (speaking-part2-3, ueh10-part2-1):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Fast food restaurant (cheap & quick, but high calorie and greasy)",
              "Option B: Traditional Vietnamese buffet (cozy, diverse wholesome nutritious dishes)",
              "Option C (Optimal): Rooftop casual bistro (great atmosphere, healthy organic options)"
            ]
          },
          {
            "id": "health-p2-teamwork",
            "title": "Colleague Team-Building Activity (speaking-part2-9, vlu10-part2-5):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Karaoke night (fun but loud and passive drinking)",
              "Option B: Luxury dinner (expensive with limited active communication)",
              "Option C (Optimal): Outdoor sports day / hiking trip (boosts stamina & team spirit)"
            ]
          }
        ]
      }
    ],
    "rightBranches": [
      {
        "id": "health-p3",
        "title": "Part 3: Tranh luận & Y tế Cộng đồng (10 đề)",
        "badge": "Part 3",
        "tags": [
          "10 chủ đề vĩ mô",
          "Vấn nạn béo phì",
          "Work-life balance"
        ],
        "color": "#0ea5e9",
        "children": [
          {
            "id": "health-p3-obesity",
            "title": "Tackling the Obesity Epidemic (speaking-part3-15, vlu10-part3-7, vlu10-part3-13):",
            "color": "#0ea5e9",
            "items": [
              "Underlying causes: Sedentary lifestyle, excessive screen time, proliferation of fast food",
              "Childhood risks: Type-2 diabetes, hypertension, low self-esteem & social stigma",
              "Remedies: Mandatory physical education, tax on sugary beverages, parental role-modeling"
            ]
          },
          {
            "id": "health-p3-sports",
            "title": "Team Sports & Proper Exercise (vlu10-part3-5, speaking-part3-16):",
            "color": "#0ea5e9",
            "items": [
              "Team sports benefits: Camaraderie, strategic communication, resilience under pressure",
              "Improper workout hazards: Muscle tears, joint injuries from overtraining without warmup",
              "Solution: Seek professional coaching & listen to biological signals"
            ]
          },
          {
            "id": "health-p3-balance",
            "title": "Work-Life Balance & Stress Relief (speaking-part3-18, speaking-part3-19):",
            "color": "#0ea5e9",
            "items": [
              "Chronic work stress leads to cardiovascular ailments & depression",
              "The power of staying calm: Mindfulness meditation, breathing exercises, emotional balance"
            ]
          }
        ]
      },
      {
        "id": "health-vocab",
        "title": "Từ vựng & Khung ARE Sức khỏe (B2-C1)",
        "badge": "Core Bank",
        "tags": [
          "Collocations B2-C1",
          "Khung ARE vạn năng",
          "Dinh dưỡng & Thể lực"
        ],
        "color": "#10b981",
        "children": [
          {
            "id": "health-vocab-words",
            "title": "Health & Nutrition Lexicon:",
            "color": "#10b981",
            "items": [
              "balanced & nutritious diet, sedentary lifestyle, physical stamina & endurance",
              "cardiovascular health, mental well-being, release endorphins, metabolism",
              "burn calories, ward off chronic diseases, alleviate mental exhaustion"
            ]
          },
          {
            "id": "health-vocab-are",
            "title": "Khung ARE Vạn Năng (Universal Skeleton):",
            "color": "#10b981",
            "items": [
              "Point (A): Adopt regular physical activity and a whole-food diet",
              "Reason (R): Strengthen immune defenses and stimulate mood-boosting endorphins",
              "Example (E): 30 minutes of aerobic exercise daily reduces risks of lifestyle-related ailments"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "technology",
    "title": "Technology & AI",
    "vietnameseTitle": "Công nghệ, Thiết bị số & Mạng xã hội",
    "description": "Tổng hợp 17 đề thi thật VSTEP (P1, P2, P3), trí tuệ nhân tạo (AI), điện thoại thông minh, sáng tạo nội dung số & an toàn mạng.",
    "icon": "Cpu",
    "centerNode": {
      "title": "Technology & AI",
      "subtitle": "Công nghệ, Mạng xã hội & AI",
      "categoryBadge": "VSTEP Topic Hub 3 (17 đề)"
    },
    "leftBranches": [
      {
        "id": "tech-p1",
        "title": "Part 1: Thiết bị & Thói quen Số (9 đề)",
        "badge": "Part 1",
        "tags": [
          "9 đề thi thật",
          "Smartphone & AI",
          "Mua sắm online"
        ],
        "color": "#f97316",
        "children": [
          {
            "id": "tech-p1-devices",
            "title": "Smartphones & Wearable Gadgets (speaking-part1-2, vlu10-part1-15, ueh10-part1-1):",
            "color": "#f97316",
            "items": [
              "Smartwatch utilities: Track heart rate, monitor sleep quality, count daily steps",
              "Smartphone dependency: Screen time management, notification fatigue",
              "Preferred brands: Apple vs Samsung (ecosystem synchronization vs customizability)"
            ]
          },
          {
            "id": "tech-p1-online",
            "title": "Online Shopping & AI Perception (vlu10-part1-11, vlu10-part1-14, speaking-part1-18):",
            "color": "#f97316",
            "items": [
              "E-commerce: Convenience, price comparison, home delivery vs counterfeit risk",
              "AI perception: Fascination with generative AI vs concerns over job displacement"
            ]
          }
        ]
      },
      {
        "id": "tech-p2",
        "title": "Part 2: Xử lý Tình huống Công nghệ (1 đề)",
        "badge": "Part 2",
        "tags": [
          "1 tình huống thi thật",
          "Ngân hàng số",
          "Xử lý sự cố"
        ],
        "color": "#8b5cf6",
        "children": [
          {
            "id": "tech-p2-banking",
            "title": "Wrong Bank Transfer Incident (speaking-part2-13):",
            "color": "#8b5cf6",
            "items": [
              "Situation: Waking up to find a huge amount of money wrongly transferred to your account",
              "Option A: Keep quiet and spend the money (illegal & criminal liability)",
              "Option B: Contact the sender directly via memo (risk of phishing scam)",
              "Option C (Optimal): Freeze amount & notify bank support and police immediately"
            ]
          }
        ]
      }
    ],
    "rightBranches": [
      {
        "id": "tech-p3",
        "title": "Part 3: Tranh luận Công nghệ & Tác động (7 đề)",
        "badge": "Part 3",
        "tags": [
          "7 chủ đề vĩ mô",
          "Trí tuệ nhân tạo",
          "Giao tiếp mạng xã hội"
        ],
        "color": "#0ea5e9",
        "children": [
          {
            "id": "tech-p3-media",
            "title": "Social Media & Content Creation (speaking-part3-5, vlu10-part3-3):",
            "color": "#0ea5e9",
            "items": [
              "Short-form videos (TikTok/Reels): Democratize self-expression & digital entrepreneurship",
              "Dark side: Shortened attention spans, sensationalism, cyberbullying & unrealistic beauty standards"
            ]
          },
          {
            "id": "tech-p3-communication",
            "title": "Face-to-Face vs Virtual Interaction (speaking-part3-7, vlu10-part3-12):",
            "color": "#0ea5e9",
            "items": [
              "Virtual chats: Geographically convenient, instant messaging, multimedia sharing",
              "Face-to-face supremacy: Non-verbal cues, micro-expressions, genuine emotional resonance"
            ]
          },
          {
            "id": "tech-p3-schools",
            "title": "Banning Mobile Phones in Classrooms (speaking-part3-6):",
            "color": "#0ea5e9",
            "items": [
              "Arguments for: Eliminates digital distractions, reduces cheating, boosts focus",
              "Arguments against: Mobile devices act as interactive digital research tools when guided"
            ]
          }
        ]
      },
      {
        "id": "tech-vocab",
        "title": "Từ vựng & Khung ARE Công nghệ (B2-C1)",
        "badge": "Core Bank",
        "tags": [
          "Collocations B2-C1",
          "Khung ARE vạn năng",
          "AI & An toàn số"
        ],
        "color": "#10b981",
        "children": [
          {
            "id": "tech-vocab-words",
            "title": "Technology & AI Lexicon:",
            "color": "#10b981",
            "items": [
              "cutting-edge technology, artificial intelligence, digital distraction, screen addiction",
              "streamline workflow, algorithmic recommendation, cyber hygiene & privacy",
              "information overload, technological literacy, virtual connectivity"
            ]
          },
          {
            "id": "tech-vocab-are",
            "title": "Khung ARE Vạn Năng (Universal Skeleton):",
            "color": "#10b981",
            "items": [
              "Point (A): Leverage technological tools while establishing strict digital boundaries",
              "Reason (R): Maximize productivity without compromising cognitive depth and real-world relationships",
              "Example (E): Using AI as a brainstorming assistant while verifying facts critically"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "work",
    "title": "Work & Career",
    "vietnameseTitle": "Công việc, Sự nghiệp & Tài chính",
    "description": "Tổng hợp 15 đề thi thật VSTEP (P1, P2, P3), kỹ năng công sở, quản lý tài chính, khởi nghiệp và lựa chọn cơ hội nghề nghiệp.",
    "icon": "Briefcase",
    "centerNode": {
      "title": "Work & Career",
      "subtitle": "Sự nghiệp & Tài chính",
      "categoryBadge": "VSTEP Topic Hub 4 (15 đề)"
    },
    "leftBranches": [
      {
        "id": "work-p1",
        "title": "Part 1: Công việc & Tiết kiệm Tiền (3 đề)",
        "badge": "Part 1",
        "tags": [
          "3 đề thi thật",
          "Quản lý tài chính",
          "Môi trường làm việc"
        ],
        "color": "#f97316",
        "children": [
          {
            "id": "work-p1-finance",
            "title": "Saving Money & Financial Habits (speaking-part1-1):",
            "color": "#f97316",
            "items": [
              "Saving importance: Emergency fund for unforeseen crises, financial independence",
              "Impulse spending: Wasting money on transient fads, designer items, daily luxuries",
              "Effective budgeting: The 50/30/20 rule, automated savings, tracking mobile expenses"
            ]
          },
          {
            "id": "work-p1-workplace",
            "title": "Ideal Workplace & Career Aspirations (speaking-part1-4, speaking-part1-25):",
            "color": "#f97316",
            "items": [
              "Physical environment: Ergonomic furniture, natural lighting, flexible hybrid arrangement",
              "Corporate ethos: Supportive colleagues, transparent management, merit-based promotion"
            ]
          }
        ]
      },
      {
        "id": "work-p2",
        "title": "Part 2: Lựa chọn Lời mời & Đồng nghiệp (5 đề)",
        "badge": "Part 2",
        "tags": [
          "5 tình huống thi thật",
          "3 lời mời làm việc",
          "Văn hóa công sở"
        ],
        "color": "#8b5cf6",
        "children": [
          {
            "id": "work-p2-offers",
            "title": "Choosing Among Three Job Offers (vlu10-part2-2):",
            "color": "#8b5cf6",
            "items": [
              "Offer A: High salary but high stress and lengthy daily commute (20km)",
              "Offer B: Moderate pay at a prestigious multinational with stellar promotion prospects",
              "Offer C: Modest salary near home with relaxed hours (comfort zone trap)",
              "Optimal choice: Offer B for sustainable career advancement trajectory"
            ]
          },
          {
            "id": "work-p2-gifts",
            "title": "Farewell / Retirement Gift for Colleague (vlu10-part2-1, vlu10-part2-7, speaking-part2-4):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Expensive wrist watch (formal but generic and costly)",
              "Option B: High-end tech gadget (functional but rapidly depreciates)",
              "Option C (Optimal): Personalized photo scrapbook + heartfelt group message (sentimental & timeless)"
            ]
          },
          {
            "id": "work-p2-wellness",
            "title": "Career in Health and Wellness (vlu10-part2-8):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Clinical nutritionist (scientific & academic)",
              "Option B: Personal fitness trainer (interactive & hands-on)",
              "Option C: Corporate wellness consultant (growing industry demand)"
            ]
          }
        ]
      }
    ],
    "rightBranches": [
      {
        "id": "work-p3",
        "title": "Part 3: Thị trường Lao động & Kỹ năng (7 đề)",
        "badge": "Part 3",
        "tags": [
          "7 chủ đề vĩ mô",
          "Khởi nghiệp",
          "Thất nghiệp giới trẻ"
        ],
        "color": "#0ea5e9",
        "children": [
          {
            "id": "work-p3-skills",
            "title": "Soft Skills vs Hard Qualifications (speaking-part3-20):",
            "color": "#0ea5e9",
            "items": [
              "Hard skills get you the interview; soft skills determine career longevity",
              "Top competencies: Emotional intelligence (EQ), adaptability, conflict negotiation"
            ]
          },
          {
            "id": "work-p3-startup",
            "title": "Self-Employment & Entrepreneurship (speaking-part3-21, ueh10-part3-1):",
            "color": "#0ea5e9",
            "items": [
              "Merits: Autonomous decision-making, uncapped earning potential, fulfilling vision",
              "Risks: Financial volatility, continuous stress, high startup failure rates"
            ]
          },
          {
            "id": "work-p3-unemployment",
            "title": "Youth Unemployment & Job Choice (speaking-part3-23, vlu10-part3-9):",
            "color": "#0ea5e9",
            "items": [
              "Factors influencing job choice: Remuneration vs passionate alignment vs work-life balance",
              "Solutions for unemployment: Vocational re-skilling, government startup incubators"
            ]
          }
        ]
      },
      {
        "id": "work-vocab",
        "title": "Từ vựng & Khung ARE Sự nghiệp (B2-C1)",
        "badge": "Core Bank",
        "tags": [
          "Collocations B2-C1",
          "Khung ARE vạn năng",
          "Lương bổng & Cơ hội"
        ],
        "color": "#10b981",
        "children": [
          {
            "id": "work-vocab-words",
            "title": "Workplace & Career Lexicon:",
            "color": "#10b981",
            "items": [
              "career advancement trajectory, job satisfaction & remuneration, corporate culture",
              "financial autonomy, entrepreneurial acumen, professional networking, merit-based",
              "resilience under pressure, youth unemployment, work ethic, lucrative salary"
            ]
          },
          {
            "id": "work-vocab-are",
            "title": "Khung ARE Vạn Năng (Universal Skeleton):",
            "color": "#10b981",
            "items": [
              "Point (A): Assess employment opportunities based on long-term professional growth",
              "Reason (R): Technical skills evolve rapidly; versatile learning cultures ensure enduring market value",
              "Example (E): Choosing a role with mentorship and continuous training outperforms immediate wage premiums"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "society",
    "title": "Environment & Society",
    "vietnameseTitle": "Môi trường, Đô thị & Đời sống Xã hội",
    "description": "Tổng hợp 55 đề thi thật VSTEP (P1, P2, P3), bảo vệ môi trường, xe điện (EVs), giao thông đô thị, thú cưng, gia đình & phòng chống tội phạm.",
    "icon": "Trees",
    "centerNode": {
      "title": "Environment & Society",
      "subtitle": "Môi trường, Đô thị & Xã hội",
      "categoryBadge": "VSTEP Topic Hub 5 (55 đề)"
    },
    "leftBranches": [
      {
        "id": "soc-p1",
        "title": "Part 1: Đời sống Cộng đồng & Gia đình (26 đề)",
        "badge": "Part 1",
        "tags": [
          "26 đề thi thật",
          "Giao thông & Thú cưng",
          "Quan hệ gia đình"
        ],
        "color": "#f97316",
        "children": [
          {
            "id": "soc-p1-environment",
            "title": "Greenery, Pets & Waste Reduction (speaking-part1-28, vlu10-part1-10, vlu10-part1-16):",
            "color": "#f97316",
            "items": [
              "Pets: Companionship, teaches children empathy, stress reduction",
              "Greenery & plants: Air purification, aesthetic tranquility, connects with nature",
              "Recycling: Segregating domestic waste, minimizing single-use plastics"
            ]
          },
          {
            "id": "soc-p1-traffic",
            "title": "Commuting & Traffic Bottlenecks (speaking-part1-32, vlu10-part1-23):",
            "color": "#f97316",
            "items": [
              "Daily commute: Motorbikes vs public buses vs electric scooters",
              "Traffic jams: Rush-hour congestion, air and noise pollution, travel delays"
            ]
          },
          {
            "id": "soc-p1-family",
            "title": "Family & Neighborhood Bonds (speaking-part1-5, vlu10-part1-3, lhu10-part1-1):",
            "color": "#f97316",
            "items": [
              "Family responsibilities: Household chores distribution, intergenerational mutual support",
              "Hometown atmosphere: Friendly neighbors, slower pace of life vs metropolitan bustle"
            ]
          }
        ]
      },
      {
        "id": "soc-p2",
        "title": "Part 2: Giải quyết Vấn đề Xã hội (13 đề)",
        "badge": "Part 2",
        "tags": [
          "13 tình huống thi thật",
          "Kẹt xe & Du lịch",
          "Quyết định gia đình"
        ],
        "color": "#8b5cf6",
        "children": [
          {
            "id": "soc-p2-traffic",
            "title": "Measures to Mitigate Traffic Congestion (speaking-part2-12, vlu10-part2-13):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Widen existing roads (prohibitively expensive, induces more demand)",
              "Option B: Heavy congestion charges on private vehicles entering downtown",
              "Option C (Optimal): Subsidize and expand clean rapid transit systems (metro/bus)"
            ]
          },
          {
            "id": "soc-p2-tourism",
            "title": "Attracting Foreign Tourists & Trips (vlu10-part2-15, speaking-part2-10, lhu10-part2-1):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Mass commercial entertainment resorts (erodes local heritage)",
              "Option B: Discount vouchers and cheaper hospitality tariffs",
              "Option C (Optimal): Promote authentic culinary eco-tourism & preserved cultural sites"
            ]
          },
          {
            "id": "soc-p2-pet",
            "title": "Choosing a Pet for a Child (vlu10-part2-10):",
            "color": "#8b5cf6",
            "items": [
              "Option A: Kitten (independent, low maintenance)",
              "Option B: Dog (loyal, active, requires daily walks and obedience training)",
              "Option C: Aquarium fish (easy, soothing, limited interactive bonding)"
            ]
          }
        ]
      }
    ],
    "rightBranches": [
      {
        "id": "soc-p3",
        "title": "Part 3: Chính sách & Tác động Vĩ mô (16 đề)",
        "badge": "Part 3",
        "tags": [
          "16 chủ đề vĩ mô",
          "Xe điện (EVs)",
          "Tội phạm & Môi trường"
        ],
        "color": "#0ea5e9",
        "children": [
          {
            "id": "soc-p3-evs",
            "title": "Electric Vehicles & Green Transition (speaking-part3-1, speaking-part3-2):",
            "color": "#0ea5e9",
            "items": [
              "EVs advantages: Zero tailpipe emissions, silent operation, reduced reliance on fossil fuels",
              "Challenges: Battery disposal hazards, charging station shortages, coal-based electricity generation"
            ]
          },
          {
            "id": "soc-p3-crime",
            "title": "Combating Urban Crime (speaking-part3-24, vlu10-part3-16):",
            "color": "#0ea5e9",
            "items": [
              "Interventions: Installing HD surveillance cameras, expanding nocturnal police patrols",
              "Socio-economic cure: Alleviate poverty, provide vocational youth education, community policing"
            ]
          },
          {
            "id": "soc-p3-heritage",
            "title": "Preserving Culture & Traditional Festivals (speaking-part3-25, speaking-part3-28):",
            "color": "#0ea5e9",
            "items": [
              "Threats: Commercialization, youth Westernization, loss of historical storytelling",
              "Preservation: Government arts funding, school cultural curricula, living heritage exhibitions"
            ]
          }
        ]
      },
      {
        "id": "soc-vocab",
        "title": "Từ vựng & Khung ARE Môi trường (B2-C1)",
        "badge": "Core Bank",
        "tags": [
          "Collocations B2-C1",
          "Khung ARE vạn năng",
          "Đô thị & Sinh thái"
        ],
        "color": "#10b981",
        "children": [
          {
            "id": "soc-vocab-words",
            "title": "Environment & Urban Lexicon:",
            "color": "#10b981",
            "items": [
              "environmental sustainability, eco-friendly transit, urban traffic congestion",
              "civic responsibility, community cohesion, carbon footprint, crime prevention",
              "cultural heritage preservation, green infrastructure, mitigate climate change"
            ]
          },
          {
            "id": "soc-vocab-are",
            "title": "Khung ARE Vạn Năng (Universal Skeleton):",
            "color": "#10b981",
            "items": [
              "Point (A): Invest in eco-friendly infrastructure and public awareness campaigns",
              "Reason (R): Sustainable urban policies protect biodiversity while improving citizen living standards",
              "Example (E): Integrating electric bus networks curbs tailpipe pollution and relieves traffic gridlock"
            ]
          }
        ]
      }
    ]
  }
];
