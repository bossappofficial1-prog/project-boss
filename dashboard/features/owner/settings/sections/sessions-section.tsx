"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Laptop,
  Trash2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityApi, type Session } from "@/features/auth/services/security";
import { gooeyToast } from "goey-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const deviceIcons: Record<string, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

const browserIcons: Record<string, typeof Globe> = {};

function DeviceIcon({
  deviceType,
  browser,
}: {
  deviceType: string | null;
  browser: string | null;
}) {
  const Icon = deviceIcons[deviceType ?? "desktop"] ?? Monitor;
  return <Icon className="w-10 h-10 text-muted-foreground" />;
}

function BrowserIcon({ browser }: { browser: string | null }) {
  const Icon = browserIcons[browser ?? ""] ?? Globe;
  return <Icon className="w-3 h-3" />;
}

function SessionCard({
  session,
  onRevoke,
  isRevoking,
}: {
  session: Session;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-muted/20">
      <div className="flex items-center gap-3">
        <DeviceIcon
          deviceType={session.deviceType}
          browser={session.browser}
        />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {session.deviceName ?? "Perangkat Tidak Dikenal"}
            </p>
            {session.isCurrent && (
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-[10px] font-bold uppercase tracking-wider"
              >
                Aktif
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BrowserIcon browser={session.browser} />
              {session.browser ?? "Unknown"}
            </span>
            <span>·</span>
            <span>{session.os ?? "Unknown"}</span>
            {session.ip && (
              <>
                <span>·</span>
                <span>{session.ip}</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(session.lastActiveAt), {
              addSuffix: true,
              locale: id,
            })}
          </p>
        </div>
      </div>
      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export function SessionsSection() {
  const queryClient = useQueryClient();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => securityApi.listSessions(),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => securityApi.revokeSession(sessionId),
    onSuccess: () => {
      gooeyToast.success("Sesi berhasil dicabut");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (err: any) => {
      gooeyToast.error(
        err?.response?.data?.message ?? "Gagal mencabut sesi",
      );
    },
    onSettled: () => setRevokingId(null),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => securityApi.revokeOtherSessions(),
    onSuccess: (res) => {
      gooeyToast.success(res?.message ?? "Semua sesi lain dicabut");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (err: any) => {
      gooeyToast.error(
        err?.response?.data?.message ?? "Gagal mencabut sesi",
      );
    },
  });

  const handleRevoke = (sessionId: string) => {
    setRevokingId(sessionId);
    revokeMutation.mutate(sessionId);
  };

  const sessions = data?.sessions ?? [];
  const hasMultipleSessions = sessions.length > 1;

  return (
    <Card className="shadow-sm gap-0 border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              Sesi Login Aktif
            </CardTitle>
            <CardDescription>
              Kelola perangkat yang terhubung ke akun Anda.
            </CardDescription>
          </div>
          {hasMultipleSessions && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
            >
              <LogOut className="w-3 h-3 mr-1" />
              Cabut Semua
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Tidak ada sesi aktif
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRevoke={handleRevoke}
                isRevoking={revokingId === session.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
