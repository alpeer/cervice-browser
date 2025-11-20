'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpecState } from '@/hooks/useSpecState';
import SpecUploader from '@/components/SpecUploader/SpecUploader';
import ToastContainer from '@/components/ToastContainer/ToastContainer';
import Button from '@/ui/Button/Button';
import './page.scss';

export default function Home() {
  const router = useRouter();
  const { spec, isValid } = useSpecState();

  // Redirect if spec is loaded
  useEffect(() => {
    if (spec && isValid) {
      router.push('/endpoints');
    }
  }, [spec, isValid, router]);

  return (
    <div className="app-container">
      <main className="content">
        <div className="spec-uploader-container">
          <SpecUploader />
          <div className="or-divider">
            <span>OR</span>
          </div>
          <Button
            onClick={() => router.push('/entities')}
            variant="outlined"
            size="large"
          >
            Go to Entity Diagram
          </Button>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
