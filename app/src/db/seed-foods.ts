/**
 * Curated CoFID seed. Every macro is copied verbatim from the Composition of
 * Foods Integrated Dataset (PHE/OHID, OGL). None are invented - fabricated
 * macros violate this product's core honesty principle. Source page:
 * https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
 */
export type SeedFood = {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinGPer100g: number;
  carbsGPer100g: number;
  fatGPer100g: number;
  fibreGPer100g?: number;
  servingGrams?: number;
  servingLabel?: string;
};

export const SEED_FOODS: SeedFood[] = [
  // CoFID 18-323: Chicken, breast, grilled without skin, meat only. Fibre: AOAC.
  { id: 'chicken-breast-grilled', name: 'Chicken breast, grilled', kcalPer100g: 148, proteinGPer100g: 32, carbsGPer100g: 0, fatGPer100g: 2.2, fibreGPer100g: 0 },
  // CoFID 18-356: Turkey, breast, fillet, grilled, meat only. Fibre: AOAC.
  { id: 'turkey-breast-grilled', name: 'Turkey breast, grilled', kcalPer100g: 155, proteinGPer100g: 35, carbsGPer100g: 0, fatGPer100g: 1.7, fibreGPer100g: 0 },
  // CoFID 18-508: Beef, mince, raw, extra lean. Fibre: NSP (AOAC absent).
  { id: 'beef-mince-lean-raw', name: 'Beef mince, lean, raw', kcalPer100g: 130, proteinGPer100g: 21.9, carbsGPer100g: 0, fatGPer100g: 4.2, fibreGPer100g: 0 },
  // CoFID 18-474: Beef, rump steak, grilled, lean only. Fibre: AOAC.
  { id: 'beef-steak-grilled', name: 'Beef steak, grilled', kcalPer100g: 177, proteinGPer100g: 31, carbsGPer100g: 0, fatGPer100g: 5.9, fibreGPer100g: 0 },
  // CoFID 16-416: Tuna, canned in brine, drained. Fibre: AOAC.
  { id: 'tuna-canned-brine', name: 'Tuna, canned in brine', kcalPer100g: 109, proteinGPer100g: 24.9, carbsGPer100g: 0, fatGPer100g: 1, fibreGPer100g: 0 },
  // CoFID 16-372: Cod, flesh only, raw. Fibre: AOAC.
  { id: 'cod-raw', name: 'Cod, raw', kcalPer100g: 75, proteinGPer100g: 17.5, carbsGPer100g: 0, fatGPer100g: 0.6, fibreGPer100g: 0 },
  // CoFID 16-387: Prawns, king, raw. Fibre: AOAC.
  { id: 'prawns-raw', name: 'Prawns, raw', kcalPer100g: 77, proteinGPer100g: 17.6, carbsGPer100g: 0, fatGPer100g: 0.7, fibreGPer100g: 0 },
  // CoFID 12-555: Yogurt, Greek style, plain. Fibre: AOAC.
  { id: 'greek-yogurt-plain', name: 'Greek yogurt, plain', kcalPer100g: 133, proteinGPer100g: 5.7, carbsGPer100g: 4.8, fatGPer100g: 10.2, fibreGPer100g: 0 },
  // CoFID 12-539: Cheese, cottage, plain. Fibre: AOAC.
  { id: 'cottage-cheese', name: 'Cottage cheese', kcalPer100g: 103, proteinGPer100g: 9.4, carbsGPer100g: 3.1, fatGPer100g: 6, fibreGPer100g: 0 },
  // CoFID 13-661: Lentils, green and brown, whole, dried, boiled in unsalted water. Fibre: AOAC.
  { id: 'lentils-boiled', name: 'Lentils, boiled', kcalPer100g: 92, proteinGPer100g: 7.8, carbsGPer100g: 14.5, fatGPer100g: 0.7, fibreGPer100g: 7.4 },
  // CoFID 13-662: Beans, chick peas, Kabuli, whole, dried, boiled in unsalted water. Fibre: AOAC.
  { id: 'chickpeas-boiled', name: 'Chickpeas, boiled', kcalPer100g: 129, proteinGPer100g: 8.4, carbsGPer100g: 18.3, fatGPer100g: 3, fibreGPer100g: 10.6 },
  // CoFID 13-667: Beans, edamame, frozen, boiled in unsalted water. Fibre: AOAC.
  { id: 'edamame', name: 'Edamame beans', kcalPer100g: 142, proteinGPer100g: 12.2, carbsGPer100g: 6.5, fatGPer100g: 7.6, fibreGPer100g: 5.9 },
  // CoFID 11-788: Porridge oats, unfortified. Fibre: AOAC.
  { id: 'oats-rolled', name: 'Oats, rolled', kcalPer100g: 381, proteinGPer100g: 10.9, carbsGPer100g: 70.7, fatGPer100g: 8.1, fibreGPer100g: 7.8 },
  // CoFID 11-862: Rice, white, long grain, boiled in unsalted water. Fibre: AOAC.
  { id: 'rice-white-boiled', name: 'Rice, white, boiled', kcalPer100g: 131, proteinGPer100g: 2.8, carbsGPer100g: 31.1, fatGPer100g: 0.4, fibreGPer100g: 0.5 },
  // CoFID 11-869: Rice, brown, wholegrain, boiled in unsalted water. Fibre: AOAC.
  { id: 'rice-brown-boiled', name: 'Rice, brown, boiled', kcalPer100g: 132, proteinGPer100g: 3.6, carbsGPer100g: 29.2, fatGPer100g: 0.9, fibreGPer100g: 1.5 },
  // CoFID 11-450: Pasta, plain, fresh, boiled. Fibre: NSP (AOAC absent).
  { id: 'pasta-boiled', name: 'Pasta, boiled', kcalPer100g: 159, proteinGPer100g: 6.6, carbsGPer100g: 31.8, fatGPer100g: 1.5, fibreGPer100g: 1.9 },
  // CoFID 11-981: Bread, wholemeal, average. Fibre: AOAC.
  { id: 'bread-wholemeal', name: 'Bread, wholemeal', kcalPer100g: 217, proteinGPer100g: 9.4, carbsGPer100g: 42, fatGPer100g: 2.5, fibreGPer100g: 7 },
  // CoFID 11-1145: Bread, white, average. Fibre: AOAC.
  { id: 'bread-white', name: 'Bread, white', kcalPer100g: 236, proteinGPer100g: 8.7, carbsGPer100g: 48.7, fatGPer100g: 2.1, fibreGPer100g: 2.9 },
  // CoFID 13-490: Potatoes, old, boiled in unsalted water, flesh only. Fibre: AOAC.
  { id: 'potato-boiled', name: 'Potato, boiled', kcalPer100g: 74, proteinGPer100g: 1.8, carbsGPer100g: 17.5, fatGPer100g: 0.1, fibreGPer100g: 1.6 },
  // CoFID 13-672: Sweet potato, baked. Fibre: AOAC.
  { id: 'sweet-potato-baked', name: 'Sweet potato, baked', kcalPer100g: 115, proteinGPer100g: 1.6, carbsGPer100g: 27.9, fatGPer100g: 0.4, fibreGPer100g: 5.2 },
  // CoFID 14-318: Bananas, flesh only. Fibre: AOAC.
  { id: 'banana', name: 'Banana', kcalPer100g: 81, proteinGPer100g: 1.2, carbsGPer100g: 20.3, fatGPer100g: 0.1, fibreGPer100g: 1.4 },
  // CoFID 14-319: Apples, eating, raw, flesh and skin. Fibre: AOAC.
  { id: 'apple', name: 'Apple', kcalPer100g: 51, proteinGPer100g: 0.6, carbsGPer100g: 11.6, fatGPer100g: 0.5, fibreGPer100g: 1.2 },
  // CoFID 13-503: Broccoli, green, boiled in unsalted water. Fibre: AOAC.
  { id: 'broccoli-boiled', name: 'Broccoli, boiled', kcalPer100g: 28, proteinGPer100g: 3.3, carbsGPer100g: 2.8, fatGPer100g: 0.5, fibreGPer100g: 2.8 },
  // CoFID 13-572: Spinach, mature, raw. Fibre: NSP (AOAC unavailable).
  { id: 'spinach-raw', name: 'Spinach, raw', kcalPer100g: 25, proteinGPer100g: 2.8, carbsGPer100g: 1.6, fatGPer100g: 0.8, fibreGPer100g: 2.1 },
  // CoFID 13-496: Carrots, old, raw. Fibre: AOAC.
  { id: 'carrots-raw', name: 'Carrots, raw', kcalPer100g: 34, proteinGPer100g: 0.5, carbsGPer100g: 7.7, fatGPer100g: 0.4, fibreGPer100g: 3.9 },
  // CoFID 13-524: Pepper, capsicum, red, raw. Fibre: AOAC.
  { id: 'peppers-red-raw', name: 'Peppers, red, raw', kcalPer100g: 21, proteinGPer100g: 0.8, carbsGPer100g: 4.3, fatGPer100g: 0.2, fibreGPer100g: 2.2 },
  // CoFID 13-505: Mushrooms, white, raw. Fibre: AOAC.
  { id: 'mushrooms-raw', name: 'Mushrooms, raw', kcalPer100g: 7, proteinGPer100g: 1, carbsGPer100g: 0.3, fatGPer100g: 0.2, fibreGPer100g: 0.7 },
  // CoFID 13-517: Tomatoes, standard, raw. Fibre: AOAC.
  { id: 'tomato-raw', name: 'Tomato, raw', kcalPer100g: 14, proteinGPer100g: 0.5, carbsGPer100g: 3, fatGPer100g: 0.1, fibreGPer100g: 1 },
  // CoFID 13-234: Curly kale, raw. Fibre: NSP (AOAC unavailable).
  { id: 'kale', name: 'Kale', kcalPer100g: 33, proteinGPer100g: 3.4, carbsGPer100g: 1.4, fatGPer100g: 1.6, fibreGPer100g: 3.1 },
  // CoFID 13-499: Onions, raw. Fibre: AOAC.
  { id: 'onion-raw', name: 'Onion, raw', kcalPer100g: 35, proteinGPer100g: 1, carbsGPer100g: 8, fatGPer100g: 0.1, fibreGPer100g: 2.2 },
  // CoFID 17-661: Butter, unsalted. Fibre: AOAC.
  { id: 'butter', name: 'Butter', kcalPer100g: 744, proteinGPer100g: 0.6, carbsGPer100g: 0.6, fatGPer100g: 82.2, fibreGPer100g: 0 },
  // CoFID 14-892: Peanut butter, smooth. Fibre: AOAC.
  { id: 'peanut-butter', name: 'Peanut butter', kcalPer100g: 607, proteinGPer100g: 22.8, carbsGPer100g: 13.1, fatGPer100g: 51.8, fibreGPer100g: 6.6 },
  // CoFID 14-896: Almonds, whole kernels. Fibre: AOAC.
  { id: 'almonds', name: 'Almonds', kcalPer100g: 554, proteinGPer100g: 21.2, carbsGPer100g: 5.3, fatGPer100g: 49.9, fibreGPer100g: 12.5 },
  // CoFID 14-879: Walnuts, kernel only. Fibre: NSP (AOAC unavailable).
  { id: 'walnuts', name: 'Walnuts', kcalPer100g: 688, proteinGPer100g: 14.7, carbsGPer100g: 3.3, fatGPer100g: 68.5, fibreGPer100g: 3.5 },
  // CoFID 14-386: Avocado, Hass, flesh only. Fibre: AOAC.
  { id: 'avocado', name: 'Avocado', kcalPer100g: 171, proteinGPer100g: 1.8, carbsGPer100g: 1.8, fatGPer100g: 17.4, fibreGPer100g: 3.1 },
  // CoFID 12-596: Milk, whole, pasteurised, average. Fibre: AOAC.
  { id: 'milk-whole', name: 'Milk, whole', kcalPer100g: 63, proteinGPer100g: 3.4, carbsGPer100g: 4.6, fatGPer100g: 3.6, fibreGPer100g: 0 },
  // CoFID 12-313: Milk, semi-skimmed, pasteurised, average. Fibre: AOAC.
  { id: 'milk-semi-skimmed', name: 'Milk, semi-skimmed', kcalPer100g: 46, proteinGPer100g: 3.5, carbsGPer100g: 4.7, fatGPer100g: 1.7, fibreGPer100g: 0 },
  // CoFID 12-346: Cheese, Cheddar, English. Fibre: AOAC.
  { id: 'cheddar', name: 'Cheddar cheese', kcalPer100g: 416, proteinGPer100g: 25.4, carbsGPer100g: 0.1, fatGPer100g: 34.9, fibreGPer100g: 0 },
];
