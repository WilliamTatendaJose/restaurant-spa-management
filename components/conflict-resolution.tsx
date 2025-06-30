'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';

interface ConflictData {
  id: string;
  type: 'transaction' | 'customer' | 'spa_service' | 'menu_item';
  localData: any;
  serverData: any;
  timestamp: Date;
}

interface ConflictResolutionProps {
  conflicts: ConflictData[];
  onResolveConflict: (
    id: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ) => Promise<void>;
  onResolveAll: (resolution: 'local' | 'server') => Promise<void>;
}

export default function ConflictResolution({
  conflicts,
  onResolveConflict,
  onResolveAll,
}: ConflictResolutionProps) {
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<string | null>(null);

  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const handleResolveConflict = async (
    id: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ) => {
    setIsResolving(id);
    try {
      await onResolveConflict(id, resolution, mergedData);
    } finally {
      setIsResolving(null);
    }
  };

  const handleResolveAll = async (resolution: 'local' | 'server') => {
    setIsResolving('all');
    try {
      await onResolveAll(resolution);
    } finally {
      setIsResolving(null);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toLocaleString();
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return '💳';
      case 'customer':
        return '👤';
      case 'spa_service':
        return '💆';
      case 'menu_item':
        return '🍽️';
      default:
        return '📄';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      case 'spa_service':
        return 'bg-purple-100 text-purple-800';
      case 'menu_item':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-4'>
      <Card className='border-red-200 bg-red-50'>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
            <CardTitle className='text-red-800'>
              Data Conflicts Detected
            </CardTitle>
          </div>
          <CardDescription className='text-red-700'>
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found
            during sync. Please review and resolve before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4 flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleResolveAll('local')}
              disabled={isResolving !== null}
              className='border-blue-200 text-blue-700 hover:bg-blue-50'
            >
              {isResolving === 'all'
                ? 'Resolving...'
                : 'Keep All Local Changes'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleResolveAll('server')}
              disabled={isResolving !== null}
              className='border-green-200 text-green-700 hover:bg-green-50'
            >
              {isResolving === 'all' ? 'Resolving...' : 'Use All Server Data'}
            </Button>
          </div>

          <div className='space-y-3'>
            {conflicts.map((conflict) => (
              <Card key={conflict.id} className='border-gray-200'>
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>
                        {getTypeIcon(conflict.type)}
                      </span>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h4 className='font-medium'>
                            {conflict.type
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                            Conflict
                          </h4>
                          <Badge className={getTypeBadgeColor(conflict.type)}>
                            {conflict.type}
                          </Badge>
                        </div>
                        <p className='flex items-center gap-1 text-sm text-gray-600'>
                          <Clock className='h-3 w-3' />
                          {conflict.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        setExpandedConflict(
                          expandedConflict === conflict.id ? null : conflict.id
                        )
                      }
                    >
                      {expandedConflict === conflict.id
                        ? 'Hide Details'
                        : 'Show Details'}
                    </Button>
                  </div>
                </CardHeader>

                {expandedConflict === conflict.id && (
                  <CardContent>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <h5 className='flex items-center gap-1 font-medium text-blue-700'>
                          <span>💻</span> Local Version
                        </h5>
                        <div className='rounded border bg-blue-50 p-3 text-xs'>
                          <pre className='whitespace-pre-wrap text-blue-800'>
                            {formatValue(conflict.localData)}
                          </pre>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <h5 className='flex items-center gap-1 font-medium text-green-700'>
                          <span>☁️</span> Server Version
                        </h5>
                        <div className='rounded border bg-green-50 p-3 text-xs'>
                          <pre className='whitespace-pre-wrap text-green-800'>
                            {formatValue(conflict.serverData)}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <Separator className='my-4' />

                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          handleResolveConflict(conflict.id, 'local')
                        }
                        disabled={isResolving !== null}
                        className='border-blue-200 text-blue-700 hover:bg-blue-50'
                      >
                        <CheckCircle className='mr-1 h-4 w-4' />
                        {isResolving === conflict.id
                          ? 'Resolving...'
                          : 'Keep Local'}
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          handleResolveConflict(conflict.id, 'server')
                        }
                        disabled={isResolving !== null}
                        className='border-green-200 text-green-700 hover:bg-green-50'
                      >
                        <CheckCircle className='mr-1 h-4 w-4' />
                        {isResolving === conflict.id
                          ? 'Resolving...'
                          : 'Use Server'}
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setExpandedConflict(null)}
                        disabled={isResolving !== null}
                        className='ml-auto'
                      >
                        <X className='mr-1 h-4 w-4' />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
