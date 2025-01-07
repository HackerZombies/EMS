import React, { createContext, useContext, useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextProps {
  toast: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (newToast: Toast) => {
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={index}
            className={`w-80 p-4 rounded-lg shadow-lg ${
              toast.variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            <h3 className="font-bold">{toast.title}</h3>
            {toast.description && <p className="text-sm">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
