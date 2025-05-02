import React, { useState, Fragment } from "react";
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

import StressTestForm from "./StressTestForm";

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-gray-50 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg  border  bg-gray-100 max-h-[calc(90vh)] overflow-y-auto">
            <StressTestForm
              onSubmit={onSubmit}
              isLoading={isLoading}
            />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default CreateTestModal;
