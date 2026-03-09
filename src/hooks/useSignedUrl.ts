/**
 * useSignedUrl — generates short-lived signed URLs for private storage buckets.
 * Use this instead of getPublicUrl() for any bucket that is NOT public.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Duration in seconds for the signed URL (default: 5 minutes) */
const DEFAULT_EXPIRY = 300;

/**
 * Given a storage path in the `employee-documents` bucket, returns a
 * time-limited signed URL. Returns `null` while loading or if no path.
 */
export const useSignedUrl = (
  bucket: string,
  path: string | null | undefined,
  expiresIn = DEFAULT_EXPIRY
): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  const fetchUrl = useCallback(async () => {
    if (!path) { setUrl(null); return; }
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (!error && data?.signedUrl) {
      setUrl(data.signedUrl);
    } else {
      setUrl(null);
    }
  }, [bucket, path, expiresIn]);

  useEffect(() => { fetchUrl(); }, [fetchUrl]);

  return url;
};

/**
 * One-shot async helper — returns a signed URL or null (no React state).
 * Useful inside form save/upload flows.
 */
export const createSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn = DEFAULT_EXPIRY
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
};

/**
 * Extract the storage path from an employee document URL or field.
 * Employee docs are stored as `{employeeId}/{fieldName}.{ext}`.
 * If the value is already a plain path (no https://), return as-is.
 */
export const extractStoragePath = (urlOrPath: string | null | undefined): string | null => {
  if (!urlOrPath) return null;
  // If it's a full URL, extract the path after `/object/public/employee-documents/`
  // or `/object/sign/employee-documents/`
  const match = urlOrPath.match(/employee-documents\/(.+?)(?:\?|$)/);
  if (match) return match[1];
  // If it's already a relative path
  if (!urlOrPath.startsWith('http')) return urlOrPath;
  return null;
};
