"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

export function NotificationSettings({ className }: { className?: string }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSupported(isPushSupported());
    getNotificationPermission().then(setPermission);

    if (isPushSupported()) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        const success = await unsubscribeFromPush();
        if (success) {
          setIsSubscribed(false);
          setPermission("default");
        }
      } else {
        const subscription = await subscribeToPush();
        if (subscription) {
          setIsSubscribed(true);
          setPermission("granted");
        } else {
          setPermission(await getNotificationPermission());
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={cn("text-sm text-gray-500", className)}>
        Tu navegador no soporta notificaciones push.
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between rounded-lg border p-4", className)}>
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="h-5 w-5 text-emerald-600" />
        ) : (
          <BellOff className="h-5 w-5 text-gray-400" />
        )}
        <div>
          <p className="font-medium text-sm">Notificaciones push</p>
          <p className="text-xs text-gray-500">
            {isSubscribed
              ? "Recibirás alertas de estado de pedidos y ofertas"
              : "Activa para recibir alertas importantes"}
          </p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        role="switch"
        aria-checked={isSubscribed}
        disabled={isLoading || permission === "denied"}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          isSubscribed ? "bg-emerald-500" : "bg-gray-300",
          (isLoading || permission === "denied") && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            isSubscribed ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
