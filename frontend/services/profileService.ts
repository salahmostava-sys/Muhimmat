import { supabase } from '@services/supabase/client';
import { toServiceError } from '@services/serviceError';
import { authService } from '@services/authService';
import { getAvatarPublicUrlOrThrow, uploadProfileAvatar } from '@services/supabase/avatarStorage';

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

  uploadAvatar: uploadProfileAvatar,

  getAvatarPublicUrl: getAvatarPublicUrlOrThrow,

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
