import React, { memo } from 'react';
import { FixedSizeList, VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { cn } from '@/lib/utils';

// Type for fixed size list items
export interface FixedSizeListProps<T> {
  items: T[];
  height?: number | string;
  width?: number | string;
  itemSize: number;
  className?: string;
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  overscanCount?: number;
  useAutoSizer?: boolean;
  itemKey?: (index: number, data: T) => string | number;
}

// Type for variable size list items
export interface VariableSizeListProps<T> extends Omit<FixedSizeListProps<T>, 'itemSize'> {
  itemSize: (index: number) => number;
  estimatedItemSize?: number;
}

// Definir tipo para as props do MemoizedRow
interface MemoizedRowProps<T> {
  index: number;
  style: React.CSSProperties;
  data: {
    items: T[];
    renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  };
}

// Memoized row renderer para melhor compatibilidade
function MemoizedRow<T>({ index, style, data }: MemoizedRowProps<T>) {
  const item = data.items[index];
  return data.renderItem({ item, index, style });
}
const MemoizedRowMemo = memo(MemoizedRow) as React.ComponentType<MemoizedRowProps<unknown>>;
(MemoizedRowMemo as React.ComponentType).displayName = 'MemoizedRow';

// Fixed size virtualized list component
export function VirtualizedList<T>({
  items,
  height = 400,
  width = '100%',
  itemSize,
  className,
  renderItem,
  overscanCount = 5,
  useAutoSizer = false,
  itemKey,
}: FixedSizeListProps<T>) {
  const itemData = React.useMemo(() => ({ items, renderItem }), [items, renderItem]);
  
  const list = (width: number | string, height: number | string) => (
    <FixedSizeList
      height={typeof height === 'number' ? height : '100%'}
      width={typeof width === 'number' ? width : '100%'}
      itemCount={items.length}
      itemSize={itemSize}
      itemData={itemData}
      overscanCount={overscanCount}
      itemKey={itemKey}
      className={cn('scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300', className)}
    >
      {MemoizedRowMemo}
    </FixedSizeList>
  );

  if (useAutoSizer) {
    return (
      <div style={{ height, width }}>
        <AutoSizer>
          {({ height: autoHeight, width: autoWidth }: { height: number; width: number }) => list(autoWidth, autoHeight)}
        </AutoSizer>
      </div>
    );
  }

  return list(width, height);
}

// Variable size virtualized list component
export function VariableSizeVirtualizedList<T>({
  items,
  height = 400,
  width = '100%',
  itemSize,
  className,
  renderItem,
  overscanCount = 5,
  useAutoSizer = false,
  estimatedItemSize,
  itemKey,
}: VariableSizeListProps<T>) {
  const itemData = React.useMemo(() => ({ items, renderItem }), [items, renderItem]);
  
  const list = (width: number | string, height: number | string) => (
    <VariableSizeList
      height={typeof height === 'number' ? height : '100%'}
      width={typeof width === 'number' ? width : '100%'}
      itemCount={items.length}
      itemSize={itemSize}
      itemData={itemData}
      overscanCount={overscanCount}
      estimatedItemSize={estimatedItemSize}
      itemKey={itemKey}
      className={cn('scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300', className)}
    >
      {MemoizedRowMemo}
    </VariableSizeList>
  );

  if (useAutoSizer) {
    return (
      <div style={{ height, width }}>
        <AutoSizer>
          {({ height: autoHeight, width: autoWidth }: { height: number; width: number }) => list(autoWidth, autoHeight)}
        </AutoSizer>
      </div>
    );
  }

  return list(width, height);
}