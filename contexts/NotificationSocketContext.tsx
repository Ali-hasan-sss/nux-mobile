import React, { useEffect, createContext, useContext, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DeviceEventEmitter } from "react-native";
import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "@/config/api";
import { AppDispatch, RootState } from "@/store/store";
import { incrementUnreadCount } from "@/store/slices/notificationSlice";
import { fetchUnreadCount } from "@/store/slices/notificationSlice";
import type { NewPaymentRequestPayload } from "@/api/walletPaymentApi";
import { WalletPaymentApprovalModal } from "@/components/WalletPaymentApprovalModal";

function getSocketUrl(): string {
  const baseUrl = API_CONFIG.BASE_URL || "https://back.nuxapp.de/api";
  const base = baseUrl.replace(/\/api\/?$/, "");
  if (base.startsWith("https")) return base.replace(/^https/, "wss");
  return base.replace(/^http/, "ws");
}

interface NotificationSocketContextValue {
  isConnected: boolean;
}

const NotificationSocketContext = createContext<NotificationSocketContextValue>({
  isConnected: false,
});

export function NotificationSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector(
    (state: RootState) => state.auth.tokens?.accessToken
  );
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const [isConnected, setIsConnected] = useState(false);
  const [walletApproval, setWalletApproval] = useState<NewPaymentRequestPayload | null>(null);

  const dismissWalletApproval = useCallback(() => {
    setWalletApproval(null);
  }, []);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setWalletApproval(null);
      return;
    }

    const url = getSocketUrl();
    const newSocket = io(url, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const onNewPayment = (p: NewPaymentRequestPayload) => {
      if (p?.approvalId && p?.approvalToken) {
        setWalletApproval({
          ...p,
          approvalId: String(p.approvalId).trim(),
          approvalToken: String(p.approvalToken).trim(),
        });
      }
    };

    const onResolved = (payload: { approvalId?: string; status?: string }) => {
      setWalletApproval((prev) =>
        prev && payload?.approvalId === prev.approvalId ? null : prev
      );
      if (payload?.status === "approved") {
        DeviceEventEmitter.emit("wallet:balanceChanged");
      }
    };

    newSocket.on("connect", () => {
      setIsConnected(true);
      dispatch(fetchUnreadCount());
    });
    newSocket.on("disconnect", () => setIsConnected(false));

    newSocket.on("notification", () => {
      dispatch(incrementUnreadCount());
    });

    newSocket.on("NEW_PAYMENT_REQUEST", onNewPayment);
    newSocket.on("PAYMENT_REQUEST_RESOLVED", onResolved);

    return () => {
      newSocket.off("notification");
      newSocket.off("NEW_PAYMENT_REQUEST", onNewPayment);
      newSocket.off("PAYMENT_REQUEST_RESOLVED", onResolved);
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.disconnect();
      setIsConnected(false);
    };
  }, [token, isAuthenticated, dispatch]);

  return (
    <NotificationSocketContext.Provider value={{ isConnected }}>
      {children}
      <WalletPaymentApprovalModal
        visible={Boolean(walletApproval)}
        payload={walletApproval}
        onDismiss={dismissWalletApproval}
      />
    </NotificationSocketContext.Provider>
  );
}

export function useNotificationSocket() {
  return useContext(NotificationSocketContext);
}
