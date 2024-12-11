// components/Modal.tsx
import React from 'react';

interface ModalProps {
  visible: boolean;
  title: string;
  onClose: () => void; // Change setVisible to onClose
  children: React.ReactNode;
  closeButton?: boolean; // Add closeButton prop
  className?: string; // Optional className for additional styling
}

const Modal: React.FC<ModalProps> = ({ visible, title, onClose, children, closeButton = true, className }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className={`bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full ${className}`}>
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="text-white mb-4">{children}</div>
        <div className="flex justify-end">
          {closeButton && (
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;