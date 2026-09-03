import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrateMenus } from '../layers/00.core/app/menu-hydration.js';

test('hydrates weekly menus with their meals grouped into days', () => {
  const menus = [{ id: 'menu-1', name: 'Semana 1', week_number: 1 }];
  const meals = [
    { id: 'meal-2', weekly_menu_id: 'menu-1', day_number: 2, meal_type: 'cena', dish_name: 'Pescado', meal_slot: 1 },
    { id: 'meal-1', weekly_menu_id: 'menu-1', day_number: 1, meal_type: 'desayuno', dish_name: 'Avena', meal_slot: 1 },
    { id: 'meal-3', weekly_menu_id: 'menu-1', day_number: 1, meal_type: 'comida', dish_name: 'Ensalada', meal_slot: 1 },
  ];

  const [menu] = hydrateMenus(menus, meals);

  assert.equal(menu.days.length, 2);
  assert.deepEqual(menu.days[0].meals.map((meal) => meal.recipe_name), ['Avena', 'Ensalada']);
  assert.equal(menu.days[1].meals[0].recipe_name, 'Pescado');
  assert.equal(menu.days[0].meals[0].recipe_id, 'meal-1');
});
