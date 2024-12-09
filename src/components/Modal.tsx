import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "react-modal";

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  title: string;
  closeButton?: boolean;
  children: React.ReactNode;
  className?: string; // Add className prop here
};

export default function ModalPopup({
  visible,
  setVisible,
  title,
  closeButton = true,
  children,
  className, // Destructure className
}: Props) {
  const customStyles = {
    overlay: {
      zIndex: 100,
      background: "rgba(0, 0, 0, 0.7)",
    },
    content: {
      background: "rgba(255, 255, 255, 0.9)",
      border: "none",
      padding: "0",
      inset: "0",
    },
  };

  return (
    <Modal isOpen={visible} style={customStyles}>
      <motion.div
        className={`fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center p-8 backdrop-blur-lg ${className}`} // Apply className here
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ ease: "easeInOut", duration: 0.3 }}
      >
        <motion.div
          className="flex max-w-2xl flex-col gap-3 rounded-2xl bg-gray-800 bg-opacity-90 p-5 shadow-lg"
          initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          transition={{
            ease: "easeInOut",
            duration: 0.4,
            type: "spring",
            bounce: 0.3,
          }}
        >
          <div className="flex items-start justify-between gap-3 text-2xl text-white">
            <h1 className="font-semibold">{title}</h1>
            {closeButton && (
              <Icon
                icon="ph:x-bold"
                onClick={() => setVisible(false)}
                className="rounded-md transition-colors hover:bg-red-200 active:bg-red-300 cursor-pointer"
              />
            )}
          </div>
          <div className="text-white">{children}</div>
        </motion.div>
      </motion.div>
    </Modal>
  );
}