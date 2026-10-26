import type { ExamCategory } from '@/utils/examPrompts';

export type SkillFilter = 'all' | 'speaking' | 'writing';
export type PartFilter = 'all' | ExamCategory;

export interface ExportConfig {
  category: 'all' | 'speaking-all' | 'writing-all' | ExamCategory;
  schools: string[]; // empty means all schools
  batches: string[]; // empty means all batches
  includeMetadata: boolean;
  numbering: boolean;
}

export const SCHOOL_DISPLAY_NAMES: Record<string, string> = {
  VLU: 'ĐH Văn Lang (VLU)',
  DTHU: 'ĐH Đồng Tháp (DThU)',
  UEH: 'ĐH Kinh tế TP.HCM (UEH)',
  HCMUE: 'ĐH Sư phạm TP.HCM (HCMUE)',
  UFM: 'ĐH Tài chính - Marketing (UFM)',
  LHU: 'ĐH Lạc Hồng (LHU)',
  BAV: 'Học viện Ngân hàng (BAV)',
};
