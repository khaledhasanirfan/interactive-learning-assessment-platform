'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/portal');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="animate-pulse text-sm text-emerald-800 font-semibold">
        Redirecting to KernelBuddy Portal...
      </div>
    </div>
  );
}
