export type FileValidationOptions = {
  allowedTypes?: string[];
  maxSizeBytes?: number;
};

export const DEFAULT_ALLOWED_UPLOAD_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
];

export const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export function validateUploadFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: true } | { valid: false; error: string } {
  const allowedTypes = options.allowedTypes ?? DEFAULT_ALLOWED_UPLOAD_TYPES;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_UPLOAD_BYTES;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'غير مسموح بهذا النوع' };
  }
  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'الملف كبير جدًا' };
  }
  return { valid: true };
}

export function validatePhoneNumber(phoneNumber: string) {
  if (phoneNumber.length !== 14) return false;
  if (!phoneNumber.startsWith('(') || phoneNumber[4] !== ')' || phoneNumber[5] !== ' ' || phoneNumber[9] !== '-') return false;
  for (const idx of [1, 2, 3, 6, 7, 8, 10, 11, 12, 13]) {
    const ch = phoneNumber[idx];
    if (ch < '0' || ch > '9') return false;
  }
  return true;
}

export function validateEmail(email: string) {
  const value = email.trim();
  const atIndex = value.indexOf('@');
  if (atIndex <= 0 || atIndex !== value.lastIndexOf('@')) return false;
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  if (!local || !domain || local.includes(' ') || domain.includes(' ')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  return domain.includes('.');
}

export function validateNationalID(nationalID: string) {
  if (nationalID.length !== 9 || nationalID[4] !== '-') return false;
  const left = nationalID.slice(0, 4);
  const right = nationalID.slice(5);
  for (const ch of left + right) {
    if (ch < '0' || ch > '9') return false;
  }
  return true;
}