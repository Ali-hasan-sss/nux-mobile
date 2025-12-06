import React, { createContext, useContext, useState, useCallback } from "react";
import { CustomAlert } from "@/components/CustomAlert";
import { Toast } from "@/components/Toast";

export type AlertType = "success" | "error" | "warning" | "info";
export type ToastType = "success" | "error" | "warning" | "info";

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showToast: (options: ToastOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    duration: number;
  }>({
    visible: false,
    message: "",
    type: "info",
    duration: 3000,
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert(options);
  }, []);

  const showToast = useCallback(
    ({ message, type = "info", duration = 3000 }: ToastOptions) => {
      setToast({
        visible: true,
        message,
        type,
        duration,
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (alert?.onConfirm) {
      alert.onConfirm();
    }
    hideAlert();
  }, [alert]);

  const handleCancel = useCallback(() => {
    if (alert?.onCancel) {
      alert.onCancel();
    }
    hideAlert();
  }, [alert]);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showToast }}>
      {children}
      {alert && (
        <CustomAlert
          visible={!!alert}
          title={alert.title}
          message={alert.message}
          type={alert.type || "info"}
          confirmText={alert.confirmText}
          cancelText={alert.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
};
