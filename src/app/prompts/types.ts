import type { ExamCategory } from '@/utils/examPrompts';

export type SkillFilter = 'all' | 'speaking' | 'writing';
export type PartFilter = 'all' | ExamCategory;
export type PromptSortMode = 'newest' | 'oldest' | 'default';

export interface ExportConfig {
  category: 'all' | 'speaking-all' | 'writing-all' | ExamCategory;
  schools: string[]; // empty means all schools
  batches: string[]; // empty means all batches
  includeMetadata: boolean;
  numbering: boolean;
}

export const SCHOOL_DISPLAY_NAMES: Record<string, string> = {
  VLU: 'ĐH Văn Lang (VLU)',
  UEF: 'ĐH Kinh tế - Tài chính TP.HCM (UEF)',
  HANU: 'ĐH Hà Nội (HANU)',
  HCMUE: 'ĐH Sư phạm TP.HCM (HCMUE)',
  HUST: 'ĐH Bách khoa Hà Nội (HUST)',
  UFM: 'ĐH Tài chính - Marketing (UFM)',
  UEH: 'ĐH Kinh tế TP.HCM (UEH)',
  DTHU: 'ĐH Đồng Tháp (DThU)',
  LHU: 'ĐH Lạc Hồng (LHU)',
  BAV: 'Học viện Ngân hàng (BAV)',
  AJC: 'Học viện Báo chí & Tuyên truyền (AJC)',
  DTU: 'ĐH Duy Tân (DTU)',
  USSH: 'ĐH KHXH&NV (USSH)',
  ULIS: 'ĐH Ngoại ngữ - ĐHQGHN (ULIS)',
  CTU: 'ĐH Cần Thơ (CTU)',
};
