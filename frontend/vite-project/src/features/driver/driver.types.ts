export type DriverConfirmState = {
  title: string;
  description: string;
  variant: 'danger' | 'warning' | 'info';
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
} | null;

export type DriverFeedbackState = {
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;
