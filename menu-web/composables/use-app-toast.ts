import { toast } from "vue-sonner";

export const useAppToast = () => {
  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);
  const info = (message: string) => toast.info(message);

  const fromError = (fallback: string, err: unknown) => {
    if (err && typeof err === "object") {
      const anyErr = err as any;
      const msg =
        String(anyErr?.statusMessage || "") ||
        String(anyErr?.message || "") ||
        fallback;
      toast.error(msg);
      return;
    }
    toast.error(fallback);
  };

  return {
    success,
    error,
    info,
    fromError,
  };
};
