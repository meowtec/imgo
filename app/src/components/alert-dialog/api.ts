import type { ReactNode } from 'react';
import mitt from 'mitt';
import { nanoid } from 'nanoid';

export interface Dialog {
  open: boolean;
  id: string;
  type: 'alert' | 'confirm';
  title: string;
  message: ReactNode;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const dialogEmit = mitt<{
  addDialog: Dialog;
}>();

export function showDialog(dialog: Omit<Dialog, 'id' | 'open'>) {
  dialogEmit.emit('addDialog', {
    ...dialog,
    open: true,
    id: nanoid(),
  });
}

export interface ShowConfirmParams {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

export function showConfirm(params: ShowConfirmParams): Promise<boolean> {
  return new Promise((resolve) => {
    showDialog({
      ...params,
      type: 'confirm',
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}
