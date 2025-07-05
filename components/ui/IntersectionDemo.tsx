import React from 'react';
import { useInView } from 'react-intersection-observer';

export function IntersectionDemo() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <div ref={ref} style={{ height: 120, background: inView ? '#22c55e' : '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, margin: 24 }}>
      {inView ? 'Entrou na tela!' : 'Role para ver'}
    </div>
  );
} 