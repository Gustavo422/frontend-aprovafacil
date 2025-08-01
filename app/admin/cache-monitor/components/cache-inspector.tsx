'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CacheType } from '@/lib/cache-manager';
import { useToast } from '@/features/shared/hooks/use-toast';
import {
  Search,
  RefreshCw,
  Database,
  Link as LinkIcon,
  Info,
  Loader2,
  Network
} from 'lucide-react';

interface CacheEntryMetadata {
  key: string;
  cacheType: CacheType;
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
  size?: number;
  relatedKeys?: string[];
}

interface CacheEntryInfo extends CacheEntryMetadata {
  data?: unknown;
}

interface CacheRelationshipGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    expired: boolean;
    size?: number;
    metadata?: {
      createdAt: Date;
      expiresAt: Date;
      cacheType: CacheType;
    };
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
}

export function CacheInspector() {

  const [filteredEntries, setFilteredEntries] = useState<CacheEntryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCacheType, setSelectedCacheType] = useState<string>('all');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CacheEntryInfo | null>(null);
  const [entryData, setEntryData] = useState<unknown>(null);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
  const [relationshipGraph, setRelationshipGraph] = useState<CacheRelationshipGraph | null>(null);
  const [mermaidDiagram, setMermaidDiagram] = useState<string>('');
  const { toast } = useToast();

  const fetchCacheEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCacheType !== 'all') {
        params.append('cacheType', selectedCacheType);
      }
      if (searchQuery) {
        params.append('pattern', searchQuery);
      }
      params.append('includeExpired', includeExpired.toString());
      
      const response = await fetch(`/api/admin/cache-monitor/entries?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cache entries');
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      const processedEntries = data.entries.map((entry: { createdAt: string; expiresAt: string; [key: string]: unknown }) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        expiresAt: new Date(entry.expiresAt)
      }));
      
      setFilteredEntries(processedEntries);
      
      toast({
        title: 'Cache entries loaded',
        descricao: `${processedEntries.length} entries found`,
      });
    } catch (error) {
      console.error('Error fetching cache entries:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading cache entries',
        descricao: 'Could not load cache entries. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCacheType, searchQuery, includeExpired, toast]);

  useEffect(() => {
    // Só carregar dados se estivermos no cliente e a página estiver ativa
    if (typeof window !== 'undefined') {
      fetchCacheEntries();
    }
  }, [fetchCacheEntries]);

  const handleViewEntry = async (entry: CacheEntryInfo) => {
    setSelectedEntry(entry);
    setIsEntryDialogOpen(true);
    
    try {
      const response = await fetch('/api/admin/cache-monitor/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: entry.key,
          cacheType: entry.cacheType
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch entry data');
      }
      
      const data = await response.json();
      setEntryData(data.data);
    } catch (error) {
      console.error('Error fetching entry data:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading entry data',
        descricao: 'Could not load the cache entry data.',
      });
      setEntryData(null);
    }
  };

  const handleViewRelationships = async (entry: CacheEntryInfo) => {
    setSelectedEntry(entry);
    setIsRelationshipDialogOpen(true);
    setRelationshipGraph(null);
    setMermaidDiagram('');
    
    try {
      const params = new URLSearchParams({
        rootKey: entry.key,
        maxDepth: '3',
        maxNodes: '50',
        includeExpired: 'true'
      });
      
      const response = await fetch(`/api/admin/cache-monitor/relationships?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch relationships');
      }
      
      const data = await response.json();
      setRelationshipGraph(data.graph);
      setMermaidDiagram(data.visualizations.mermaid);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading relationships',
        descricao: 'Could not load the cache key relationships.',
      });
    }
  };

  const formatBytes = (bytes?: number): string => {
    if (bytes === undefined) return 'N/A';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getCacheTypeBadge = (type: CacheType) => {
    switch (type) {
      case CacheType.MEMORY:
        return <Badge variant="outline" className="bg-green-100 text-green-800">Memory</Badge>;
      case CacheType.LOCAL_STORAGE:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Local Storage</Badge>;
      case CacheType.SESSION_STORAGE:
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Session Storage</Badge>;
      case CacheType.SUPABASE:
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Supabase</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getExpirationStatus = (entry: CacheEntryInfo) => {
    if (entry.isExpired) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Expired</Badge>;
    }
    
    const now = new Date();
    const minutesUntilExpiration = Math.round((entry.expiresAt.getTime() - now.getTime()) / (60 * 1000));
    
    if (minutesUntilExpiration <= 5) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Expiring soon ({minutesUntilExpiration}m)</Badge>;
    } else if (minutesUntilExpiration <= 60) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Expires in {minutesUntilExpiration}m</Badge>;
    } else {
      const hoursUntilExpiration = Math.round(minutesUntilExpiration / 60);
      return <Badge variant="outline" className="bg-green-100 text-green-800">Expires in {hoursUntilExpiration}h</Badge>;
    }
  };

  useEffect(() => {
    // Initialize mermaid if the diagram is available
    if (mermaidDiagram && isRelationshipDialogOpen) {
      import('mermaid').then((mermaid) => {
        mermaid.default.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
        });
        mermaid.default.contentLoaded();
      }).catch(error => {
        console.error('Error loading mermaid:', error);
      });
    }
  }, [mermaidDiagram, isRelationshipDialogOpen]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cache keys..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={selectedCacheType}
                onValueChange={setSelectedCacheType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cache Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={CacheType.MEMORY}>Memory</SelectItem>
                  <SelectItem value={CacheType.LOCAL_STORAGE}>Local Storage</SelectItem>
                  <SelectItem value={CacheType.SESSION_STORAGE}>Session Storage</SelectItem>
                  <SelectItem value={CacheType.SUPABASE}>Supabase</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeExpired"
                checked={includeExpired}
                onCheckedChange={(checked) => setIncludeExpired(!!checked)}
              />
              <label
                htmlFor="includeExpired"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include Expired
              </label>
            </div>
            <Button
              onClick={fetchCacheEntries}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cache Entries</span>
            <Badge variant="outline">
              {filteredEntries.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No cache entries found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={`${entry.key}-${entry.cacheType}`}>
                      <TableCell className="font-mono text-xs">
                        {entry.key}
                      </TableCell>
                      <TableCell>
                        {getCacheTypeBadge(entry.cacheType)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </TableCell>
                      <TableCell>
                        {getExpirationStatus(entry)}
                      </TableCell>
                      <TableCell>
                        {formatBytes(entry.size)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEntry(entry)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRelationships(entry)}
                            disabled={!entry.relatedKeys || entry.relatedKeys.length === 0}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Details Dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Cache Entry Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected cache entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <Tabs defaultValue="metadata">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Key</h4>
                    <p className="font-mono text-sm break-all">{selectedEntry.key}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Cache Type</h4>
                    <p>{getCacheTypeBadge(selectedEntry.cacheType)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Created At</h4>
                    <p>{formatDate(selectedEntry.createdAt)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Expires At</h4>
                    <p>{formatDate(selectedEntry.expiresAt)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Size</h4>
                    <p>{formatBytes(selectedEntry.size)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                    <p>{selectedEntry.isExpired ? 'Expired' : 'Active'}</p>
                  </div>
                </div>
                
                {selectedEntry.relatedKeys && selectedEntry.relatedKeys.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Related Keys</h4>
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                      <ul className="space-y-1">
                        {selectedEntry.relatedKeys.map((key) => (
                          <li key={key} className="font-mono text-xs">{key}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="data">
                <div className="border rounded-md p-4 max-h-96 overflow-y-auto bg-slate-50">
                  {entryData === null ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {JSON.stringify(entryData, null, 2)}
                    </pre>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Relationship Visualization Dialog */}
      <Dialog open={isRelationshipDialogOpen} onOpenChange={setIsRelationshipDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cache Key Relationships</DialogTitle>
            <DialogDescription>
              Visualization of relationships between cache keys
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">
                  Showing relationships for key: <span className="font-mono">{selectedEntry.key}</span>
                </p>
              </div>
              
              {relationshipGraph === null ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : relationshipGraph.nodes.length <= 1 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No relationships found for this cache key</p>
                </div>
              ) : (
                <div className="border rounded-md p-4 bg-white">
                  <div className="mermaid text-center">
                    {mermaidDiagram}
                  </div>
                </div>
              )}
              
              {relationshipGraph && relationshipGraph.nodes.length > 1 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Legend</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-200 border border-green-600 rounded-sm"></div>
                      <span className="text-xs">Memory</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-200 border border-blue-600 rounded-sm"></div>
                      <span className="text-xs">Local Storage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-200 border border-purple-600 rounded-sm"></div>
                      <span className="text-xs">Session Storage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-200 border border-orange-600 rounded-sm"></div>
                      <span className="text-xs">Supabase</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-200 border border-red-600 rounded-sm"></div>
                      <span className="text-xs">Expired</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}