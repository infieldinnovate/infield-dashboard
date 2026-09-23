'use client';

import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <LoadingSpinner size="lg" />
    </div>
  );
}
