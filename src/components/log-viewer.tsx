'use client';

import type { ReactElement } from 'react';
import React, { useState, useEffect } from 'react';
import type { LogEntry} from '@/src/lib/logging';
import { LogLevel, getRecentLogs } from '@/src/lib/logging';

interface LogViewerProps {
  /**
   * Maximum number of logs to display
   * @default 100
   */
  maxLogs?: number;
  
  /**
   * Minimum log level to display
   * @default LogLevel.INFO
   */
  minLevel?: LogLevel;
  
  /**
   * Auto-refresh interval in milliseconds
   * @default 5000
   */
  refreshInterval?: number;
  
  /**
   * Whether to auto-scroll to the bottom
   * @default true
   */
  autoScroll?: boolean;
  
  /**
   * Whether to show timestamps
   * @default true
   */
  showTimestamps?: boolean;
  
  /**
   * Whether to show log levels
   * @default true
   */
  showLevels?: boolean;
  
  /**
   * Whether to show logger names
   * @default true
   */
  showLoggerNames?: boolean;
  
  /**
   * Whether to show metadata
   * @default false
   */
  showMetadata?: boolean;
  
  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Component for displaying logs
 */
export function LogViewer({
  maxLogs = 100,
  minLevel = LogLevel.INFO,
  refreshInterval = 5000,
  autoScroll = true,
  showTimestamps = true,
  showLevels = true,
  showLoggerNames = true,
  showMetadata = false,
}: LogViewerProps): ReactElement {
  // State for logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // State for filter
  const [filter, setFilter] = useState<string>('');
  
  // State for selected level
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  
  // Reference to log container
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Update logs
  useEffect(() => {
    // Function to update logs
    const updateLogs = () => {
      // Get recent logs
      const recentLogs = getRecentLogs();
      
      // Filter logs by level
      const filteredLogs = recentLogs.filter(log => {
        // Check level
        if (selectedLevel !== 'all') {
          const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
          const minLevelIndex = levels.indexOf(selectedLevel);
          const logLevelIndex = levels.indexOf(log.level);
          
          if (logLevelIndex < minLevelIndex) {
            return false;
          }
        }
        
        // Check filter
        if (filter) {
          const lowerFilter = filter.toLowerCase();
          
          // Check message
          if (log.message.toLowerCase().includes(lowerFilter)) {
            return true;
          }
          
          // Check logger name
          if (log.name.toLowerCase().includes(lowerFilter)) {
            return true;
          }
          
          // Check metadata
          if (log.meta) {
            const metaString = JSON.stringify(log.meta).toLowerCase();
            if (metaString.includes(lowerFilter)) {
              return true;
            }
          }
          
          return false;
        }
        
        return true;
      });
      
      // Limit logs
      const limitedLogs = filteredLogs.slice(-maxLogs);
      
      // Update logs
      setLogs(limitedLogs);
      
      // Scroll to bottom
      if (autoScroll && logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    };
    
    // Update logs immediately
    updateLogs();
    
    // Set up interval
    const interval = setInterval(updateLogs, refreshInterval);
    
    // Clean up interval
    return () => {
      clearInterval(interval);
    };
  }, [maxLogs, minLevel, refreshInterval, autoScroll, filter, selectedLevel]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        {/* Filter */}
        <input
          type="text"
          placeholder="Filter logs..."
          className="flex-1 px-3 py-1 border border-gray-300 rounded"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        
        {/* Level filter */}
        <select
          className="px-3 py-1 border border-gray-300 rounded"
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value as LogLevel | 'all')}
        >
          <option value="all">All Levels</option>
          <option value={LogLevel.DEBUG}>Debug & Above</option>
          <option value={LogLevel.INFO}>Info & Above</option>
          <option value={LogLevel.WARN}>Warn & Above</option>
          <option value={LogLevel.ERROR}>Error Only</option>
        </select>
        
        {/* Clear button */}
        <button
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          onClick={() => setLogs([])}
        >
          Clear
        </button>
      </div>
      
      {/* Log container */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-auto border border-gray-300 rounded p-2 font-mono text-sm bg-gray-50"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 p-4 text-center">No logs to display</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {/* Log entry */}
              <div className="flex flex-wrap">
                {/* Timestamp */}
                {showTimestamps && (
                  <span className="text-gray-500 mr-2">
                    {log.timestamp.toISOString()}
                  </span>
                )}
                
                {/* Level */}
                {showLevels && (
                  <span className="font-bold mr-2">
                    {log.level.toUpperCase()}
                  </span>
                )}
                
                {/* Logger name */}
                {showLoggerNames && (
                  <span className="text-gray-700 mr-2">
                    [{log.name}]
                  </span>
                )}
                
                {/* Message */}
                <span className="text-gray-900">
                  {log.message}
                </span>
              </div>
              
              {/* Metadata */}
              {showMetadata && log.meta && Object.keys(log.meta).length > 0 && (
                <pre className="text-xs text-gray-600 ml-4 mt-1 overflow-x-auto">
                  {JSON.stringify(log.meta, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
