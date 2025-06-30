'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { useSyncStatus } from './sync-status-provider';
import { cn } from '@/lib/utils';

export function SyncStatus() {
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    syncProgress,
    connectionQuality,
    triggerSync,
    getConnectionStatus,
  } = useSyncStatus();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className='h-4 w-4 text-destructive' />;
    }

    if (isSyncing) {
      return <RefreshCw className='h-4 w-4 animate-spin text-blue-500' />;
    }

    if (pendingChanges > 0) {
      return <AlertCircle className='h-4 w-4 text-orange-500' />;
    }

    switch (connectionQuality) {
      case 'good':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'poor':
        return <Activity className='h-4 w-4 text-yellow-500' />;
      default:
        return <Wifi className='h-4 w-4 text-muted-foreground' />;
    }
  };

  const getStatusVariant = ():
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline' => {
    if (!isOnline) return 'destructive';
    if (isSyncing) return 'default';
    if (pendingChanges > 0) return 'secondary';
    return 'outline';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-destructive';
    if (isSyncing) return 'text-blue-500';
    if (pendingChanges > 0) return 'text-orange-500';
    if (connectionQuality === 'good') return 'text-green-500';
    if (connectionQuality === 'poor') return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';

    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getDetailedStatus = () => {
    const status = getConnectionStatus();
    const lastSyncText = formatLastSync();

    if (isSyncing) {
      return `${status} • Last sync: ${lastSyncText}`;
    }

    if (pendingChanges > 0) {
      return `${status} changes • Last sync: ${lastSyncText}`;
    }

    return `${status} • Last sync: ${lastSyncText}`;
  };

  return (
    <TooltipProvider>
      <div className='flex items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={getStatusVariant()}
              className={cn(
                'flex cursor-help items-center gap-1.5 px-2 py-1 text-xs font-medium',
                getStatusColor()
              )}
            >
              {getStatusIcon()}
              <span className='hidden sm:inline'>{getConnectionStatus()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side='bottom' className='max-w-xs'>
            <div className='space-y-2'>
              <div className='font-medium'>{getDetailedStatus()}</div>

              {isSyncing && (
                <div className='space-y-1'>
                  <div className='text-xs text-muted-foreground'>
                    Sync Progress: {Math.round(syncProgress)}%
                  </div>
                  <Progress value={syncProgress} className='h-1' />
                </div>
              )}

              <div className='space-y-1 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Wifi className='h-3 w-3' />
                  Connection:{' '}
                  {connectionQuality === 'good'
                    ? 'Excellent'
                    : connectionQuality === 'poor'
                      ? 'Slow'
                      : 'Offline'}
                </div>

                {lastSyncTime && (
                  <div className='flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    Last sync: {lastSyncTime.toLocaleString()}
                  </div>
                )}

                {pendingChanges > 0 && (
                  <div className='flex items-center gap-1'>
                    <AlertCircle className='h-3 w-3' />
                    {pendingChanges} items pending sync
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Manual sync button - only show when online and not already syncing */}
        {isOnline && !isSyncing && pendingChanges > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={triggerSync}
                className='h-8 w-8 p-0'
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync now ({pendingChanges} pending)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Offline indicator with retry button */}
        {!isOnline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => window.location.reload()}
                className='h-8 w-8 p-0 text-destructive'
              >
                <WifiOff className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Offline - Click to retry connection</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
