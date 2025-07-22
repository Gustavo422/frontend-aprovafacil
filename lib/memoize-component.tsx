import React from 'react';

/**
 * A utility function to memoize a component with custom comparison logic
 * 
 * @param Component The component to memoize
 * @param propsAreEqual Optional custom comparison function
 * @returns Memoized component
 */
export function memoizeComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  // Use displayName from the original component or fallback to function name
  const displayName = Component.displayName || Component.name || 'MemoizedComponent';
  
  // Create memoized version of the component
  const MemoizedComponent = React.memo(Component, propsAreEqual);
  
  // Set display name for better debugging
  MemoizedComponent.displayName = `Memoized(${displayName})`;
  
  return MemoizedComponent;
}

/**
 * A utility function to create a props comparison function that only compares specific props
 * 
 * @param propKeys Array of prop keys to compare
 * @returns Props comparison function
 */
export function compareSelectedProps<P extends object>(propKeys: (keyof P)[]) {
  return (prevProps: Readonly<P>, nextProps: Readonly<P>): boolean => {
    return propKeys.every(key => Object.is(prevProps[key], nextProps[key]));
  };
}

/**
 * A utility function to create a props comparison function that ignores specific props
 * 
 * @param propKeys Array of prop keys to ignore in comparison
 * @returns Props comparison function
 */
export function ignoreProps<P extends object>(propKeys: (keyof P)[]) {
  return (prevProps: Readonly<P>, nextProps: Readonly<P>): boolean => {
    const allKeys = new Set([
      ...Object.keys(prevProps),
      ...Object.keys(nextProps)
    ]) as Set<keyof P>;
    
    const keysToCompare = Array.from(allKeys).filter(
      key => !propKeys.includes(key)
    );
    
    return keysToCompare.every(key => Object.is(prevProps[key], nextProps[key]));
  };
}

/**
 * A utility function to create a props comparison function that does deep comparison
 * for specific props and shallow comparison for others
 * 
 * @param deepCompareProps Array of prop keys to deep compare
 * @returns Props comparison function
 */
export function deepCompareProps<P extends object>(deepCompareProps: (keyof P)[]) {
  return (prevProps: Readonly<P>, nextProps: Readonly<P>): boolean => {
    // First check non-deep props with Object.is
    const allKeys = new Set([
      ...Object.keys(prevProps),
      ...Object.keys(nextProps)
    ]) as Set<keyof P>;
    
    const shallowKeys = Array.from(allKeys).filter(
      key => !deepCompareProps.includes(key)
    );
    
    const shallowEqual = shallowKeys.every(key => 
      Object.is(prevProps[key], nextProps[key])
    );
    
    if (!shallowEqual) return false;
    
    // Then check deep props with JSON.stringify
    return deepCompareProps.every(key => {
      try {
        return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
      } catch {
        // Fallback to reference equality if JSON.stringify fails
        return Object.is(prevProps[key], nextProps[key]);
      }
    });
  };
}