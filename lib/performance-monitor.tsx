import React, { useRef, useEffect } from 'react';

/**
 * Configuration options for the performance monitor
 */
interface PerformanceMonitorOptions {
  /** Name of the component being monitored */
  componentName: string;
  
  /** Whether to log render times to console */
  logToConsole?: boolean;
  
  /** Threshold in ms above which renders are considered slow */
  renderTimeThreshold?: number;
  
  /** Whether to track props changes */
  trackPropsChanges?: boolean;
  
  /** Whether to track state changes */
  trackStateChanges?: boolean;
}

/**
 * A hook to monitor component render performance
 * 
 * @param options Configuration options
 * @param deps Dependencies array to track what caused the re-render
 */
export function usePerformanceMonitor(
  options: PerformanceMonitorOptions,
  deps: React.DependencyList = []
) {
  const {
    componentName,
    logToConsole = true,
    renderTimeThreshold = 16, // ~60fps
  } = options;
  
  // Store previous render time and dependencies
  const renderTimeRef = useRef<number>(performance.now());
  const prevDepsRef = useRef<React.DependencyList>(deps);
  
  // Track render count
  const renderCountRef = useRef<number>(0);
  
  useEffect(() => {
    // Calculate render time
    const renderTime = performance.now() - renderTimeRef.current;
    renderCountRef.current += 1;
    
    // Find which dependencies changed
    const changedDeps = deps.map((dep, i) => {
      const prevDep = prevDepsRef.current[i];
      return {
        index: i,
        changed: !Object.is(dep, prevDep)
      };
    }).filter(item => item.changed);
    
    // Log performance data if enabled
    if (logToConsole) {
      const isSlow = renderTime > renderTimeThreshold;
      
      console.group(
        `%c${componentName} render #${renderCountRef.current} - ${renderTime.toFixed(2)}ms ${isSlow ? '(SLOW)' : ''}`,
        isSlow ? 'color: #ff5555' : 'color: #4caf50'
      );
      
      if (changedDeps.length > 0) {
        console.log('Changed dependencies:', changedDeps.map(d => d.index));
      } else {
        console.log('No dependencies changed');
      }
      
      console.groupEnd();
    }
    
    // Store current deps for next comparison
    prevDepsRef.current = deps;
    
    // Reset render time for next render
    renderTimeRef.current = performance.now();
    
    // Cleanup function
    return () => {
      if (logToConsole) {
        console.log(`${componentName} unmounted after ${renderCountRef.current} renders`);
      }
    };
  });
}

/**
 * A higher-order component that wraps a component with performance monitoring
 * 
 * @param Component The component to monitor
 * @param options Configuration options
 * @returns The wrapped component with performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<PerformanceMonitorOptions, 'componentName'>
): React.FC<P> {
  const componentName = Component.displayName || Component.name || 'Component';
  
  const MonitoredComponent: React.FC<P> = (props) => {
    usePerformanceMonitor({
      componentName,
      ...options
    }, [props]);
    
    return <Component {...props} />;
  };
  
  MonitoredComponent.displayName = `Monitored(${componentName})`;
  
  return MonitoredComponent;
}

/**
 * A utility to measure the execution time of a function
 * 
 * @param fn The function to measure
 * @param fnName Optional name for the function
 * @returns The result of the function
 */
export function measureExecutionTime<T>(fn: () => T, fnName = 'Function'): T {
  const start = performance.now();
  const result = fn();
  const executionTime = performance.now() - start;
  
  console.log(`${fnName} execution time: ${executionTime.toFixed(2)}ms`);
  
  return result;
}

/**
 * Global performance metrics collector
 */
export const PerformanceMetrics = {
  componentRenderTimes: new Map<string, number[]>(),
  
  /**
   * Record a component render time
   * 
   * @param componentName Name of the component
   * @param renderTime Render time in ms
   */
  recordRenderTime(componentName: string, renderTime: number) {
    if (!this.componentRenderTimes.has(componentName)) {
      this.componentRenderTimes.set(componentName, []);
    }
    
    this.componentRenderTimes.get(componentName)!.push(renderTime);
  },
  
  /**
   * Get average render time for a component
   * 
   * @param componentName Name of the component
   * @returns Average render time in ms
   */
  getAverageRenderTime(componentName: string): number {
    const times = this.componentRenderTimes.get(componentName);
    if (!times || times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  },
  
  /**
   * Get components sorted by average render time
   * 
   * @returns Array of components sorted by average render time
   */
  getSlowestComponents() {
    const components = Array.from(this.componentRenderTimes.entries()).map(
      ([name, times]) => ({
        name,
        averageTime: times.reduce((acc, time) => acc + time, 0) / times.length,
        renderCount: times.length
      })
    );
    
    return components.sort((a, b) => b.averageTime - a.averageTime);
  },
  
  /**
   * Reset all metrics
   */
  reset() {
    this.componentRenderTimes.clear();
  }
};