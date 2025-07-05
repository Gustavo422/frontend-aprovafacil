import React from 'react';
import Image from 'next/image';

export function LazyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 200 }}>
      <Image
        src={src}
        alt={alt}
        layout="fill"
        objectFit="cover"
        style={{ borderRadius: 8 }}
      />
    </div>
  );
}