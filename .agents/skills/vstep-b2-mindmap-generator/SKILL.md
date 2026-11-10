---
name: vstep-b2-mindmap-generator
description: Hướng dẫn quy trình thiết kế, chuẩn hóa và tối ưu hệ thống Mindmap VSTEP B2 theo cơ chế "Từ Vựng Dùng Chung Cấp Nhánh + Chuỗi Bậc Thang Kế Thừa (Point -> This is mainly because -> This means that -> Example)" kết hợp 5 Template Writing Task 2, 6 Dạng Thư Writing Task 1 và Speaking Part 2 & 3.
---

# VSTEP B2 Mindmap Generator Skill (Cơ Chế Kế Thừa & Lắp Ráp Template)

## 1. Triết Lý Cốt Lõi: "Học Ít – Kế Thừa Sâu – Dùng Cho Mọi Kỹ Năng"

Tuyệt đối **KHÔNG** tạo ra hàng trăm chủ đề vụn vặt với những câu văn dài 30–40 từ rời rạc, khó thuộc, hoặc lặp lại ý giữa danh sách câu và khung A-R-E. Hệ thống Mindmap phải vận hành theo **Cơ Chế Kế Thừa 3 Tầng (3-Tier Inheritance)**:

1. **Tầng 1 – Kho Từ Vựng Dùng Chung Của Chủ Đề Lớn (`branch.keywords`)**:
   * Đặt ở đầu mỗi Nhánh Lớn (gồm 20–40 từ/cụm từ cốt lõi).
   * Ví dụ chủ đề **Work & Career (Job Hugging)**: `job hugging`, `comfort zone`, `career stagnation`, `job security`, `fear of change`, `skill building`, `market value`, `opportunity cost`, `growth mindset`, `burnout`, `work-life balance`, `upward mobility`, `proactive mindset`, `personal fulfillment`...
   * Toàn bộ các chủ đề con bên dưới **phải tái sử dụng** chính các từ vựng này để người học nhìn nhiều lần là tự thuộc.

2. **Tầng 2 – Công Thức Triển Khai Ý Bậc Thang (5 Cấu Trúc Xương Sống)**:
   Mọi luận điểm trong Mindmap đều phải viết theo chuỗi 3–4 câu ngắn gọn, nối tiếp nhau bằng 5 cấu trúc cố định:
   * **Bước 1 (Nêu Luận Điểm):**
     * `One major reason is that + S + V` *(Một lý do chính là...)*
     * `Furthermore, + S + V` *(Hơn nữa...)*
     * `One contributing factor is that + S + V` *(Một yếu tố góp phần là...)*
   * **Bước 2 (Giải Thích Nguyên Nhân):**
     * `This is mainly because + S + V` *(Điều này chủ yếu là do...)*
   * **Bước 3 (Làm Rõ Hệ Quả / Ý Nghĩa):**
     * `This means that + S + V` *(Điều này có nghĩa là...)*
   * **Bước 4 (Ví Dụ Thực Tế - Hồ Sơ Thạc Sĩ CNTT / Đời Sống):**
     * `For example, + S + V` *(Ví dụ...)*

3. **Tầng 3 – Khả Năng Tái Sử Dụng Đa Năng (1 Chuỗi Ý = 3 Bài Thi)**:
   Mỗi chủ đề cốt lõi trong Mindmap được chia làm **4 Nhánh Kế Thừa Rõ Ràng** để lắp vừa khít vào cả **Writing Task 2 (5 Dạng)**, **Speaking Part 2** và **Speaking Part 3**:
   * **Nhánh 1 (Lợi ích / Lý do ủng hộ 1):** `One major reason/benefit is that... This is mainly because... This means that...` ➔ *Dùng cho Body 1 (Agree / Advantages), Lý do chọn Option A (Speaking P2), Ý 1 (Speaking P3)*.
   * **Nhánh 2 (Lợi ích / Lý do ủng hộ 2):** `Furthermore, another key advantage is that... This is mainly because... This means that...` ➔ *Dùng cho Body 1 ý 2 (Agree / Advantages), Lý do phụ chọn Option A (Speaking P2), Ý 2 (Speaking P3)*.
   * **Nhánh 3 (Mặt trái / Nguyên nhân / Vấn đề):** `On the other hand, one contributing factor / drawback is that... This is mainly because... This means that...` ➔ *Dùng cho Body 2 (Disadvantages), Body 1 (Causes / Problems / Effects), hoặc Lý do bác bỏ Option B, C (Speaking P2)*.
   * **Nhánh 4 (Giải pháp khắc phục):** `In my opinion, the best approach to overcome this is that... This means that...` ➔ *Dùng cho Body 2 (Solutions trong Cause-Solution, Problem-Solution, Effects-Solution) và câu hỏi Follow-up (Speaking P3)*.

