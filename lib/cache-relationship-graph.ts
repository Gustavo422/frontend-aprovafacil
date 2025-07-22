/**
 * Interfaces for cache relationship graph visualization
 */

/**
 * Node in the cache relationship graph
 */
export interface CacheGraphNode {
  /**
   * Node ID (cache key)
   */
  id: string;
  
  /**
   * Display label (shortened key)
   */
  label: string;
  
  /**
   * Cache type
   */
  type: string;
  
  /**
   * Whether the entry is expired
   */
  expired: boolean;
  
  /**
   * Size of the entry in bytes (if available)
   */
  size?: number;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Edge in the cache relationship graph
 */
export interface CacheGraphEdge {
  /**
   * Source node ID
   */
  source: string;
  
  /**
   * Target node ID
   */
  target: string;
  
  /**
   * Edge label
   */
  label?: string;
  
  /**
   * Edge type
   */
  type?: string;
}

/**
 * Complete cache relationship graph
 */
export interface CacheRelationshipGraph {
  /**
   * Graph nodes
   */
  nodes: CacheGraphNode[];
  
  /**
   * Graph edges
   */
  edges: CacheGraphEdge[];
}

/**
 * Options for building a cache relationship graph
 */
export interface BuildGraphOptions {
  /**
   * Root key to start from
   */
  rootKey: string;
  
  /**
   * Maximum depth to traverse
   */
  maxDepth?: number;
  
  /**
   * Maximum number of nodes to include
   */
  maxNodes?: number;
  
  /**
   * Whether to include expired entries
   */
  includeExpired?: boolean;
  
  /**
   * Whether to include metadata
   */
  includeMetadata?: boolean;
}