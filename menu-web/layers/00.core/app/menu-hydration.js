const mealTypeOrder = new Map([
  ['desayuno', 1],
  ['comida', 2],
  ['cena', 3],
  ['snack', 4],
]);

function mealSortKey(meal) {
  return [
    Number(meal.day_number) || 0,
    Number(meal.meal_slot) || 1,
    mealTypeOrder.get(String(meal.meal_type || '').toLowerCase()) || 99,
  ];
}

export function hydrateMenus(menus = [], meals = []) {
  const mealsByMenu = new Map();

  for (const meal of meals) {
    const menuId = String(meal?.weekly_menu_id || '');
    if (!menuId) continue;
    if (!mealsByMenu.has(menuId)) mealsByMenu.set(menuId, []);
    mealsByMenu.get(menuId).push(meal);
  }

  return menus.map((menu) => {
    const menuMeals = (mealsByMenu.get(String(menu.id)) || [])
      .slice()
      .sort((left, right) => {
        const a = mealSortKey(left);
        const b = mealSortKey(right);
        return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
      });
    const daysByNumber = new Map();

    for (const meal of menuMeals) {
      const dayNumber = Number(meal.day_number) || 0;
      if (!daysByNumber.has(dayNumber)) {
        daysByNumber.set(dayNumber, { day: `Día ${dayNumber}`, meals: [] });
      }
      daysByNumber.get(dayNumber).meals.push({
        type: meal.meal_type || 'comida',
        recipe_id: meal.dish_id || meal.id,
        recipe_name: meal.dish_name || meal.recipe_name || 'Sin nombre',
        servings: Number(meal.servings) || 1,
        image_url: meal.image_url || undefined,
        kcal: meal.kcal,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
      });
    }

    return {
      ...menu,
      days: [...daysByNumber.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, day]) => day),
    };
  });
}
