type ShoppingListPromptOptions = {
  userId: string;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

export const useShoppingListRegeneration = () => {
  const supabase = useSupabase();
  const { confirm: confirmDialog } = useConfirmDialog();

  const getShoppingListCount = async (userId: string) => {
    const { count, error } = await supabase
      .from("shopping_lists")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return Number(count || 0);
  };

  const chooseClearExistingShoppingList = async ({
    userId,
    title = "Lista de la compra existente",
    message,
    confirmText = "Vaciar y generar",
    cancelText = "Mantener y generar",
  }: ShoppingListPromptOptions) => {
    const currentCount = await getShoppingListCount(userId);

    if (currentCount === 0) {
      return false;
    }

    const defaultMessage =
      currentCount === 1
        ? "Ya tienes 1 artículo en la lista. ¿Quieres vaciarla antes de generar la nueva?"
        : `Ya tienes ${currentCount} artículos en la lista. ¿Quieres vaciarla antes de generar la nueva?`;

    return confirmDialog({
      title,
      message: message || defaultMessage,
      confirmText,
      cancelText,
      danger: true,
    });
  };

  return {
    getShoppingListCount,
    chooseClearExistingShoppingList,
  };
};
