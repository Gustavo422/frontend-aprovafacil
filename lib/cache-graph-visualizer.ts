import { CacheRelationshipGraph } from './cache-relationship-graph';
import { CacheType } from './cache-manager';

/**
 * Options for generating graph visualization
 */
export interface GraphVisualizationOptions {
  /**
   * Width of the visualization
   */
  width?: number;
  
  /**
   * Height of the visualization
   */
  height?: number;
  
  /**
   * Whether to include node labels
   */
  showLabels?: boolean;
  
  /**
   * Whether to show node types
   */
  showTypes?: boolean;
  
  /**
   * Whether to color nodes by type
   */
  colorByType?: boolean;
  
  /**
   * Whether to size nodes by data size
   */
  sizeByDataSize?: boolean;
  
  /**
   * Whether to highlight expired nodes
   */
  highlightExpired?: boolean;
}

/**
 * Cache Graph Visualizer - Provides utilities for visualizing cache relationships
 */
export class CacheGraphVisualizer {
  /**
   * Generate a Mermaid diagram for the relationship graph
   */
  public static generateMermaidDiagram(
    graph: CacheRelationshipGraph,
    options: GraphVisualizationOptions = {}
  ): string {
    const {
      showLabels = true,
      showTypes = true,
      colorByType = true,
      highlightExpired = true
    } = options;
    
    let mermaid = 'graph TD\n';
    
    // Add nodes
    for (const node of graph.nodes) {
      const nodeId = this.sanitizeId(node.id);
      let nodeLabel = showLabels ? node.label : '';
      
      if (showTypes) {
        nodeLabel += nodeLabel ? `<br/>(${node.type})` : node.type;
      }
      
      let style = '';
      
      // Add styling based on node type
      if (colorByType) {
        style += this.getColorForCacheType(node.type as CacheType);
      }
      
      // Highlight expired nodes
      if (highlightExpired && node.expired) {
        style += ',stroke:#f66,stroke-width:2px';
      }
      
      // Add node with styling
      if (style) {
        mermaid += `  ${nodeId}["${nodeLabel}"]:::${nodeId}Style\n`;
        mermaid += `  classDef ${nodeId}Style ${style}\n`;
      } else {
        mermaid += `  ${nodeId}["${nodeLabel}"]\n`;
      }
    }
    
    // Add edges
    for (const edge of graph.edges) {
      const sourceId = this.sanitizeId(edge.source);
      const targetId = this.sanitizeId(edge.target);
      
      mermaid += `  ${sourceId} --> ${targetId}\n`;
    }
    
    return mermaid;
  }
  
  /**
   * Generate a D3 compatible JSON for the relationship graph
   */
  public static generateD3Json(
    graph: CacheRelationshipGraph,
    options: GraphVisualizationOptions = {}
  ): unknown {
    const {
      colorByType = true,
      sizeByDataSize = true,
      highlightExpired = true
    } = options;
    
    const nodes = graph.nodes.map(node => {
      const color = colorByType 
        ? this.getD3ColorForCacheType(node.type as CacheType) 
        : '#6c8ebf';
      
      const size = sizeByDataSize && node.size 
        ? Math.max(5, Math.min(20, 5 + Math.log10(node.size) * 2)) 
        : 10;
      
      return {
        id: node.id,
        label: node.label,
        type: node.type,
        expired: node.expired,
        color: highlightExpired && node.expired ? '#ff6666' : color,
        size,
        metadata: node.metadata
      };
    });
    
    const links = graph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
      type: edge.type || 'related'
    }));
    
    return { nodes, links };
  }
  
  /**
   * Generate a DOT graph for Graphviz
   */
  public static generateDotGraph(
    graph: CacheRelationshipGraph,
    options: GraphVisualizationOptions = {}
  ): string {
    const {
      showLabels = true,
      showTypes = true,
      colorByType = true,
      highlightExpired = true
    } = options;
    
    let dot = 'digraph CacheRelationships {\n';
    dot += '  node [shape=box, style=filled];\n';
    
    // Add nodes
    for (const node of graph.nodes) {
      const nodeId = this.sanitizeId(node.id);
      let nodeLabel = showLabels ? node.label : '';
      
      if (showTypes) {
        nodeLabel += nodeLabel ? `\\n(${node.type})` : node.type;
      }
      
      let color = colorByType 
        ? this.getDotColorForCacheType(node.type as CacheType) 
        : '#d5e8d4';
      
      if (highlightExpired && node.expired) {
        color = '#f8cecc';
      }
      
      dot += `  "${nodeId}" [label="${nodeLabel}", fillcolor="${color}"];\n`;
    }
    
    // Add edges
    for (const edge of graph.edges) {
      const sourceId = this.sanitizeId(edge.source);
      const targetId = this.sanitizeId(edge.target);
      
      dot += `  "${sourceId}" -> "${targetId}";\n`;
    }
    
    dot += '}\n';
    
    return dot;
  }
  
  /**
   * Sanitize a string for use as an ID in graph visualizations
   */
  private static sanitizeId(id: string): string {
    // Replace characters that might cause issues in graph visualization formats
    return id.replace(/[^a-zA-Z0-9]/g, '_');
  }
  
  /**
   * Get color style for a cache type (for Mermaid)
   */
  private static getColorForCacheType(type: CacheType): string {
    switch (type) {
      case CacheType.MEMORY:
        return 'fill:#d5e8d4,stroke:#82b366';
      case CacheType.LOCAL_STORAGE:
        return 'fill:#dae8fc,stroke:#6c8ebf';
      case CacheType.SESSION_STORAGE:
        return 'fill:#fff2cc,stroke:#d6b656';
      case CacheType.SUPABASE:
        return 'fill:#f8cecc,stroke:#b85450';
      default:
        return 'fill:#e1d5e7,stroke:#9673a6';
    }
  }
  
  /**
   * Get color for a cache type (for D3)
   */
  private static getD3ColorForCacheType(type: CacheType): string {
    switch (type) {
      case CacheType.MEMORY:
        return '#82b366';
      case CacheType.LOCAL_STORAGE:
        return '#6c8ebf';
      case CacheType.SESSION_STORAGE:
        return '#d6b656';
      case CacheType.SUPABASE:
        return '#b85450';
      default:
        return '#9673a6';
    }
  }
  
  /**
   * Get color for a cache type (for DOT/Graphviz)
   */
  private static getDotColorForCacheType(type: CacheType): string {
    switch (type) {
      case CacheType.MEMORY:
        return '#d5e8d4';
      case CacheType.LOCAL_STORAGE:
        return '#dae8fc';
      case CacheType.SESSION_STORAGE:
        return '#fff2cc';
      case CacheType.SUPABASE:
        return '#f8cecc';
      default:
        return '#e1d5e7';
    }
  }
}

// Export singleton instance
export const cacheGraphVisualizer = new CacheGraphVisualizer();