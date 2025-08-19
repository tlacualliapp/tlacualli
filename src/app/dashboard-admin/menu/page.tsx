
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is being merged with the recipes page for a unified experience.
export default function MenuPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/recipes');
  }, [router]);

  return null;
}
