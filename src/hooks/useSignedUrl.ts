import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const extractStoragePath = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (!value.startsWith('http')) return value;
  const marker = '/storage/v1/object/public/';
  const index = value.indexOf(marker);
  if (index === -1) return null;
  const rest = value.slice(index + marker.length);
  const firstSlash = rest.indexOf('/');
  if (firstSlash === -1) return null;
  return rest.slice(firstSlash + 1);
};

export const useSignedUrl = (bucket: string, path: string | null | undefined) => {
  const query = useQuery({
    queryKey: ['signed-url', bucket, path ?? null] as const,
    enabled: !!path,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path!, 300);
      if (error) throw new Error(error.message || 'تعذر إنشاء رابط مؤقت');
      return data.signedUrl;
    },
    staleTime: 4 * 60_000, // signed URL TTL is 5 minutes
    gcTime: 10 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return query.data ?? null;
};

export default useSignedUrl;
