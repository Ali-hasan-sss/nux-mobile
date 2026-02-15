import React, { useEffect, createContext, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "@/config/api";
import { AppDispatch, RootState } from "@/store/store";
import { incrementUnreadCount } from "@/store/slices/notificationSlice";
import { fetchUnreadCount } from "@/store/slices/notificationSlice";

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
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      if (socket) {
        socket.off("notification");
        socket.off("connect");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const url = getSocketUrl();
    const newSocket = io(url, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      // Sync initial unread count once when socket connects (no polling)
      dispatch(fetchUnreadCount());
    });
    newSocket.on("disconnect", () => setIsConnected(false));

    newSocket.on("notification", () => {
      dispatch(incrementUnreadCount());
    });

    setSocket(newSocket);
    return () => {
      newSocket.off("notification");
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, isAuthenticated, dispatch]);

  return (
    <NotificationSocketContext.Provider value={{ isConnected }}>
      {children}
    </NotificationSocketContext.Provider>
  );
}

export function useNotificationSocket() {
  return useContext(NotificationSocketContext);
}
