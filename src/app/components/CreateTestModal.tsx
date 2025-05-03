import React from "react";
import {
  Dialog,
  DialogPanel,
} from "@headlessui/react";
import { X } from "lucide-react";
import StressTestForm from "./StressTestForm";
import { FormData } from "./StressTestForm";

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void> | void;
  isLoading?: boolean;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  // Prevent closing on outside click by passing a no-op to onClose
  const handleDialogClose = (reason?: any) => {
    // Only allow close via explicit close button
    // Optionally, you could allow Escape key by checking reason
  };

  return (
    <Dialog open={isOpen} onClose={handleDialogClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 transition-opacity" aria-hidden="true" />
      {/* Modal Panel */}
      <div className="fixed inset-0 flex w-screen items-start justify-center p-4 z-50">
        <DialogPanel className="max-w-3xl w-full border bg-gray-100 h-[85vh] flex flex-col shadow-xl relative">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full p-2 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
          {/* Main Content */}
          <div className="flex-1 min-h-0 flex flex-col">
            <StressTestForm
              onSubmit={onSubmit}
              isLoading={isLoading}
              isCreateMode={true}
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default CreateTestModal;
