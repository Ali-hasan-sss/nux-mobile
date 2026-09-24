import React from "react";
import { LegalWebViewModal } from "@/components/LegalWebViewModal";

interface TermsOfUseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsOfUseModal({ visible, onClose }: TermsOfUseModalProps) {
  return (
    <LegalWebViewModal type="terms" visible={visible} onClose={onClose} />
  );
}
