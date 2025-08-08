'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CacheType } from '@/lib/cache-manager';
import { useToast } from '@/features/shared/hooks/use-toast';
import {
  Trash2,
  Loader2,
  X,
  Check,
  Filter,
  Eraser,
  ShieldAlert,
  Key,
  FileJson,
  Upload,
  Download,
} from 'lucide-react';

interface BatchOperationResult {
  operation: string;
  key: string;
  cacheType: CacheType;
  success: boolean;
  error?: string;
}

export function CacheManagement() {
  const [selectedCacheType, setSelectedCacheType] = useState<CacheType | 'all'>('all');
  const [pattern, setPattern] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState('');
  const [confirmationReason, setConfirmationReason] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    action: 'invalidate' | 'clearByType' | 'clearByPattern';
    keys?: string[];
    cacheType?: CacheType;
    pattern?: string;
  } | null>(null);
  const [operationResults, setOperationResults] = useState<BatchOperationResult[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const { toast } = useToast();

  // Função de execução de ação precisa vir antes dos useCallback que a utilizam
  const executeAction = useCallback(async (
    action: 'invalidate' | 'clearByType' | 'clearByPattern',
    keys?: string[],
    cacheType?: CacheType,
    patternParam?: string,
    token?: string,
    reason?: string
  ) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/cache-monitor/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          keys,
          cacheType,
          pattern: patternParam,
          confirmationToken: token,
          reason
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 428 && data.requiresConfirmation) {
          // Confirmation required
          setConfirmationToken(data.confirmationToken);
          setIsConfirmDialogOpen(true);
          return;
        }
        
        throw new Error(data.error || 'Failed to execute cache operation');
      }
      
      // Show results
      if (data.result) {
        if (Array.isArray(data.result)) {
          setOperationResults(data.result);
        } else {
          setOperationResults([{
            operation: action,
            key: patternParam || 'all',
            cacheType: cacheType || CacheType.MEMORY,
            success: true
          }]);
        }
        
        setIsResultDialogOpen(true);
      }
      
      // Show success message
      const actionText = action === 'invalidate' 
        ? 'invalidated' 
        : action === 'clearByType' 
          ? 'cleared by type' 
          : 'cleared by pattern';
      
      toast({
        title: 'Operation successful',
        descricao: `Cache entries ${actionText} successfully.`,
      });
      
      // Clear selected keys
      setSelectedKeys([]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Operation failed',
        descricao: error instanceof Error ? error.message : 'Failed to execute cache operation',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleInvalidateSelected = useCallback(async () => {
    if (selectedKeys.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No keys selected',
        descricao: 'Please select at least one key to invalidate.',
      });
      return;
    }

    setPendingAction({
      action: 'invalidate',
      keys: selectedKeys,
      cacheType: selectedCacheType === 'all' ? undefined : selectedCacheType
    });
    
    if (selectedKeys.length > 5) {
      setIsConfirmDialogOpen(true);
      return;
    }
    
    await executeAction('invalidate', selectedKeys);
  }, [selectedKeys, selectedCacheType, executeAction, toast]);

  const handleClearByType = useCallback(async () => {
    if (selectedCacheType === 'all') {
      toast({
        variant: 'destructive',
        title: 'Cache type required',
        descricao: 'Please select a specific cache type to clear.',
      });
      return;
    }

    setPendingAction({
      action: 'clearByType',
      cacheType: selectedCacheType
    });
    
    setIsConfirmDialogOpen(true);
  }, [selectedCacheType, toast]);

  const handleClearByPattern = useCallback(async () => {
    if (!pattern) {
      toast({
        variant: 'destructive',
        title: 'Pattern required',
        descricao: 'Please enter a pattern to clear cache entries.',
      });
      return;
    }

    setPendingAction({
      action: 'clearByPattern',
      pattern,
      cacheType: selectedCacheType === 'all' ? undefined : selectedCacheType
    });
    
    setIsConfirmDialogOpen(true);
  }, [pattern, selectedCacheType, toast]);

  const handleConfirmAction = useCallback(() => {
    if (!pendingAction) return;
    
    const { action, keys, cacheType, pattern: chosenPattern } = pendingAction;
    
    executeAction(
      action, 
      keys, 
      cacheType, 
      chosenPattern, 
      confirmationToken,
      confirmationReason
    );
    
    setIsConfirmDialogOpen(false);
    setConfirmationToken('');
    setConfirmationReason('');
    setPendingAction(null);
  }, [pendingAction, confirmationToken, confirmationReason, executeAction]);

  const handleCancelAction = useCallback(() => {
    setIsConfirmDialogOpen(false);
    setConfirmationToken('');
    setConfirmationReason('');
    setPendingAction(null);
  }, []);

  const handleImport = useCallback(async () => {
    try {
      const data = JSON.parse(importData);
      
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid import data format');
      }
      
      setIsLoading(true);
      
      // Call the API endpoint to import the cache entries
      const response = await fetch('/api/admin/cache-monitor/manage/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          importData: data,
          options: {
            overwrite: true,
            cacheType: selectedCacheType === 'all' ? undefined : selectedCacheType
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import cache entries');
      }
      
      const responseData = await response.json();
      
      // Show results
      if (responseData.result) {
        setOperationResults(responseData.result);
        setIsResultDialogOpen(true);
      }
      
      toast({
        title: 'Import successful',
        descricao: `${responseData.summary.successful} of ${responseData.summary.total} cache entries imported successfully.`,
      });
      
      setImportDialogOpen(false);
      setImportData('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        descricao: error instanceof Error ? error.message : 'Failed to import cache entries',
      });
    } finally {
      setIsLoading(false);
    }
  }, [importData, selectedCacheType, toast]);

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Fetch cache entries to export
      const response = await fetch('/api/admin/cache-monitor/entries', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cache entries');
      }
      
      const data = await response.json();
      
      // Format the export data
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        entries: data.entries.map((entry: {
          key: string;
          cacheType: CacheType;
          data: unknown;
          expiresAt: string | null;
          createdAt: string;
          relatedKeys: string[];
        }) => ({
          key: entry.key,
          cacheType: entry.cacheType,
          data: entry.data,
          expiresAt: entry.expiresAt,
          createdAt: entry.createdAt,
          relatedKeys: entry.relatedKeys
        }))
      };
      
      // Create and download the JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `cache-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        descricao: `${exportData.entries.length} cache entries exported successfully.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        descricao: error instanceof Error ? error.message : 'Failed to export cache entries',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <div className="space-y-4">
      {/* Cache Management Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="invalidate">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="invalidate">Invalidate</TabsTrigger>
              <TabsTrigger value="clear">Clear Cache</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            </TabsList>
            
            {/* Invalidate Tab */}
            <TabsContent value="invalidate" className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Selected Keys: {selectedKeys.length}</span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Select
                      value={selectedCacheType}
                      onValueChange={(value) => setSelectedCacheType(value as CacheType | 'all')}
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
                  
                  <Button
                    onClick={handleInvalidateSelected}
                    disabled={isLoading || selectedKeys.length === 0}
                    variant="destructive"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Invalidate Selected
                  </Button>
                </div>
                
                <Alert>
                  <AlertDescription>
                    Select cache entries from the Inspector tab to invalidate them.
                    Invalidating a cache entry will remove it and all its related entries.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            {/* Clear Cache Tab */}
            <TabsContent value="clear" className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Select
                      value={selectedCacheType}
                      onValueChange={(value) => setSelectedCacheType(value as CacheType | 'all')}
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
                  
                  <Button
                    onClick={handleClearByType}
                    disabled={isLoading || selectedCacheType === 'all'}
                    variant="destructive"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Eraser className="mr-2 h-4 w-4" />
                    )}
                    Clear By Type
                  </Button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pattern (e.g. user:123)"
                        className="pl-8"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleClearByPattern}
                    disabled={isLoading || !pattern}
                    variant="destructive"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Filter className="mr-2 h-4 w-4" />
                    )}
                    Clear By Pattern
                  </Button>
                </div>
                
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Clearing cache is a destructive operation and cannot be undone.
                    This may affect application performance until the cache is rebuilt.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            {/* Import/Export Tab */}
            <TabsContent value="import-export" className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    onClick={() => setImportDialogOpen(true)}
                    disabled={isLoading}
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Cache
                  </Button>
                  
                  <Button
                    onClick={handleExport}
                    disabled={isLoading}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Cache
                  </Button>
                </div>
                
                <Alert>
                  <FileJson className="h-4 w-4" />
                  <AlertDescription>
                    Import and export cache entries for backup or migration purposes.
                    Exported data includes all cache entries with their metadata.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cache Operation</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === 'invalidate' && (
                <>
                  You are about to invalidate {pendingAction.keys?.length} cache entries.
                  This operation cannot be undone.
                </>
              )}
              {pendingAction?.action === 'clearByType' && (
                <>
                  You are about to clear all cache entries of type {pendingAction.cacheType}.
                  This operation cannot be undone.
                </>
              )}
              {pendingAction?.action === 'clearByPattern' && (
                <>
                  You are about to clear all cache entries matching the pattern &quot;{pendingAction.pattern}&quot;.
                  This operation cannot be undone.
                </>
              )}
            </AlertDialogDescription>
            
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="confirmation-token" className="text-sm font-medium">
                  Confirmation Token
                </label>
                <Input
                  id="confirmation-token"
                  value={confirmationToken}
                  onChange={(e) => setConfirmationToken(e.target.value)}
                  placeholder="Enter confirmation token"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmation-reason" className="text-sm font-medium">
                  Reason (optional)
                </label>
                <Input
                  id="confirmation-reason"
                  value={confirmationReason}
                  onChange={(e) => setConfirmationReason(e.target.value)}
                  placeholder="Enter reason for this operation"
                />
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={!confirmationToken}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Results Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Operation Results</DialogTitle>
            <DialogDescription>
              Results of the cache operation
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Total operations:</span>
                <span>{operationResults.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Successful:</span>
                <span className="text-green-600">
                  {operationResults.filter(r => r.success).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Failed:</span>
                <span className="text-red-600">
                  {operationResults.filter(r => !r.success).length}
                </span>
              </div>
            </div>
            
            <div className="mt-4 border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Key</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {operationResults.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="px-4 py-2 font-mono text-xs truncate max-w-[200px]">
                        {result.key}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">
                          {result.cacheType}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {result.success ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="mr-1 h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsResultDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Cache</DialogTitle>
            <DialogDescription>
              Paste the JSON export data to import cache entries
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <textarea
              className="w-full h-64 p-4 border rounded-md font-mono text-sm"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='{"version":"1.0","exportDate":"2025-07-18T12:00:00.000Z","entries":[...]}'
            />
            
            <Alert>
              <FileJson className="h-4 w-4" />
              <AlertDescription>
                The import data should be in the same format as the exported data.
                Existing cache entries with the same keys will be overwritten.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={isLoading || !importData}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}