---

## 2. Quy Chuẩn Cho Chuyên Mục Writing Task 1 (6 Dạng Thư Chức Năng)

Writing Task 1 được tổ chức thành 1 Hub riêng biệt (`letters.json`) gồm đúng **6 Dạng Thư**:
1. **Apology Letter (Thư Xin Lỗi)**
2. **Thank-You Letter (Thư Cảm Ơn)**
3. **Request Letter (Thư Yêu Cầu / Hỏi Thông Tin)**
4. **Information Letter (Thư Thông Báo / Cung Cấp Thông Tin)**
5. **Complaint Letter (Thư Phàn Nàn Dịch Vụ)**
6. **Advice & Invitation Letter (Thư Tư Vấn & Mời Bạn Bè)**

Mỗi dạng thư bắt buộc có:
* **6 Mẫu Câu Hữu Ích (`items`)**: Song ngữ Anh – Việt, ngắn gọn, chuẩn mực, học thuộc để lắp thẳng vào thư.
* **Đề Bài Minh Họa (`samplePrompt` / `areSkeleton`)**: Đề thi thực tế có 3 dấu chấm yêu cầu (bullet points).
* **Bài Viết Mẫu Hoàn Chỉnh (`sampleLetter`)**: Đúng bố cục thư VSTEP (`Dear ..., Mở bài nêu mục đích, Thân bài giải quyết 3 yêu cầu, Kết bài lịch sự, Sign-off`).

---

## 3. Quy Chuẩn Cho 5 Dạng Template Writing Task 2

