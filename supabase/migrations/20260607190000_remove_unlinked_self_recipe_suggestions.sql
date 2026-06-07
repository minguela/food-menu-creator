-- Remove OCR self-suggestions that are not real recipe ingredients.

delete from public.recipe_ingredients ri
using public.dishes d
where ri.recipe_id = d.id
  and ri.ingredient_id is null
  and not coalesce(ri.is_confirmed, false)
  and coalesce(ri.is_suggested, false)
  and ri.quantity is null
  and ri.unit_type is null
  and public.normalize_menu_lookup(coalesce(ri.normalized_name, ri.name))
    = public.normalize_menu_lookup(coalesce(d.normalized_name, d.name));
