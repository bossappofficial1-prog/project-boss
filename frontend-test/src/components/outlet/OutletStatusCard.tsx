'use client';

import React, { useEffect, useState } from 'react';
import { useOutletEvents, useConnectionStatus } from '@/hooks/useSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, Clock, Users, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface OutletStatus {
  outletId: string;
  name: string;
  isOpen: boolean;
  estimatedWaitTime?: number;
  reason?: string;
  lastUpdated?: Date;
}

interface OutletStatusCardProps {
  outlet: {
    id: string;
    name: string;
    address: string;
    image?: string;
  };
}

export const OutletStatusCard: React.FC<OutletStatusCardProps> = ({ outlet }) => {
  const [status, setStatus] = useState<OutletStatus>({
    outletId: outlet.id,
    name: outlet.name,
    isOpen: true,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { subscribeToOutletUpdates, requestOutletStatus } = useOutletEvents();
  const { isConnected } = useConnectionStatus();

  // Subscribe to outlet updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToOutletUpdates(outlet.id, (data) => {
      console.log('Outlet update received:', data);

      setStatus(prev => ({
        ...prev,
        isOpen: data.type === 'status_changed' ? data.isOpen : prev.isOpen,
        estimatedWaitTime: data.type === 'busy_status' ? data.estimatedWaitTime : prev.estimatedWaitTime,
        reason: data.reason,
        lastUpdated: new Date(),
      }));
    });

    setIsSubscribed(true);

    // Request current status on mount
    requestOutletStatus(outlet.id);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [outlet.id, subscribeToOutletUpdates, requestOutletStatus, isConnected]);

  const refreshStatus = () => {
    if (isConnected) {
      requestOutletStatus(outlet.id);
    }
  };

  const getStatusBadge = () => {
    if (!isConnected) {
      return <Badge variant="secondary">Offline</Badge>;
    }

    if (status.isOpen) {
      if (status.estimatedWaitTime && status.estimatedWaitTime > 0) {
        return <Badge className="bg-yellow-500">Busy</Badge>;
      }
      return <Badge className="bg-green-500">Open</Badge>;
    }

    return <Badge className="bg-red-500">Closed</Badge>;
  };

  const getWaitTimeDisplay = () => {
    if (!status.estimatedWaitTime || status.estimatedWaitTime <= 0) {
      return null;
    }

    const minutes = Math.ceil(status.estimatedWaitTime / 60000); // Convert ms to minutes
    return (
      <div className="flex items-center space-x-1 text-sm text-yellow-600">
        <Clock className="h-4 w-4" />
        <span>~{minutes} min wait</span>
      </div>
    );
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Store className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">{outlet.name}</CardTitle>
              <CardDescription className="text-sm">{outlet.address}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <Button
              onClick={refreshStatus}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={!isConnected}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Connection and Subscription Status */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`h-2 w-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>{isSubscribed ? 'Live Updates' : 'No Updates'}</span>
            </div>
          </div>

          {/* Wait Time */}
          {getWaitTimeDisplay()}

          {/* Status Reason */}
          {status.reason && (
            <div className="p-2 bg-gray-50 rounded text-sm">
              <strong>Note:</strong> {status.reason}
            </div>
          )}

          {/* Last Updated */}
          {status.lastUpdated && (
            <div className="text-xs text-gray-500">
              Last updated: {status.lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </CardContent>

      {/* Busy Indicator */}
      {status.estimatedWaitTime && status.estimatedWaitTime > 0 && (
        <div className="absolute top-2 right-2">
          <Users className="h-4 w-4 text-yellow-500" />
        </div>
      )}
    </Card>
  );
};

// Component for displaying multiple outlets
interface OutletsListProps {
  outlets: Array<{
    id: string;
    name: string;
    address: string;
    image?: string;
  }>;
}

export const OutletsList: React.FC<OutletsListProps> = ({ outlets }) => {
  const { isConnected } = useConnectionStatus();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Outlet Status</h2>
        <div className="flex items-center space-x-2 text-sm">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Real-time Updates' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {outlets.map((outlet) => (
          <OutletStatusCard key={outlet.id} outlet={outlet} />
        ))}
      </div>
    </div>
  );
};

export default OutletStatusCard;
