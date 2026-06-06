import { Suspense } from 'react';
import { SignInPage } from '@/components/pages/auth';

export default function Page() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  );
}
