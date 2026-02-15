/**
 * Allergen translation key helper (matches website: menu.allergens.<key>)
 */
export function getAllergenKey(allergy: string): string {
  return allergy
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

type TFunction = (key: string) => string;

/** Translate allergen by language; falls back to original text if no translation */
export function getTranslatedAllergen(allergy: string, t: TFunction): string {
  const key = getAllergenKey(allergy);
  const out = t(`menu.allergens.${key}`);
  if (out === `menu.allergens.${key}`) return allergy;
  return out;
}
