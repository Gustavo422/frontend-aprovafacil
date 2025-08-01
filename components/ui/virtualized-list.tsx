'use client';

import React from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: unknown[];
  height: number;
  itemHeight: number;
  renderItem: ({ index, style }: { index: number; style: React.CSSProperties }) => React.ReactNode;
  className?: string;
}

export function VirtualizedList({ 
  items, 
  height, 
  itemHeight, 
  renderItem, 
  className 
}: VirtualizedListProps) {
  const ItemRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    return (
      <div style={style}>
        {renderItem({ index, style })}
      </div>
    );
  };

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={items}
      >
        {ItemRenderer}
      </List>
    </div>
  );
}