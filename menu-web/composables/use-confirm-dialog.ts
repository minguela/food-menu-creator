type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmDialogState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
};

let resolver: ((value: boolean) => void) | null = null;

const defaultState: ConfirmDialogState = {
  open: false,
  title: "Confirmar acción",
  message: "",
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  danger: false,
};

export const useConfirmDialog = () => {
  const state = useState<ConfirmDialogState>("confirm-dialog-state", () => ({
    ...defaultState,
  }));

  const close = (result: boolean) => {
    state.value.open = false;
    if (resolver) {
      resolver(result);
      resolver = null;
    }
  };

  const confirm = (options: ConfirmDialogOptions) => {
    state.value = {
      open: true,
      title: options.title || defaultState.title,
      message: options.message,
      confirmText: options.confirmText || defaultState.confirmText,
      cancelText: options.cancelText || defaultState.cancelText,
      danger: Boolean(options.danger),
    };

    return new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
  };

  return {
    state,
    confirm,
    confirmAccept: () => close(true),
    confirmCancel: () => close(false),
  };
};
