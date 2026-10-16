export type ExamSkill = 'speaking' | 'writing' | 'listening';

export type ExamApiSettings = {
  endpoint: string;
  school: string;
  batch: string;
};

export type RemoteExam = {
  id: string;
  skill: ExamSkill;
  school: string;
  batch: string;
  part: string;
  title: string;
  content: string;
  videoId?: string;
  [key: string]: string | undefined;
};

export type ExamApiResponse<T> = {
  ok: boolean;
  error?: string;
  items?: T[];
  schools?: string[];
  batches?: string[];
  data?: Partial<Record<ExamSkill, T[]>>;
};

export const EXAM_API_SETTINGS_KEY = 'vstep_exam_api_settings_v1';
export const DEFAULT_EXAM_API_SETTINGS: ExamApiSettings = {
  endpoint: 'https://script.google.com/macros/s/AKfycbxL8innFRsbYXgFZ0DdvcQocYl6Uox_zIXKl2LKC-ZpK8ae9c7pO-x6c1AbXICfK7BrAQ/exec',
  school: '',
  batch: '',
};
let callbackSequence = 0;

export function getExamApiSettings(): ExamApiSettings {
  if (typeof window === 'undefined') return DEFAULT_EXAM_API_SETTINGS;
  const saved = window.localStorage.getItem(EXAM_API_SETTINGS_KEY);
  if (!saved) return DEFAULT_EXAM_API_SETTINGS;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Saved exam API settings have an invalid format.');
    }
    const settings = parsed as Partial<ExamApiSettings>;
    return {
      endpoint: typeof settings.endpoint === 'string' ? settings.endpoint : '',
      school: typeof settings.school === 'string' ? settings.school : '',
      batch: typeof settings.batch === 'string' ? settings.batch : '',
    };
  } catch (error) {
    console.error('Could not read saved exam API settings.', error);
    return DEFAULT_EXAM_API_SETTINGS;
  }
}

export function saveExamApiSettings(settings: ExamApiSettings) {
  window.localStorage.setItem(EXAM_API_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('vstep:exam-api-settings-change'));
}

export function subscribeToExamApiSettings(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('vstep:exam-api-settings-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('vstep:exam-api-settings-change', callback);
  };
}

export function getExamApiSettingsSnapshot() {
  return JSON.stringify(getExamApiSettings());
}

export function getServerExamApiSettingsSnapshot() {
  return JSON.stringify(DEFAULT_EXAM_API_SETTINGS);
}

export function parseExamApiSettingsSnapshot(snapshot: string): ExamApiSettings {
  const parsed: unknown = JSON.parse(snapshot);
  if (
    typeof parsed === 'object'
    && parsed !== null
    && 'endpoint' in parsed
    && typeof parsed.endpoint === 'string'
    && 'school' in parsed
    && typeof parsed.school === 'string'
    && 'batch' in parsed
    && typeof parsed.batch === 'string'
  ) {
    return {
      endpoint: parsed.endpoint,
      school: parsed.school,
      batch: parsed.batch,
    };
  }
  return DEFAULT_EXAM_API_SETTINGS;
}

export function requestExamApi<T>(
  endpoint: string,
  parameters: Record<string, string>,
): Promise<ExamApiResponse<T>> {
  return new Promise((resolve, reject) => {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      reject(new Error('Đường dẫn Apps Script không hợp lệ.'));
      return;
    }
    if (url.protocol !== 'https:') {
      reject(new Error('API Apps Script phải sử dụng HTTPS.'));
      return;
    }

    const callbackName = `vstepExamApiCallback${Date.now()}${callbackSequence++}`;
    const script = document.createElement('script');
    const timeoutId = window.setTimeout(() => {
      Reflect.deleteProperty(window, callbackName);
      script.remove();
      reject(new Error('Apps Script không phản hồi trong thời gian cho phép.'));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      Reflect.deleteProperty(window, callbackName);
      script.remove();
    };

    Reflect.set(window, callbackName, (response: unknown) => {
      cleanup();
      if (typeof response !== 'object' || response === null) {
        reject(new Error('API trả về dữ liệu không hợp lệ.'));
        return;
      }
      const result = response as ExamApiResponse<T>;
      if (!result.ok) {
        reject(new Error(result.error || 'API không thể hoàn thành yêu cầu.'));
        return;
      }
      resolve(result);
    });

    url.searchParams.set('callback', callbackName);
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
    script.src = url.toString();
    script.onerror = () => {
      cleanup();
      reject(new Error('Không thể kết nối Apps Script. Kiểm tra URL và quyền triển khai Web App.'));
    };
    document.head.appendChild(script);
  });
}
