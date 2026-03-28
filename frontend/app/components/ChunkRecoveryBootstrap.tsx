import { useEffect } from 'react';
import { clearStaleChunkReloadGuard } from '@shared/lib/chunkLoadRecovery';

/**
 * يُمسح قفل إعادة التحميل بعد ثوانٍ من التشغيل الناجح للغلاف،
 * حتى لا يبقى طابع زمني يمنع الاسترداد بعد نشر جديد (انظر chunkLoadRecovery).
 */
export function ChunkRecoveryBootstrap() {
  useEffect(() => {
    const id = globalThis.setTimeout(() => {
      clearStaleChunkReloadGuard();
    }, 4000);
    return () => globalThis.clearTimeout(id);
  }, []);
  return null;
}
