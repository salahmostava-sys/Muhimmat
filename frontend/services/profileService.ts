import { supabase } from '@services/supabase/client';
import { toServiceError } from '@services/serviceError';
import { authService } from '@services/authService';

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
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (error) throw toServiceError(error, 'profileService.uploadAvatar');
    if (!data) throw toServiceError(new Error('Upload returned no data'), 'profileService.uploadAvatar');
    return data;
  },

  getAvatarPublicUrl: (path: string) => {
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
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