Mọi chuỗi ý trong Mindmap phải lắp khớp trực tiếp vào 5 khung bài luận tại [`src/data/theme/writing.part2.md`](file:///d:/8-vstep/vstep/src/data/theme/writing.part2.md):
1. **Dạng 1 – Agree / Disagree**: Lắp Nhánh 1 + Nhánh 2 + Ví dụ IT.
2. **Dạng 2 – Advantages / Disadvantages**: Đoạn 1 lắp Nhánh 1 & 2; Đoạn 2 lắp Nhánh 3.
3. **Dạng 3 – Cause / Solution**: Đoạn 1 lắp Nhánh 3 (Causes); Đoạn 2 lắp Nhánh 4 (Solutions).
4. **Dạng 4 – Problem / Solution**: Đoạn 1 lắp Nhánh 3 (Problems); Đoạn 2 lắp Nhánh 4 (Solutions).
5. **Dạng 5 – Effects / Solution**: Đoạn 1 lắp Nhánh 3 (Effects); Đoạn 2 lắp Nhánh 4 (Solutions).

---

## 4. Cấu Trúc JSON Schema Chuẩn Cho Mindmap (`src/data/mindmap/*.json`)

```json
{
  "id": "work",
  "title": "Work, Career & Job Hugging",
  "vietnameseTitle": "Công việc, Sự nghiệp & Tài chính",
  "branches": [
    {
      "id": "work-branch-1",
      "title": "Career Choices, Job Hugging & Workplace Skills",
      "viTitle": "Lựa chọn Sự nghiệp, Bám trụ Công việc & Kỹ năng Đi làm",
      "keywords": [
        { "word": "job hugging", "meaning": "bám giữ công việc hiện tại, không muốn thay đổi" },
        { "word": "comfort zone", "meaning": "vùng an toàn" },
        { "word": "career stagnation", "meaning": "sự trì trệ trong sự nghiệp" },
        { "word": "job security", "meaning": "sự an toàn nghề nghiệp" }
      ],
      "children": [
        {
          "id": "work-job-hugging-self-employed",
          "title": "Bám trụ Công việc vs Tự kinh doanh / Nhảy việc (Job Hugging vs Self-Employment & Job Hopping)",
          "viTitle": "Áp dụng cho: Agree/Disagree, Adv/Disadv (Task 2) | Chọn công ty/nghề nghiệp (Speaking P2, P3)",
          "examTags": [
            "Task 2 (Adv/Disadv): Staying in the Same Job vs Changing Jobs / Self-Employment",
            "Speaking P2: Choosing Between a Startup, a Big Company, or Freelancing",
            "Speaking P3: Benefits of Working Independently / Self-Employment"
          ],
          "keywords": [
            { "word": "job security", "meaning": "sự an toàn nghề nghiệp" },
            { "word": "comfort zone", "meaning": "vùng an toàn" },
            { "word": "career stagnation", "meaning": "sự trì trệ trong sự nghiệp" },
            { "word": "growth mindset", "meaning": "tư duy phát triển" },
            { "word": "upward mobility", "meaning": "cơ hội thăng tiến" }
          ],
          "items": [
            {
              "id": "w-1",
              "badge": "✅ Nhánh 1: Ưu điểm Ổn định / Bám việc (Point ➔ Why ➔ Meaning)",
              "text": "One major reason is that permanent office jobs provide high job security and stable monthly income. This is mainly because employees have a fear of change and prefer staying in their comfort zone. This means that they can easily pay family bills without worrying about business failure.",
              "viText": "Một lý do chính là công việc văn phòng cố định mang lại sự an toàn nghề nghiệp cao và thu nhập ổn định. Điều này chủ yếu là do nhân viên sợ sự thay đổi và thích ở trong vùng an toàn. Điều này có nghĩa là họ dễ dàng lo chi phí gia đình mà không sợ phá sản."
            },
            {
              "id": "w-2",
              "badge": "✅ Nhánh 2: Ưu điểm Tự làm chủ / Nhảy việc (Furthermore ➔ Why ➔ Meaning)",
              "text": "Furthermore, self-employment and career transitions promote continuous learning and personal fulfillment. This is mainly because workers must adopt a proactive mindset and build new skills. This means that they can increase their market value and enjoy greater upward mobility.",
              "viText": "Hơn nữa, tự làm chủ và chuyển đổi công việc thúc đẩy sự học hỏi không ngừng và thỏa mãn cá nhân. Điều này chủ yếu là do người lao động phải có tư duy chủ động và phát triển kỹ năng mới. Điều này có nghĩa là họ nâng cao được giá trị thị trường và cơ hội thăng tiến."
            },
            {
              "id": "w-3",
              "badge": "⚠️ Nhánh 3: Mặt trái / Nguyên nhân trì trệ (Cause / Problem / Drawback)",
              "text": "On the other hand, one contributing factor to career stagnation is complacency and loss aversion. This is mainly because clinging to an old job for too long reduces adaptability. This means that workers may suffer from burnout and disengagement when facing technological changes.",
              "viText": "Mặt khác, một yếu tố dẫn đến sự trì trệ sự nghiệp là sự an phận và tâm lý sợ mất mát. Điều này chủ yếu là do bám chặt lấy công việc cũ quá lâu làm giảm khả năng thích nghi. Điều này có nghĩa là người lao động dễ bị kiệt sức và mất hứng thú trước thay đổi công nghệ."
            },
            {
              "id": "w-4",
              "badge": "💡 Nhánh 4: Giải pháp & Ví dụ Thực tế (Solution & IT Example)",
              "text": "In my opinion, the best approach is to balance job security with continuous skill building. For example, as an IT specialist, I keep my full-time software job for stable income while taking freelance coding projects on weekends to sharpen my professional development.",
              "viText": "Theo tôi, hướng đi tốt nhất là cân bằng giữa sự ổn định công việc và việc phát triển kỹ năng liên tục. Ví dụ, là một chuyên viên IT, tôi vừa giữ công việc phần mềm toàn thời gian để có thu nhập ổn định, vừa nhận các dự án code tự do cuối tuần để phát triển chuyên môn."
            }
          ],
          "areSkeleton": {
            "answer": "Speaking P2 (Chọn Công ty lớn ổn định): I would choose working at a big established company because it offers high job security and professional training.",
            "answerVi": "Speaking P2 (Chọn Công ty lớn): Tôi chọn làm ở công ty lớn vì nó mang lại sự an toàn nghề nghiệp cao và đào tạo bài bản.",
            "reason": "Speaking P2 (Loại Freelance / Startup): On the other hand, I would not choose freelancing or a risky startup right away because of unstable income and heavy burnout.",
            "reasonVi": "Speaking P2 (Loại Freelance / Startup): Ngược lại, tôi không chọn làm tự do hay startup rủi ro ngay vì thu nhập bấp bênh và dễ kiệt sức.",
            "example": "Task 2 Template Mapping: Dùng Nhánh 1 + 2 cho đề Agree/Disagree & Advantages; Dùng Nhánh 3 + 4 cho đề Disadvantages & Cause/Problem-Solution.",
            "exampleVi": "Cách lắp vào 5 dạng Task 2: Nhánh 1 + 2 lắp vào Thân bài 1 (Ưu điểm/Đồng tình); Nhánh 3 + 4 lắp vào Thân bài 2 (Nhược điểm/Nguyên nhân/Giải pháp)."
          }
        }
      ]
    }
  ]
}
```
