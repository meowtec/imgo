import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { dialogEmit, type Dialog } from './api';
import { removeArrayItem, updateArrayItem } from '@/lib/array';

export function AlertDialogHost() {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);

  const hide = (id: string) => {
    setDialogs((prevDialogs) =>
      updateArrayItem(prevDialogs, (dialog) => dialog.id === id, { open: false }),
    );

    setTimeout(() => {
      setDialogs((prevDialogs) => removeArrayItem(prevDialogs, (dialog) => dialog.id === id));
    }, 400);
  };

  useEffect(() => {
    const listener = (dialog: Dialog) => {
      setDialogs((dialogs) => [...dialogs, dialog]);
    };
    dialogEmit.on('addDialog', listener);

    return () => {
      dialogEmit.off('addDialog', listener);
    };
  }, []);

  return dialogs.map((dialog) => {
    const handleCancel = () => {
      hide(dialog.id);
      dialog.onCancel?.();
    };

    const handleConfirm = () => {
      hide(dialog.id);
      dialog.onConfirm();
    };

    return (
      <AlertDialog key={dialog.id} open={dialog.open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>{dialog.cancelText}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>{dialog.confirmText}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  });
}
