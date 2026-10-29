---
name: vstep-speaking-hint-generator
description: >-
  Hướng dẫn quy trình lập dàn ý gợi ý câu trả lời VSTEP Speaking (Part 1, Part 2, Part 3) theo chuẩn phương pháp cô giáo từ file example-speaking.md. Kích hoạt khi người dùng yêu cầu soạn gợi ý, dàn ý, lập bảng gợi ý cho các đề thi Speaking mới hoặc chỉnh sửa/chuẩn hóa nội dung đề thi.
---

# VSTEP Speaking Hint Generator (Chuẩn Phương Pháp Cô Giáo - example-speaking.md)

Skill này hướng dẫn chi tiết quy trình tạo dàn ý gợi ý trả lời Speaking cho cả 3 phần (Part 1, Part 2, Part 3).
> **Nguyên tắc cốt lõi**:
> 1. Agent **KHÔNG sửa đổi bất kỳ file code giao diện nào** trong `src/app/`.
> 2. **Trực tiếp viết nội dung hoàn chỉnh** vào từng file Markdown trong `src/data/goiy/`. **KHÔNG viết script (Python/JS) để sinh tự động**.
> 3. Tuyệt đối bám sát phong cách, tư duy và chuẩn từ vựng B1–B2 từ file `src/data/example-speaking.md`.

---

## 1. Tư Duy & Hệ Thống Ý Chuẩn Cô Giáo (`example-speaking.md`)

Khi triển khai câu trả lời, luôn tuân thủ công thức 3 bước:
**Trả lời trực diện** ➔ **Mở rộng lý do & Cảm xúc** ➔ **Ví dụ thực tế (Who, What, When, Where, How, Why)**.

### Bộ "khung ý" đa năng chuẩn B1–B2 của cô giáo:
- **Mental health (Sức khỏe tinh thần)**:
  - *relax my mind / recharge my battery / reduce stress / unwind / let my hair down / chill out*
  - *lift up my mood / feel energetic / feel happy and peaceful / avoid burnout*
- **Physical health (Sức khỏe thể chất)**:
  - *stay fit and healthy / keep fit / get into shape / burn calories and fat / strengthen immune system / improve endurance*
- **Social connection (Gắn kết quan hệ)**:
  - *spend quality time with family and friends / strengthen bonds within family / have a friend to talk to (good listener)*
  - *meet like-minded people who share the same interests / make new friends / broaden social network*
- **Knowledge & Skills (Kiến thức & Kỹ năng)**:
  - *gain practical knowledge / broaden horizons / develop soft skills (problem-solving, teamwork, communication)*
  - *become more responsible, independent, caring and thoughtful*
- **Convenience & Finance (Tiện lợi & Chi phí)**:
  - *cheap and affordable / save money / convenient and flexible / easy to access / time-saving*

---

## 2. Chuẩn Từ Vựng & Ngữ Pháp (B1 – B2) - Nghiêm Cấm Từ Đao To Búa Lớn

- **Mục tiêu**: Thí sinh thi VSTEP cần từ vựng tự nhiên, gần gũi, dễ nhớ để bật ra ngay khi nói trong phòng thi.
- ❌ **CẤM TUYỆT ĐỐI các từ vựng học thuật quá nặng (GRE/IELTS C1-C2) hay sáo rỗng**:
  - *Không dùng*: "distraction-free", "quiet sanctuary", "tangible reading experience", "succumb to", "mitigate marital disputes", "formidable legal deterrence", "panacea", "hedonic", "alleviate socioeconomic disparities"...
- ✔️ **DÙNG từ ngữ quen thuộc, tự nhiên**:
  - *Thay bằng*: "quiet place to focus without noise", "read real paper books instead of looking at screens", "relax after a hard-working day", "save a lot of money", "have more time with my family", "avoid arguments at home"...
- 💡 **Tránh số liệu cứng nhắc**:
  - Không gượng ép đưa con số cụ thể (ví dụ: *4 to 5 hours a day*, *100 dollars*...).
  - Ưu tiên trạng từ tần suất và bối cảnh tự nhiên: *almost always / pretty much all day*, *regularly*, *often* gắn liền với ngành nghề thực tế (*as an IT student / working on computers all day*, *office work*).

---

## 3. Cấu Trúc Chi Tiết Theo Từng Phần

### A. Speaking Part 1
Bảng 4 cột: `# | Answer (Lựa chọn) | Reason (Lý do A-R-E) | Example (Ví dụ)`
- **Answer**: Trả lời thẳng vào câu hỏi (*Yes, I am a big fan of...*, *I usually...*, *I prefer...*).
- **Reason**: 2-3 lý do ngắn gọn dựa trên khung ý (mental/physical health, knowledge, convenience).
- **Example**: Chi tiết thực tế (làm với ai, ở đâu, khi nào, tần suất).

### B. Speaking Part 2 (Situation)
Bảng 2 cột: `Option | Lý do`
- **Chọn (1 phương án tối ưu)**:
  - Nêu 2–3 lý do thực tế, đánh vào cảm xúc, sở thích, sự gắn kết, tiện lợi hoặc tiết kiệm chi phí.
  - Sử dụng các cụm từ B1-B2 quen thuộc của cô giáo.
- **Không chọn (2 phương án còn lại)**:
  - Nêu ngắn gọn lý do từ chối: tốn kém (*costly / waste of money*), bất tiện (*inconvenient*), nhàm chán (*boring*), gây áp lực/mệt mỏi (*put under pressure / exhausted*), không phù hợp hoàn cảnh.

### C. Speaking Part 3 (Topic Development & Follow-up Questions)
Bảng 4 cột: `# | Answer (Ý chính & Câu trả lời) | Reason (Lập luận & Phát triển ý) | Example (Ví dụ thực tế)`
- **Hàng 1, 2, 3 (`Ý 1`, `Ý 2`, `Ý 3`)**: Triển khai 3 gợi ý trong Mindmap:
  - Dùng mũi tên suy luận `=>` hoặc gạch đầu dòng rõ ràng.
  - Gắn liền với các lợi ích/tác động cụ thể (sức khỏe, công việc, học tập, cuộc sống).
- **Hàng 4, 5, 6 (`Q1`, `Q2`, `Q3`)**: Trả lời 3 câu hỏi Follow-up:
  - Answer: Trả lời trực diện quan điểm (*Yes / No / I agree / It depends...*).
  - Reason: 2-3 gạch đầu dòng giải thích nguyên nhân/hệ quả dễ hiểu.
  - Example: Ví dụ đời thường, dễ hình dung.

---

## 4. Quy Trình Cập Nhật & Kiểm Tra

1. Đọc kỹ câu hỏi trong `src/data/speaking/<Bộ_Đề>.json`.
2. Trực tiếp viết/sửa file `.md` trong `src/data/goiy/<question_id>.md`.
3. Kiểm tra file `src/data/goiy/goiy.json` để đảm bảo mapping chính xác.
4. Chạy `node src/data/generate_speaking_hubs.cjs` nếu có thay đổi liên quan đến cấu trúc đề thi.
5. Kiểm tra TypeScript (`npx tsc --noEmit`) để đảm bảo không có lỗi hệ thống.
