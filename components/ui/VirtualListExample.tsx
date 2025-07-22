import { FixedSizeList as List } from 'react-window';
import React from 'react';

const items = Array.from({ length: 1000 }, (_, i) => `Item #${i + 1}`);

export function VirtualListExample() {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} key={index}>
      {items[index]}
    </div>
  );
  return (
    <List
      height={300}
      itemCount={items.length}
      itemSize={35}
      width={300}
    >
      {Row}
    </List>
  );
} 



