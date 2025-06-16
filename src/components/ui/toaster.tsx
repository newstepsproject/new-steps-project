"use client";

import { useEffect } from "react";
import { X } from 'lucide-react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const defaultDuration = 5000; // 5 seconds

const ToastComponent = ({ toast, onClose }: { toast: ToastProps; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || defaultDuration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  // Determine styles based on toast type
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-800';
      default:
        return 'bg-white border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`max-w-sm w-full rounded-lg shadow-md border-l-4 overflow-hidden ${getStyles()}`}>
      <div className="p-4 flex items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{toast.title}</h3>
          {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
        </div>
        <button 
          onClick={onClose} 
          className="ml-4 text-gray-400 hover:text-gray-600"
          aria-label="Close toast"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

export { useToast }; 