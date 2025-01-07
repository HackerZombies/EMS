import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen = true, onClose, children }) => {
  // Create modal root if it doesn't exist
  const modalRoot = document.getElementById('modal-root') || createModalRoot();

  // Prevent scrolling on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Handle clicks outside the modal content
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is on the overlay (and not on modal content), close modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={handleOverlayClick}
    >
      <div className="relative bg-white rounded-lg shadow-lg max-w-full max-h-full overflow-auto p-4">
        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        {children}
      </div>
    </div>,
    modalRoot
  );
};

function createModalRoot() {
  const root = document.createElement('div');
  root.setAttribute('id', 'modal-root');
  document.body.appendChild(root);
  return root;
}
