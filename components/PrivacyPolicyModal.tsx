import React from "react";
import { LegalWebViewModal } from "@/components/LegalWebViewModal";

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  return (
    <LegalWebViewModal type="privacy" visible={visible} onClose={onClose} />
  );
}
