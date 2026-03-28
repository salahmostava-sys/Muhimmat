import { supabase } from '@services/supabase/client';
import { toServiceError } from '@services/serviceError';
import { authService } from '@services/authService';
import { sanitizeStoragePath } from '@shared/lib/storagePath';
import { validateUploadFile } from '@shared/lib/validation';

const ALLOWED_AVATAR_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

/** Ensures storage object keys are only created under a UUID folder (mitigates path traversal). */
const AUTH_USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertAuthUserIdForStorage(userId: string): void {
  if (!AUTH_USER_ID_RE.test(userId)) {
    throw toServiceError(new Error('معرّف المستخدم غير صالح'), 'profileService.uploadAvatar.userId');
  }
}

/** امتداد آمن فقط — لا يُؤخذ من اسم الملف دون تحقق (تخفيف path traversal). */
function safeAvatarExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ALLOWED_AVATAR_EXT.has(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  const t = file.type.toLowerCase();
  if (t === 'image/jpeg' || t === 'image/jpg') return 'jpg';
  if (t === 'image/png') return 'png';
  if (t === 'image/gif') return 'gif';
  if (t === 'image/webp') return 'webp';
  return 'jpg';
}

export const profileService = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', userId)
      .single();
    if (error) throw toServiceError(error, 'profileService.getProfile');
    return data;
  },

  getProfileName: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw toServiceError(error, 'profileService.getProfileName');
    return data;
  },

  uploadAvatar: async (userId: string, file: File) => {
    assertAuthUserIdForStorage(userId);
    const validation = validateUploadFile(file, {
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (!validation.valid) {
      throw toServiceError(
        new Error('error' in validation ? validation.error : 'Invalid file'),
        'profileService.uploadAvatar.validation',
      );
    }
    const ext = safeAvatarExtension(file);
    const candidate = `${userId}/avatar.${ext}`;
    const path = sanitizeStoragePath(candidate);
    if (!path) {
      throw toServiceError(new Error('مسار التخزين غير صالح'), 'profileService.uploadAvatar.path');
    }
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (error) throw toServiceError(error, 'profileService.uploadAvatar');
    if (!data) throw toServiceError(new Error('Upload returned no data'), 'profileService.uploadAvatar');
    return data;
  },

  getAvatarPublicUrl: (path: string) => {
    const safe = sanitizeStoragePath(path);
    if (!safe) {
      throw toServiceError(new Error('مسار التخزين غير صالح'), 'profileService.getAvatarPublicUrl');
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(safe);
    return data.publicUrl;
  },

  updateProfile: async (userId: string, payload: { name: string; avatar_url: string }) => {
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);
    if (error) throw toServiceError(error, 'profileService.updateProfile');
  },

  updatePassword: async (password: string) => {
    await authService.updatePassword(password);
  },
};
