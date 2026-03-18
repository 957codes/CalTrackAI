import { FoodItem } from "../types";

/**
 * Top 500 common foods with USDA-approximate nutrition data.
 * Used for instant offline lookup when the user searches by name.
 * Each entry is a single standard serving.
 */

export interface CommonFood {
  name: string;
  portion: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  keywords: string[];
}

export const COMMON_FOODS: CommonFood[] = [
  // ─── Proteins ──────────────────────────────────────────────────
  { name: "Chicken Breast (grilled)", portion: "6 oz", macros: { calories: 280, protein: 53, carbs: 0, fat: 6 }, keywords: ["chicken", "breast", "grilled"] },
  { name: "Chicken Thigh (skin-on)", portion: "4 oz", macros: { calories: 230, protein: 28, carbs: 0, fat: 13 }, keywords: ["chicken", "thigh"] },
  { name: "Chicken Wing", portion: "3 wings", macros: { calories: 240, protein: 20, carbs: 0, fat: 17 }, keywords: ["chicken", "wing", "wings"] },
  { name: "Chicken Drumstick", portion: "2 drumsticks", macros: { calories: 260, protein: 30, carbs: 0, fat: 15 }, keywords: ["chicken", "drumstick", "leg"] },
  { name: "Ground Chicken", portion: "4 oz", macros: { calories: 170, protein: 22, carbs: 0, fat: 9 }, keywords: ["chicken", "ground"] },
  { name: "Turkey Breast (roasted)", portion: "4 oz", macros: { calories: 150, protein: 30, carbs: 0, fat: 2 }, keywords: ["turkey", "breast"] },
  { name: "Ground Turkey (93% lean)", portion: "4 oz", macros: { calories: 170, protein: 22, carbs: 0, fat: 9 }, keywords: ["turkey", "ground"] },
  { name: "Beef Steak (sirloin)", portion: "6 oz", macros: { calories: 340, protein: 46, carbs: 0, fat: 16 }, keywords: ["beef", "steak", "sirloin"] },
  { name: "Ground Beef (85% lean)", portion: "4 oz", macros: { calories: 240, protein: 21, carbs: 0, fat: 17 }, keywords: ["beef", "ground", "hamburger"] },
  { name: "Ground Beef (90% lean)", portion: "4 oz", macros: { calories: 200, protein: 23, carbs: 0, fat: 11 }, keywords: ["beef", "ground", "lean"] },
  { name: "Ribeye Steak", portion: "8 oz", macros: { calories: 540, protein: 48, carbs: 0, fat: 38 }, keywords: ["ribeye", "steak", "beef"] },
  { name: "Filet Mignon", portion: "6 oz", macros: { calories: 340, protein: 42, carbs: 0, fat: 18 }, keywords: ["filet", "mignon", "beef", "tenderloin"] },
  { name: "Pork Chop (boneless)", portion: "5 oz", macros: { calories: 260, protein: 36, carbs: 0, fat: 12 }, keywords: ["pork", "chop"] },
  { name: "Pork Tenderloin", portion: "4 oz", macros: { calories: 150, protein: 26, carbs: 0, fat: 4 }, keywords: ["pork", "tenderloin"] },
  { name: "Bacon", portion: "3 slices", macros: { calories: 130, protein: 9, carbs: 0, fat: 10 }, keywords: ["bacon"] },
  { name: "Ham (deli)", portion: "3 oz", macros: { calories: 90, protein: 14, carbs: 2, fat: 3 }, keywords: ["ham", "deli"] },
  { name: "Lamb Chop", portion: "4 oz", macros: { calories: 290, protein: 26, carbs: 0, fat: 20 }, keywords: ["lamb", "chop"] },
  { name: "Salmon Fillet", portion: "5 oz", macros: { calories: 290, protein: 36, carbs: 0, fat: 15 }, keywords: ["salmon", "fish"] },
  { name: "Tuna (canned in water)", portion: "5 oz can", macros: { calories: 130, protein: 29, carbs: 0, fat: 1 }, keywords: ["tuna", "canned", "fish"] },
  { name: "Tuna Steak", portion: "5 oz", macros: { calories: 185, protein: 40, carbs: 0, fat: 2 }, keywords: ["tuna", "steak", "fish"] },
  { name: "Shrimp", portion: "6 oz", macros: { calories: 170, protein: 36, carbs: 1, fat: 2 }, keywords: ["shrimp", "prawn"] },
  { name: "Tilapia", portion: "5 oz", macros: { calories: 160, protein: 33, carbs: 0, fat: 3 }, keywords: ["tilapia", "fish"] },
  { name: "Cod", portion: "5 oz", macros: { calories: 130, protein: 29, carbs: 0, fat: 1 }, keywords: ["cod", "fish"] },
  { name: "Halibut", portion: "5 oz", macros: { calories: 175, protein: 36, carbs: 0, fat: 3 }, keywords: ["halibut", "fish"] },
  { name: "Scallops", portion: "5 oz", macros: { calories: 140, protein: 27, carbs: 5, fat: 1 }, keywords: ["scallops", "seafood"] },
  { name: "Crab Meat", portion: "4 oz", macros: { calories: 100, protein: 21, carbs: 0, fat: 1 }, keywords: ["crab", "seafood"] },
  { name: "Lobster Tail", portion: "4 oz", macros: { calories: 110, protein: 23, carbs: 0, fat: 1 }, keywords: ["lobster", "seafood"] },
  { name: "Tofu (firm)", portion: "1/2 block", macros: { calories: 180, protein: 20, carbs: 4, fat: 10 }, keywords: ["tofu", "soy"] },
  { name: "Tempeh", portion: "4 oz", macros: { calories: 220, protein: 21, carbs: 11, fat: 12 }, keywords: ["tempeh", "soy"] },
  { name: "Eggs (large)", portion: "2 eggs", macros: { calories: 140, protein: 12, carbs: 1, fat: 10 }, keywords: ["eggs", "egg"] },
  { name: "Egg Whites", portion: "4 whites", macros: { calories: 70, protein: 14, carbs: 1, fat: 0 }, keywords: ["egg", "whites"] },
  { name: "Hard Boiled Egg", portion: "1 egg", macros: { calories: 70, protein: 6, carbs: 1, fat: 5 }, keywords: ["egg", "boiled", "hard"] },

  // ─── Grains & Starches ─────────────────────────────────────────
  { name: "White Rice", portion: "1 cup cooked", macros: { calories: 205, protein: 4, carbs: 45, fat: 0 }, keywords: ["rice", "white"] },
  { name: "Brown Rice", portion: "1 cup cooked", macros: { calories: 215, protein: 5, carbs: 45, fat: 2 }, keywords: ["rice", "brown"] },
  { name: "Jasmine Rice", portion: "1 cup cooked", macros: { calories: 210, protein: 4, carbs: 46, fat: 0 }, keywords: ["rice", "jasmine"] },
  { name: "Quinoa", portion: "1 cup cooked", macros: { calories: 220, protein: 8, carbs: 39, fat: 4 }, keywords: ["quinoa"] },
  { name: "Pasta (cooked)", portion: "1 cup", macros: { calories: 220, protein: 8, carbs: 43, fat: 1 }, keywords: ["pasta", "spaghetti", "noodles", "penne"] },
  { name: "Whole Wheat Pasta", portion: "1 cup cooked", macros: { calories: 175, protein: 7, carbs: 37, fat: 1 }, keywords: ["pasta", "whole wheat"] },
  { name: "Bread (white)", portion: "1 slice", macros: { calories: 75, protein: 3, carbs: 14, fat: 1 }, keywords: ["bread", "white"] },
  { name: "Bread (whole wheat)", portion: "1 slice", macros: { calories: 80, protein: 4, carbs: 14, fat: 1 }, keywords: ["bread", "wheat", "whole"] },
  { name: "Sourdough Bread", portion: "1 slice", macros: { calories: 90, protein: 4, carbs: 17, fat: 1 }, keywords: ["sourdough", "bread"] },
  { name: "Bagel", portion: "1 medium", macros: { calories: 270, protein: 10, carbs: 53, fat: 2 }, keywords: ["bagel"] },
  { name: "English Muffin", portion: "1 muffin", macros: { calories: 130, protein: 5, carbs: 25, fat: 1 }, keywords: ["english", "muffin"] },
  { name: "Tortilla (flour, 8\")", portion: "1 tortilla", macros: { calories: 140, protein: 3, carbs: 24, fat: 3 }, keywords: ["tortilla", "flour", "wrap"] },
  { name: "Tortilla (corn, 6\")", portion: "2 tortillas", macros: { calories: 110, protein: 3, carbs: 23, fat: 1 }, keywords: ["tortilla", "corn"] },
  { name: "Oatmeal (cooked)", portion: "1 cup", macros: { calories: 165, protein: 6, carbs: 28, fat: 4 }, keywords: ["oatmeal", "oats", "porridge"] },
  { name: "Granola", portion: "1/2 cup", macros: { calories: 210, protein: 5, carbs: 30, fat: 9 }, keywords: ["granola"] },
  { name: "Cereal (Cheerios)", portion: "1 cup", macros: { calories: 100, protein: 3, carbs: 20, fat: 2 }, keywords: ["cereal", "cheerios"] },
  { name: "Pancakes", portion: "2 medium", macros: { calories: 260, protein: 7, carbs: 38, fat: 9 }, keywords: ["pancakes", "pancake"] },
  { name: "Waffle", portion: "1 waffle", macros: { calories: 220, protein: 6, carbs: 30, fat: 9 }, keywords: ["waffle"] },
  { name: "French Toast", portion: "2 slices", macros: { calories: 300, protein: 10, carbs: 36, fat: 13 }, keywords: ["french", "toast"] },
  { name: "Baked Potato", portion: "1 medium", macros: { calories: 160, protein: 4, carbs: 37, fat: 0 }, keywords: ["potato", "baked"] },
  { name: "Sweet Potato", portion: "1 medium", macros: { calories: 115, protein: 2, carbs: 27, fat: 0 }, keywords: ["sweet", "potato", "yam"] },
  { name: "Mashed Potatoes", portion: "1 cup", macros: { calories: 240, protein: 4, carbs: 35, fat: 9 }, keywords: ["mashed", "potato"] },
  { name: "French Fries", portion: "medium serving", macros: { calories: 365, protein: 4, carbs: 44, fat: 19 }, keywords: ["fries", "french", "chips"] },
  { name: "Tater Tots", portion: "10 pieces", macros: { calories: 170, protein: 2, carbs: 20, fat: 9 }, keywords: ["tater", "tots"] },
  { name: "Couscous", portion: "1 cup cooked", macros: { calories: 175, protein: 6, carbs: 36, fat: 0 }, keywords: ["couscous"] },
  { name: "Polenta", portion: "1 cup", macros: { calories: 145, protein: 3, carbs: 31, fat: 1 }, keywords: ["polenta", "cornmeal"] },
  { name: "Naan Bread", portion: "1 piece", macros: { calories: 260, protein: 9, carbs: 45, fat: 5 }, keywords: ["naan", "bread", "indian"] },
  { name: "Pita Bread", portion: "1 pita", macros: { calories: 165, protein: 5, carbs: 33, fat: 1 }, keywords: ["pita", "bread"] },
  { name: "Crackers (saltine)", portion: "10 crackers", macros: { calories: 130, protein: 3, carbs: 22, fat: 3 }, keywords: ["crackers", "saltine"] },

  // ─── Vegetables ────────────────────────────────────────────────
  { name: "Broccoli (steamed)", portion: "1 cup", macros: { calories: 55, protein: 4, carbs: 11, fat: 1 }, keywords: ["broccoli"] },
  { name: "Spinach (raw)", portion: "2 cups", macros: { calories: 15, protein: 2, carbs: 2, fat: 0 }, keywords: ["spinach"] },
  { name: "Spinach (cooked)", portion: "1 cup", macros: { calories: 40, protein: 5, carbs: 7, fat: 0 }, keywords: ["spinach", "cooked"] },
  { name: "Kale (raw)", portion: "2 cups", macros: { calories: 15, protein: 1, carbs: 2, fat: 0 }, keywords: ["kale"] },
  { name: "Mixed Salad Greens", portion: "2 cups", macros: { calories: 15, protein: 1, carbs: 3, fat: 0 }, keywords: ["salad", "greens", "lettuce", "mixed"] },
  { name: "Romaine Lettuce", portion: "2 cups", macros: { calories: 15, protein: 1, carbs: 3, fat: 0 }, keywords: ["romaine", "lettuce"] },
  { name: "Tomato", portion: "1 medium", macros: { calories: 25, protein: 1, carbs: 5, fat: 0 }, keywords: ["tomato"] },
  { name: "Cherry Tomatoes", portion: "1 cup", macros: { calories: 30, protein: 1, carbs: 6, fat: 0 }, keywords: ["cherry", "tomato"] },
  { name: "Cucumber", portion: "1 medium", macros: { calories: 15, protein: 1, carbs: 4, fat: 0 }, keywords: ["cucumber"] },
  { name: "Bell Pepper", portion: "1 medium", macros: { calories: 25, protein: 1, carbs: 6, fat: 0 }, keywords: ["bell", "pepper"] },
  { name: "Onion", portion: "1 medium", macros: { calories: 45, protein: 1, carbs: 11, fat: 0 }, keywords: ["onion"] },
  { name: "Garlic", portion: "3 cloves", macros: { calories: 15, protein: 1, carbs: 3, fat: 0 }, keywords: ["garlic"] },
  { name: "Mushrooms (sliced)", portion: "1 cup", macros: { calories: 15, protein: 2, carbs: 2, fat: 0 }, keywords: ["mushrooms", "mushroom"] },
  { name: "Zucchini", portion: "1 medium", macros: { calories: 30, protein: 2, carbs: 6, fat: 0 }, keywords: ["zucchini", "squash"] },
  { name: "Asparagus", portion: "6 spears", macros: { calories: 20, protein: 2, carbs: 4, fat: 0 }, keywords: ["asparagus"] },
  { name: "Green Beans", portion: "1 cup", macros: { calories: 35, protein: 2, carbs: 8, fat: 0 }, keywords: ["green", "beans"] },
  { name: "Corn (on the cob)", portion: "1 ear", macros: { calories: 90, protein: 3, carbs: 19, fat: 1 }, keywords: ["corn", "cob"] },
  { name: "Peas (green)", portion: "1 cup", macros: { calories: 115, protein: 8, carbs: 21, fat: 1 }, keywords: ["peas", "green"] },
  { name: "Carrots", portion: "1 cup chopped", macros: { calories: 50, protein: 1, carbs: 12, fat: 0 }, keywords: ["carrots", "carrot"] },
  { name: "Celery", portion: "3 stalks", macros: { calories: 20, protein: 1, carbs: 4, fat: 0 }, keywords: ["celery"] },
  { name: "Cauliflower", portion: "1 cup", macros: { calories: 25, protein: 2, carbs: 5, fat: 0 }, keywords: ["cauliflower"] },
  { name: "Brussels Sprouts", portion: "1 cup", macros: { calories: 55, protein: 4, carbs: 11, fat: 1 }, keywords: ["brussels", "sprouts"] },
  { name: "Cabbage (shredded)", portion: "1 cup", macros: { calories: 20, protein: 1, carbs: 5, fat: 0 }, keywords: ["cabbage", "coleslaw"] },
  { name: "Edamame", portion: "1 cup shelled", macros: { calories: 190, protein: 17, carbs: 14, fat: 8 }, keywords: ["edamame", "soy"] },
  { name: "Avocado", portion: "1/2 medium", macros: { calories: 120, protein: 1, carbs: 6, fat: 11 }, keywords: ["avocado"] },

  // ─── Fruits ────────────────────────────────────────────────────
  { name: "Apple", portion: "1 medium", macros: { calories: 95, protein: 0, carbs: 25, fat: 0 }, keywords: ["apple"] },
  { name: "Banana", portion: "1 medium", macros: { calories: 105, protein: 1, carbs: 27, fat: 0 }, keywords: ["banana"] },
  { name: "Orange", portion: "1 medium", macros: { calories: 65, protein: 1, carbs: 16, fat: 0 }, keywords: ["orange"] },
  { name: "Strawberries", portion: "1 cup", macros: { calories: 50, protein: 1, carbs: 12, fat: 0 }, keywords: ["strawberry", "strawberries", "berries"] },
  { name: "Blueberries", portion: "1 cup", macros: { calories: 85, protein: 1, carbs: 21, fat: 0 }, keywords: ["blueberry", "blueberries", "berries"] },
  { name: "Raspberries", portion: "1 cup", macros: { calories: 65, protein: 1, carbs: 15, fat: 1 }, keywords: ["raspberry", "raspberries", "berries"] },
  { name: "Grapes", portion: "1 cup", macros: { calories: 105, protein: 1, carbs: 27, fat: 0 }, keywords: ["grapes", "grape"] },
  { name: "Watermelon", portion: "2 cups diced", macros: { calories: 90, protein: 2, carbs: 23, fat: 0 }, keywords: ["watermelon", "melon"] },
  { name: "Cantaloupe", portion: "1 cup diced", macros: { calories: 55, protein: 1, carbs: 13, fat: 0 }, keywords: ["cantaloupe", "melon"] },
  { name: "Pineapple", portion: "1 cup", macros: { calories: 80, protein: 1, carbs: 22, fat: 0 }, keywords: ["pineapple"] },
  { name: "Mango", portion: "1 cup", macros: { calories: 100, protein: 1, carbs: 25, fat: 1 }, keywords: ["mango"] },
  { name: "Peach", portion: "1 medium", macros: { calories: 60, protein: 1, carbs: 14, fat: 0 }, keywords: ["peach"] },
  { name: "Pear", portion: "1 medium", macros: { calories: 100, protein: 1, carbs: 27, fat: 0 }, keywords: ["pear"] },
  { name: "Cherries", portion: "1 cup", macros: { calories: 95, protein: 2, carbs: 24, fat: 0 }, keywords: ["cherry", "cherries"] },
  { name: "Kiwi", portion: "2 medium", macros: { calories: 85, protein: 2, carbs: 20, fat: 1 }, keywords: ["kiwi"] },
  { name: "Grapefruit", portion: "1/2 medium", macros: { calories: 40, protein: 1, carbs: 10, fat: 0 }, keywords: ["grapefruit"] },
  { name: "Dried Cranberries", portion: "1/4 cup", macros: { calories: 120, protein: 0, carbs: 33, fat: 0 }, keywords: ["cranberry", "dried", "craisins"] },
  { name: "Raisins", portion: "1/4 cup", macros: { calories: 120, protein: 1, carbs: 32, fat: 0 }, keywords: ["raisins"] },
  { name: "Dates (Medjool)", portion: "2 dates", macros: { calories: 130, protein: 1, carbs: 36, fat: 0 }, keywords: ["dates", "medjool"] },

  // ─── Dairy ─────────────────────────────────────────────────────
  { name: "Milk (whole)", portion: "1 cup", macros: { calories: 150, protein: 8, carbs: 12, fat: 8 }, keywords: ["milk", "whole"] },
  { name: "Milk (2%)", portion: "1 cup", macros: { calories: 120, protein: 8, carbs: 12, fat: 5 }, keywords: ["milk", "2%"] },
  { name: "Milk (skim)", portion: "1 cup", macros: { calories: 90, protein: 8, carbs: 12, fat: 0 }, keywords: ["milk", "skim", "nonfat"] },
  { name: "Almond Milk (unsweetened)", portion: "1 cup", macros: { calories: 30, protein: 1, carbs: 1, fat: 3 }, keywords: ["almond", "milk"] },
  { name: "Oat Milk", portion: "1 cup", macros: { calories: 120, protein: 3, carbs: 16, fat: 5 }, keywords: ["oat", "milk"] },
  { name: "Greek Yogurt (plain, nonfat)", portion: "1 cup", macros: { calories: 130, protein: 22, carbs: 9, fat: 0 }, keywords: ["greek", "yogurt"] },
  { name: "Greek Yogurt (plain, whole)", portion: "1 cup", macros: { calories: 220, protein: 20, carbs: 9, fat: 11 }, keywords: ["greek", "yogurt", "whole"] },
  { name: "Yogurt (flavored)", portion: "6 oz", macros: { calories: 150, protein: 6, carbs: 26, fat: 2 }, keywords: ["yogurt", "flavored"] },
  { name: "Cottage Cheese (low-fat)", portion: "1 cup", macros: { calories: 160, protein: 28, carbs: 6, fat: 2 }, keywords: ["cottage", "cheese"] },
  { name: "Cheddar Cheese", portion: "1 oz", macros: { calories: 115, protein: 7, carbs: 0, fat: 9 }, keywords: ["cheddar", "cheese"] },
  { name: "Mozzarella Cheese", portion: "1 oz", macros: { calories: 85, protein: 6, carbs: 1, fat: 6 }, keywords: ["mozzarella", "cheese"] },
  { name: "Parmesan Cheese", portion: "2 tbsp grated", macros: { calories: 45, protein: 4, carbs: 0, fat: 3 }, keywords: ["parmesan", "cheese"] },
  { name: "Cream Cheese", portion: "2 tbsp", macros: { calories: 100, protein: 2, carbs: 1, fat: 10 }, keywords: ["cream", "cheese"] },
  { name: "Swiss Cheese", portion: "1 oz", macros: { calories: 110, protein: 8, carbs: 2, fat: 8 }, keywords: ["swiss", "cheese"] },
  { name: "Butter", portion: "1 tbsp", macros: { calories: 100, protein: 0, carbs: 0, fat: 11 }, keywords: ["butter"] },
  { name: "Sour Cream", portion: "2 tbsp", macros: { calories: 60, protein: 1, carbs: 1, fat: 5 }, keywords: ["sour", "cream"] },
  { name: "Heavy Cream", portion: "2 tbsp", macros: { calories: 100, protein: 1, carbs: 1, fat: 11 }, keywords: ["heavy", "cream", "whipping"] },
  { name: "Ice Cream (vanilla)", portion: "1/2 cup", macros: { calories: 140, protein: 2, carbs: 16, fat: 7 }, keywords: ["ice", "cream", "vanilla"] },

  // ─── Legumes & Beans ───────────────────────────────────────────
  { name: "Black Beans", portion: "1 cup cooked", macros: { calories: 225, protein: 15, carbs: 41, fat: 1 }, keywords: ["black", "beans"] },
  { name: "Chickpeas", portion: "1 cup cooked", macros: { calories: 270, protein: 15, carbs: 45, fat: 4 }, keywords: ["chickpeas", "garbanzo"] },
  { name: "Lentils", portion: "1 cup cooked", macros: { calories: 230, protein: 18, carbs: 40, fat: 1 }, keywords: ["lentils"] },
  { name: "Kidney Beans", portion: "1 cup cooked", macros: { calories: 225, protein: 15, carbs: 40, fat: 1 }, keywords: ["kidney", "beans"] },
  { name: "Pinto Beans", portion: "1 cup cooked", macros: { calories: 245, protein: 15, carbs: 44, fat: 1 }, keywords: ["pinto", "beans"] },
  { name: "Refried Beans", portion: "1/2 cup", macros: { calories: 120, protein: 7, carbs: 20, fat: 2 }, keywords: ["refried", "beans"] },
  { name: "Hummus", portion: "1/4 cup", macros: { calories: 100, protein: 5, carbs: 9, fat: 6 }, keywords: ["hummus"] },

  // ─── Nuts & Seeds ──────────────────────────────────────────────
  { name: "Almonds", portion: "1 oz (23 nuts)", macros: { calories: 165, protein: 6, carbs: 6, fat: 14 }, keywords: ["almonds", "almond"] },
  { name: "Peanuts", portion: "1 oz", macros: { calories: 165, protein: 7, carbs: 5, fat: 14 }, keywords: ["peanuts", "peanut"] },
  { name: "Peanut Butter", portion: "2 tbsp", macros: { calories: 190, protein: 7, carbs: 7, fat: 16 }, keywords: ["peanut", "butter"] },
  { name: "Almond Butter", portion: "2 tbsp", macros: { calories: 195, protein: 7, carbs: 6, fat: 18 }, keywords: ["almond", "butter"] },
  { name: "Walnuts", portion: "1 oz", macros: { calories: 185, protein: 4, carbs: 4, fat: 18 }, keywords: ["walnuts", "walnut"] },
  { name: "Cashews", portion: "1 oz", macros: { calories: 155, protein: 5, carbs: 9, fat: 12 }, keywords: ["cashews", "cashew"] },
  { name: "Pecans", portion: "1 oz", macros: { calories: 195, protein: 3, carbs: 4, fat: 20 }, keywords: ["pecans", "pecan"] },
  { name: "Pistachios", portion: "1 oz", macros: { calories: 160, protein: 6, carbs: 8, fat: 13 }, keywords: ["pistachios", "pistachio"] },
  { name: "Sunflower Seeds", portion: "1 oz", macros: { calories: 165, protein: 6, carbs: 7, fat: 14 }, keywords: ["sunflower", "seeds"] },
  { name: "Chia Seeds", portion: "2 tbsp", macros: { calories: 140, protein: 5, carbs: 12, fat: 9 }, keywords: ["chia", "seeds"] },
  { name: "Flax Seeds (ground)", portion: "2 tbsp", macros: { calories: 75, protein: 3, carbs: 4, fat: 6 }, keywords: ["flax", "seeds"] },
  { name: "Trail Mix", portion: "1/4 cup", macros: { calories: 175, protein: 5, carbs: 15, fat: 11 }, keywords: ["trail", "mix"] },
  { name: "Mixed Nuts", portion: "1 oz", macros: { calories: 175, protein: 5, carbs: 6, fat: 16 }, keywords: ["mixed", "nuts"] },

  // ─── Oils & Fats ───────────────────────────────────────────────
  { name: "Olive Oil", portion: "1 tbsp", macros: { calories: 120, protein: 0, carbs: 0, fat: 14 }, keywords: ["olive", "oil"] },
  { name: "Coconut Oil", portion: "1 tbsp", macros: { calories: 120, protein: 0, carbs: 0, fat: 14 }, keywords: ["coconut", "oil"] },
  { name: "Vegetable Oil", portion: "1 tbsp", macros: { calories: 120, protein: 0, carbs: 0, fat: 14 }, keywords: ["vegetable", "oil", "canola"] },
  { name: "Mayonnaise", portion: "1 tbsp", macros: { calories: 95, protein: 0, carbs: 0, fat: 10 }, keywords: ["mayo", "mayonnaise"] },
  { name: "Ranch Dressing", portion: "2 tbsp", macros: { calories: 130, protein: 0, carbs: 2, fat: 13 }, keywords: ["ranch", "dressing"] },
  { name: "Italian Dressing", portion: "2 tbsp", macros: { calories: 70, protein: 0, carbs: 3, fat: 6 }, keywords: ["italian", "dressing"] },
  { name: "Balsamic Vinaigrette", portion: "2 tbsp", macros: { calories: 90, protein: 0, carbs: 4, fat: 8 }, keywords: ["balsamic", "vinaigrette", "dressing"] },
  { name: "Caesar Dressing", portion: "2 tbsp", macros: { calories: 150, protein: 1, carbs: 1, fat: 16 }, keywords: ["caesar", "dressing"] },
  { name: "Blue Cheese Dressing", portion: "2 tbsp", macros: { calories: 150, protein: 1, carbs: 2, fat: 15 }, keywords: ["blue", "cheese", "dressing"] },

  // ─── Sauces & Condiments ───────────────────────────────────────
  { name: "Ketchup", portion: "2 tbsp", macros: { calories: 40, protein: 0, carbs: 10, fat: 0 }, keywords: ["ketchup"] },
  { name: "Mustard", portion: "1 tbsp", macros: { calories: 10, protein: 1, carbs: 1, fat: 0 }, keywords: ["mustard"] },
  { name: "BBQ Sauce", portion: "2 tbsp", macros: { calories: 50, protein: 0, carbs: 12, fat: 0 }, keywords: ["bbq", "barbecue", "sauce"] },
  { name: "Hot Sauce", portion: "1 tsp", macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, keywords: ["hot", "sauce", "sriracha", "tabasco"] },
  { name: "Soy Sauce", portion: "1 tbsp", macros: { calories: 10, protein: 1, carbs: 1, fat: 0 }, keywords: ["soy", "sauce"] },
  { name: "Teriyaki Sauce", portion: "2 tbsp", macros: { calories: 30, protein: 2, carbs: 6, fat: 0 }, keywords: ["teriyaki", "sauce"] },
  { name: "Salsa", portion: "1/4 cup", macros: { calories: 20, protein: 1, carbs: 4, fat: 0 }, keywords: ["salsa"] },
  { name: "Guacamole", portion: "1/4 cup", macros: { calories: 90, protein: 1, carbs: 5, fat: 8 }, keywords: ["guacamole", "guac"] },
  { name: "Marinara Sauce", portion: "1/2 cup", macros: { calories: 70, protein: 2, carbs: 10, fat: 3 }, keywords: ["marinara", "tomato", "sauce", "pasta"] },
  { name: "Pesto", portion: "2 tbsp", macros: { calories: 160, protein: 3, carbs: 2, fat: 15 }, keywords: ["pesto", "basil"] },
  { name: "Honey", portion: "1 tbsp", macros: { calories: 65, protein: 0, carbs: 17, fat: 0 }, keywords: ["honey"] },
  { name: "Maple Syrup", portion: "2 tbsp", macros: { calories: 105, protein: 0, carbs: 27, fat: 0 }, keywords: ["maple", "syrup"] },
  { name: "Jam/Jelly", portion: "1 tbsp", macros: { calories: 50, protein: 0, carbs: 13, fat: 0 }, keywords: ["jam", "jelly"] },

  // ─── Prepared Meals & Fast Food ────────────────────────────────
  { name: "Cheeseburger", portion: "1 burger", macros: { calories: 530, protein: 28, carbs: 36, fat: 31 }, keywords: ["cheeseburger", "burger"] },
  { name: "Hamburger", portion: "1 burger", macros: { calories: 450, protein: 25, carbs: 34, fat: 24 }, keywords: ["hamburger", "burger"] },
  { name: "Chicken Sandwich (fried)", portion: "1 sandwich", macros: { calories: 490, protein: 25, carbs: 46, fat: 22 }, keywords: ["chicken", "sandwich", "fried"] },
  { name: "Chicken Sandwich (grilled)", portion: "1 sandwich", macros: { calories: 370, protein: 32, carbs: 37, fat: 10 }, keywords: ["chicken", "sandwich", "grilled"] },
  { name: "Hot Dog", portion: "1 with bun", macros: { calories: 310, protein: 11, carbs: 24, fat: 19 }, keywords: ["hot", "dog", "hotdog"] },
  { name: "Pizza (cheese, 1 slice)", portion: "1 slice", macros: { calories: 270, protein: 12, carbs: 33, fat: 10 }, keywords: ["pizza", "cheese"] },
  { name: "Pizza (pepperoni, 1 slice)", portion: "1 slice", macros: { calories: 310, protein: 13, carbs: 33, fat: 14 }, keywords: ["pizza", "pepperoni"] },
  { name: "Burrito (bean & cheese)", portion: "1 burrito", macros: { calories: 450, protein: 18, carbs: 55, fat: 18 }, keywords: ["burrito"] },
  { name: "Burrito Bowl", portion: "1 bowl", macros: { calories: 650, protein: 35, carbs: 70, fat: 22 }, keywords: ["burrito", "bowl", "chipotle"] },
  { name: "Taco (beef, hard shell)", portion: "1 taco", macros: { calories: 210, protein: 10, carbs: 15, fat: 12 }, keywords: ["taco", "beef"] },
  { name: "Taco (chicken, soft)", portion: "1 taco", macros: { calories: 190, protein: 15, carbs: 20, fat: 6 }, keywords: ["taco", "chicken"] },
  { name: "Quesadilla (cheese)", portion: "1 quesadilla", macros: { calories: 490, protein: 20, carbs: 40, fat: 28 }, keywords: ["quesadilla"] },
  { name: "Nachos with Cheese", portion: "1 plate", macros: { calories: 570, protein: 14, carbs: 55, fat: 33 }, keywords: ["nachos"] },
  { name: "Chicken Nuggets", portion: "6 pieces", macros: { calories: 280, protein: 14, carbs: 18, fat: 17 }, keywords: ["chicken", "nuggets", "mcnuggets"] },
  { name: "Fish and Chips", portion: "1 serving", macros: { calories: 650, protein: 30, carbs: 60, fat: 30 }, keywords: ["fish", "chips", "fried"] },
  { name: "Grilled Cheese Sandwich", portion: "1 sandwich", macros: { calories: 370, protein: 14, carbs: 28, fat: 23 }, keywords: ["grilled", "cheese", "sandwich"] },
  { name: "BLT Sandwich", portion: "1 sandwich", macros: { calories: 350, protein: 15, carbs: 28, fat: 20 }, keywords: ["blt", "bacon", "lettuce", "tomato", "sandwich"] },
  { name: "Club Sandwich", portion: "1 sandwich", macros: { calories: 550, protein: 30, carbs: 40, fat: 30 }, keywords: ["club", "sandwich"] },
  { name: "Wrap (chicken caesar)", portion: "1 wrap", macros: { calories: 470, protein: 28, carbs: 35, fat: 24 }, keywords: ["wrap", "chicken", "caesar"] },
  { name: "Sub Sandwich (6\")", portion: "6 inch", macros: { calories: 380, protein: 22, carbs: 42, fat: 14 }, keywords: ["sub", "subway", "hoagie"] },
  { name: "Sushi Roll (California)", portion: "8 pieces", macros: { calories: 260, protein: 9, carbs: 38, fat: 7 }, keywords: ["sushi", "california", "roll"] },
  { name: "Sushi (salmon nigiri)", portion: "4 pieces", macros: { calories: 200, protein: 16, carbs: 24, fat: 4 }, keywords: ["sushi", "salmon", "nigiri"] },
  { name: "Pad Thai", portion: "1 plate", macros: { calories: 550, protein: 22, carbs: 65, fat: 22 }, keywords: ["pad", "thai", "noodles"] },
  { name: "Fried Rice", portion: "1 cup", macros: { calories: 340, protein: 10, carbs: 45, fat: 13 }, keywords: ["fried", "rice"] },
  { name: "Stir Fry (chicken & veg)", portion: "1 plate", macros: { calories: 380, protein: 30, carbs: 25, fat: 18 }, keywords: ["stir", "fry", "stirfry"] },
  { name: "Ramen (pork tonkotsu)", portion: "1 bowl", macros: { calories: 550, protein: 25, carbs: 60, fat: 22 }, keywords: ["ramen", "noodle", "soup"] },
  { name: "Pho (beef)", portion: "1 bowl", macros: { calories: 420, protein: 25, carbs: 50, fat: 12 }, keywords: ["pho", "vietnamese", "soup"] },
  { name: "Mac and Cheese", portion: "1 cup", macros: { calories: 380, protein: 14, carbs: 40, fat: 18 }, keywords: ["mac", "cheese", "macaroni"] },
  { name: "Lasagna", portion: "1 piece", macros: { calories: 380, protein: 22, carbs: 35, fat: 17 }, keywords: ["lasagna"] },
  { name: "Spaghetti with Meat Sauce", portion: "1 plate", macros: { calories: 470, protein: 24, carbs: 55, fat: 16 }, keywords: ["spaghetti", "meat", "sauce", "bolognese"] },
  { name: "Chicken Alfredo", portion: "1 plate", macros: { calories: 600, protein: 35, carbs: 50, fat: 28 }, keywords: ["chicken", "alfredo", "pasta"] },
  { name: "Miso Soup", portion: "1 cup", macros: { calories: 40, protein: 3, carbs: 5, fat: 1 }, keywords: ["miso", "soup"] },
  { name: "Chicken Noodle Soup", portion: "1 cup", macros: { calories: 120, protein: 8, carbs: 15, fat: 3 }, keywords: ["chicken", "noodle", "soup"] },
  { name: "Tomato Soup", portion: "1 cup", macros: { calories: 150, protein: 4, carbs: 22, fat: 5 }, keywords: ["tomato", "soup"] },
  { name: "Chili (beef)", portion: "1 cup", macros: { calories: 290, protein: 22, carbs: 25, fat: 12 }, keywords: ["chili"] },
  { name: "Curry (chicken tikka masala)", portion: "1 cup", macros: { calories: 350, protein: 22, carbs: 18, fat: 22 }, keywords: ["curry", "tikka", "masala", "indian"] },
  { name: "Butter Chicken", portion: "1 cup", macros: { calories: 390, protein: 25, carbs: 14, fat: 26 }, keywords: ["butter", "chicken", "indian"] },
  { name: "Dal (lentil curry)", portion: "1 cup", macros: { calories: 230, protein: 12, carbs: 34, fat: 5 }, keywords: ["dal", "daal", "lentil", "curry"] },
  { name: "Fried Chicken (2 pieces)", portion: "breast + thigh", macros: { calories: 550, protein: 42, carbs: 18, fat: 35 }, keywords: ["fried", "chicken"] },
  { name: "Rotisserie Chicken (breast)", portion: "1 breast", macros: { calories: 280, protein: 42, carbs: 0, fat: 12 }, keywords: ["rotisserie", "chicken"] },
  { name: "Meatballs", portion: "4 meatballs", macros: { calories: 300, protein: 20, carbs: 10, fat: 20 }, keywords: ["meatballs", "meatball"] },
  { name: "Meat Loaf", portion: "1 slice", macros: { calories: 280, protein: 18, carbs: 12, fat: 18 }, keywords: ["meatloaf"] },

  // ─── Soups & Salads ────────────────────────────────────────────
  { name: "Caesar Salad", portion: "1 bowl", macros: { calories: 280, protein: 8, carbs: 14, fat: 22 }, keywords: ["caesar", "salad"] },
  { name: "Cobb Salad", portion: "1 bowl", macros: { calories: 450, protein: 30, carbs: 12, fat: 32 }, keywords: ["cobb", "salad"] },
  { name: "Garden Salad", portion: "1 bowl", macros: { calories: 80, protein: 3, carbs: 12, fat: 2 }, keywords: ["garden", "salad"] },
  { name: "Greek Salad", portion: "1 bowl", macros: { calories: 200, protein: 6, carbs: 10, fat: 16 }, keywords: ["greek", "salad"] },
  { name: "Chicken Salad", portion: "1 cup", macros: { calories: 350, protein: 22, carbs: 8, fat: 26 }, keywords: ["chicken", "salad"] },
  { name: "Tuna Salad", portion: "1 cup", macros: { calories: 290, protein: 22, carbs: 10, fat: 18 }, keywords: ["tuna", "salad"] },
  { name: "Minestrone Soup", portion: "1 cup", macros: { calories: 120, protein: 5, carbs: 20, fat: 2 }, keywords: ["minestrone", "soup"] },
  { name: "Clam Chowder", portion: "1 cup", macros: { calories: 250, protein: 10, carbs: 22, fat: 14 }, keywords: ["clam", "chowder", "soup"] },

  // ─── Snacks ────────────────────────────────────────────────────
  { name: "Protein Bar", portion: "1 bar", macros: { calories: 230, protein: 20, carbs: 25, fat: 8 }, keywords: ["protein", "bar"] },
  { name: "Granola Bar", portion: "1 bar", macros: { calories: 190, protein: 4, carbs: 28, fat: 7 }, keywords: ["granola", "bar"] },
  { name: "Rice Cake", portion: "2 cakes", macros: { calories: 70, protein: 2, carbs: 15, fat: 0 }, keywords: ["rice", "cake"] },
  { name: "Popcorn (air-popped)", portion: "3 cups", macros: { calories: 95, protein: 3, carbs: 19, fat: 1 }, keywords: ["popcorn"] },
  { name: "Potato Chips", portion: "1 oz (15 chips)", macros: { calories: 155, protein: 2, carbs: 15, fat: 10 }, keywords: ["chips", "potato"] },
  { name: "Tortilla Chips", portion: "1 oz", macros: { calories: 140, protein: 2, carbs: 18, fat: 7 }, keywords: ["tortilla", "chips"] },
  { name: "Pretzels", portion: "1 oz", macros: { calories: 110, protein: 3, carbs: 23, fat: 1 }, keywords: ["pretzels"] },
  { name: "String Cheese", portion: "1 stick", macros: { calories: 80, protein: 7, carbs: 1, fat: 5 }, keywords: ["string", "cheese"] },
  { name: "Beef Jerky", portion: "1 oz", macros: { calories: 80, protein: 13, carbs: 3, fat: 1 }, keywords: ["beef", "jerky"] },
  { name: "Dark Chocolate", portion: "1 oz", macros: { calories: 170, protein: 2, carbs: 13, fat: 12 }, keywords: ["dark", "chocolate"] },
  { name: "Milk Chocolate", portion: "1 oz", macros: { calories: 150, protein: 2, carbs: 17, fat: 9 }, keywords: ["milk", "chocolate"] },
  { name: "Cookie (chocolate chip)", portion: "1 large", macros: { calories: 220, protein: 3, carbs: 30, fat: 11 }, keywords: ["cookie", "chocolate", "chip"] },
  { name: "Brownie", portion: "1 piece", macros: { calories: 230, protein: 3, carbs: 30, fat: 12 }, keywords: ["brownie"] },
  { name: "Donut (glazed)", portion: "1 donut", macros: { calories: 260, protein: 3, carbs: 31, fat: 14 }, keywords: ["donut", "doughnut", "glazed"] },
  { name: "Muffin (blueberry)", portion: "1 large", macros: { calories: 350, protein: 5, carbs: 52, fat: 14 }, keywords: ["muffin", "blueberry"] },
  { name: "Croissant", portion: "1 croissant", macros: { calories: 230, protein: 5, carbs: 26, fat: 12 }, keywords: ["croissant"] },
  { name: "Cinnamon Roll", portion: "1 roll", macros: { calories: 420, protein: 6, carbs: 58, fat: 18 }, keywords: ["cinnamon", "roll"] },
  { name: "Apple Pie (1 slice)", portion: "1 slice", macros: { calories: 300, protein: 3, carbs: 43, fat: 14 }, keywords: ["apple", "pie"] },
  { name: "Cheesecake (1 slice)", portion: "1 slice", macros: { calories: 400, protein: 7, carbs: 30, fat: 28 }, keywords: ["cheesecake"] },

  // ─── Beverages ─────────────────────────────────────────────────
  { name: "Coffee (black)", portion: "8 oz", macros: { calories: 5, protein: 0, carbs: 0, fat: 0 }, keywords: ["coffee", "black"] },
  { name: "Coffee with Cream & Sugar", portion: "8 oz", macros: { calories: 70, protein: 1, carbs: 9, fat: 3 }, keywords: ["coffee", "cream", "sugar"] },
  { name: "Latte", portion: "12 oz", macros: { calories: 150, protein: 8, carbs: 12, fat: 8 }, keywords: ["latte", "coffee"] },
  { name: "Cappuccino", portion: "8 oz", macros: { calories: 80, protein: 4, carbs: 6, fat: 4 }, keywords: ["cappuccino", "coffee"] },
  { name: "Mocha", portion: "12 oz", macros: { calories: 290, protein: 8, carbs: 38, fat: 12 }, keywords: ["mocha", "coffee", "chocolate"] },
  { name: "Iced Coffee", portion: "16 oz", macros: { calories: 100, protein: 2, carbs: 15, fat: 3 }, keywords: ["iced", "coffee"] },
  { name: "Tea (unsweetened)", portion: "8 oz", macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, keywords: ["tea"] },
  { name: "Sweet Tea", portion: "16 oz", macros: { calories: 140, protein: 0, carbs: 36, fat: 0 }, keywords: ["sweet", "tea"] },
  { name: "Orange Juice", portion: "8 oz", macros: { calories: 110, protein: 2, carbs: 26, fat: 0 }, keywords: ["orange", "juice", "oj"] },
  { name: "Apple Juice", portion: "8 oz", macros: { calories: 115, protein: 0, carbs: 28, fat: 0 }, keywords: ["apple", "juice"] },
  { name: "Smoothie (fruit)", portion: "16 oz", macros: { calories: 280, protein: 4, carbs: 62, fat: 2 }, keywords: ["smoothie", "fruit"] },
  { name: "Protein Shake", portion: "16 oz", macros: { calories: 250, protein: 30, carbs: 20, fat: 5 }, keywords: ["protein", "shake"] },
  { name: "Soda (cola)", portion: "12 oz can", macros: { calories: 140, protein: 0, carbs: 39, fat: 0 }, keywords: ["soda", "cola", "coke", "pepsi"] },
  { name: "Diet Soda", portion: "12 oz can", macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, keywords: ["diet", "soda", "zero"] },
  { name: "Sparkling Water", portion: "12 oz", macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, keywords: ["sparkling", "water", "seltzer"] },
  { name: "Sports Drink (Gatorade)", portion: "20 oz", macros: { calories: 140, protein: 0, carbs: 36, fat: 0 }, keywords: ["sports", "drink", "gatorade"] },
  { name: "Energy Drink", portion: "8 oz", macros: { calories: 110, protein: 1, carbs: 27, fat: 0 }, keywords: ["energy", "drink", "redbull", "monster"] },
  { name: "Beer (regular)", portion: "12 oz", macros: { calories: 150, protein: 2, carbs: 13, fat: 0 }, keywords: ["beer"] },
  { name: "Beer (light)", portion: "12 oz", macros: { calories: 100, protein: 1, carbs: 6, fat: 0 }, keywords: ["beer", "light"] },
  { name: "Wine (red)", portion: "5 oz", macros: { calories: 125, protein: 0, carbs: 4, fat: 0 }, keywords: ["wine", "red"] },
  { name: "Wine (white)", portion: "5 oz", macros: { calories: 120, protein: 0, carbs: 4, fat: 0 }, keywords: ["wine", "white"] },
  { name: "Margarita", portion: "8 oz", macros: { calories: 275, protein: 0, carbs: 17, fat: 0 }, keywords: ["margarita", "cocktail"] },
  { name: "Mimosa", portion: "6 oz", macros: { calories: 120, protein: 0, carbs: 12, fat: 0 }, keywords: ["mimosa", "cocktail", "brunch"] },
  { name: "Vodka/Whiskey/Rum (1 shot)", portion: "1.5 oz", macros: { calories: 100, protein: 0, carbs: 0, fat: 0 }, keywords: ["vodka", "whiskey", "rum", "gin", "tequila", "shot", "spirit"] },
  { name: "Coconut Water", portion: "8 oz", macros: { calories: 45, protein: 0, carbs: 11, fat: 0 }, keywords: ["coconut", "water"] },
  { name: "Hot Chocolate", portion: "8 oz", macros: { calories: 190, protein: 6, carbs: 28, fat: 6 }, keywords: ["hot", "chocolate", "cocoa"] },
  { name: "Kombucha", portion: "8 oz", macros: { calories: 30, protein: 0, carbs: 7, fat: 0 }, keywords: ["kombucha"] },
  { name: "Lemonade", portion: "8 oz", macros: { calories: 100, protein: 0, carbs: 26, fat: 0 }, keywords: ["lemonade"] },

  // ─── Breakfast Items ───────────────────────────────────────────
  { name: "Avocado Toast", portion: "2 slices", macros: { calories: 380, protein: 10, carbs: 36, fat: 22 }, keywords: ["avocado", "toast"] },
  { name: "Breakfast Burrito", portion: "1 burrito", macros: { calories: 450, protein: 20, carbs: 40, fat: 23 }, keywords: ["breakfast", "burrito"] },
  { name: "Eggs Benedict", portion: "1 serving", macros: { calories: 450, protein: 22, carbs: 25, fat: 28 }, keywords: ["eggs", "benedict"] },
  { name: "Breakfast Sandwich", portion: "1 sandwich", macros: { calories: 350, protein: 18, carbs: 28, fat: 18 }, keywords: ["breakfast", "sandwich", "egg"] },
  { name: "Acai Bowl", portion: "1 bowl", macros: { calories: 380, protein: 6, carbs: 65, fat: 12 }, keywords: ["acai", "bowl"] },
  { name: "Overnight Oats", portion: "1 cup", macros: { calories: 300, protein: 12, carbs: 42, fat: 10 }, keywords: ["overnight", "oats"] },
  { name: "Yogurt Parfait", portion: "1 parfait", macros: { calories: 280, protein: 12, carbs: 42, fat: 8 }, keywords: ["yogurt", "parfait", "granola"] },
  { name: "Hash Browns", portion: "1 cup", macros: { calories: 210, protein: 2, carbs: 24, fat: 12 }, keywords: ["hash", "browns", "hashbrowns"] },
  { name: "Sausage Link", portion: "2 links", macros: { calories: 170, protein: 9, carbs: 1, fat: 14 }, keywords: ["sausage", "link", "breakfast"] },
  { name: "Sausage Patty", portion: "2 patties", macros: { calories: 200, protein: 10, carbs: 1, fat: 17 }, keywords: ["sausage", "patty", "breakfast"] },

  // ─── International Cuisine ─────────────────────────────────────
  { name: "Spring Roll (fried)", portion: "2 rolls", macros: { calories: 260, protein: 6, carbs: 28, fat: 14 }, keywords: ["spring", "roll", "egg", "fried"] },
  { name: "Summer Roll (fresh)", portion: "2 rolls", macros: { calories: 150, protein: 8, carbs: 22, fat: 3 }, keywords: ["summer", "roll", "fresh", "vietnamese"] },
  { name: "Dumplings (pork)", portion: "6 dumplings", macros: { calories: 280, protein: 14, carbs: 30, fat: 12 }, keywords: ["dumplings", "potstickers", "gyoza"] },
  { name: "Wontons", portion: "6 pieces", macros: { calories: 250, protein: 10, carbs: 28, fat: 10 }, keywords: ["wontons", "wonton"] },
  { name: "Egg Drop Soup", portion: "1 cup", macros: { calories: 65, protein: 4, carbs: 6, fat: 2 }, keywords: ["egg", "drop", "soup", "chinese"] },
  { name: "Kung Pao Chicken", portion: "1 cup", macros: { calories: 350, protein: 25, carbs: 18, fat: 20 }, keywords: ["kung", "pao", "chicken", "chinese"] },
  { name: "General Tso's Chicken", portion: "1 cup", macros: { calories: 420, protein: 20, carbs: 35, fat: 22 }, keywords: ["general", "tso", "chicken", "chinese"] },
  { name: "Lo Mein", portion: "1 cup", macros: { calories: 280, protein: 10, carbs: 35, fat: 11 }, keywords: ["lo", "mein", "noodles", "chinese"] },
  { name: "Chow Mein", portion: "1 cup", macros: { calories: 260, protein: 9, carbs: 32, fat: 11 }, keywords: ["chow", "mein", "noodles"] },
  { name: "Sweet and Sour Chicken", portion: "1 cup", macros: { calories: 340, protein: 18, carbs: 38, fat: 12 }, keywords: ["sweet", "sour", "chicken", "chinese"] },
  { name: "Bibimbap", portion: "1 bowl", macros: { calories: 500, protein: 25, carbs: 60, fat: 18 }, keywords: ["bibimbap", "korean"] },
  { name: "Kimchi", portion: "1/2 cup", macros: { calories: 15, protein: 1, carbs: 2, fat: 0 }, keywords: ["kimchi", "korean"] },
  { name: "Falafel", portion: "4 pieces", macros: { calories: 230, protein: 10, carbs: 24, fat: 12 }, keywords: ["falafel", "middle eastern"] },
  { name: "Shawarma (chicken)", portion: "1 wrap", macros: { calories: 430, protein: 30, carbs: 38, fat: 18 }, keywords: ["shawarma", "chicken", "wrap"] },
  { name: "Gyro", portion: "1 gyro", macros: { calories: 500, protein: 25, carbs: 38, fat: 28 }, keywords: ["gyro", "greek"] },
  { name: "Basmati Rice", portion: "1 cup cooked", macros: { calories: 210, protein: 4, carbs: 45, fat: 0 }, keywords: ["basmati", "rice", "indian"] },
  { name: "Samosa", portion: "2 samosas", macros: { calories: 300, protein: 6, carbs: 34, fat: 16 }, keywords: ["samosa", "indian"] },
  { name: "Tabbouleh", portion: "1 cup", macros: { calories: 170, protein: 4, carbs: 20, fat: 9 }, keywords: ["tabbouleh", "tabouli"] },
  { name: "Spanakopita", portion: "1 piece", macros: { calories: 200, protein: 6, carbs: 14, fat: 13 }, keywords: ["spanakopita", "greek", "spinach"] },
  { name: "Paella", portion: "1 cup", macros: { calories: 320, protein: 18, carbs: 40, fat: 10 }, keywords: ["paella", "spanish", "rice"] },

  // ─── Supplements & Extras ──────────────────────────────────────
  { name: "Whey Protein Powder", portion: "1 scoop", macros: { calories: 120, protein: 24, carbs: 3, fat: 1 }, keywords: ["whey", "protein", "powder", "scoop"] },
  { name: "Creatine", portion: "5g", macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, keywords: ["creatine"] },
  { name: "Collagen Peptides", portion: "2 scoops", macros: { calories: 70, protein: 18, carbs: 0, fat: 0 }, keywords: ["collagen", "peptides"] },
  { name: "MCT Oil", portion: "1 tbsp", macros: { calories: 120, protein: 0, carbs: 0, fat: 14 }, keywords: ["mct", "oil"] },
  { name: "Protein Pancake Mix", portion: "1/3 cup dry", macros: { calories: 180, protein: 20, carbs: 18, fat: 3 }, keywords: ["protein", "pancake"] },

  // ─── Additional Snacks & Sides ─────────────────────────────────
  { name: "Coleslaw", portion: "1/2 cup", macros: { calories: 80, protein: 1, carbs: 9, fat: 5 }, keywords: ["coleslaw", "slaw"] },
  { name: "Corn Bread", portion: "1 piece", macros: { calories: 175, protein: 4, carbs: 28, fat: 5 }, keywords: ["cornbread", "corn", "bread"] },
  { name: "Biscuit", portion: "1 biscuit", macros: { calories: 200, protein: 4, carbs: 24, fat: 10 }, keywords: ["biscuit"] },
  { name: "Dinner Roll", portion: "1 roll", macros: { calories: 90, protein: 3, carbs: 15, fat: 2 }, keywords: ["roll", "dinner", "bread"] },
  { name: "Garlic Bread", portion: "1 slice", macros: { calories: 175, protein: 4, carbs: 20, fat: 9 }, keywords: ["garlic", "bread"] },
  { name: "Onion Rings", portion: "6 rings", macros: { calories: 280, protein: 4, carbs: 30, fat: 16 }, keywords: ["onion", "rings", "fried"] },
  { name: "Mozzarella Sticks", portion: "4 sticks", macros: { calories: 320, protein: 16, carbs: 24, fat: 18 }, keywords: ["mozzarella", "sticks", "fried"] },
  { name: "Chips and Salsa", portion: "10 chips + salsa", macros: { calories: 160, protein: 2, carbs: 22, fat: 7 }, keywords: ["chips", "salsa"] },
  { name: "Bruschetta", portion: "3 pieces", macros: { calories: 180, protein: 4, carbs: 22, fat: 9 }, keywords: ["bruschetta"] },
  { name: "Stuffing", portion: "1/2 cup", macros: { calories: 175, protein: 3, carbs: 21, fat: 9 }, keywords: ["stuffing", "dressing"] },
  { name: "Gravy", portion: "1/4 cup", macros: { calories: 50, protein: 1, carbs: 4, fat: 3 }, keywords: ["gravy"] },
  { name: "Cranberry Sauce", portion: "1/4 cup", macros: { calories: 110, protein: 0, carbs: 28, fat: 0 }, keywords: ["cranberry", "sauce"] },

  // ─── More Fruits & Produce ─────────────────────────────────────
  { name: "Banana Chips", portion: "1 oz", macros: { calories: 150, protein: 1, carbs: 17, fat: 10 }, keywords: ["banana", "chips"] },
  { name: "Dried Mango", portion: "1/4 cup", macros: { calories: 120, protein: 1, carbs: 30, fat: 0 }, keywords: ["dried", "mango"] },
  { name: "Applesauce", portion: "1/2 cup", macros: { calories: 50, protein: 0, carbs: 14, fat: 0 }, keywords: ["applesauce"] },
  { name: "Fruit Cup", portion: "1 cup", macros: { calories: 70, protein: 0, carbs: 18, fat: 0 }, keywords: ["fruit", "cup"] },
  { name: "Plantain (fried)", portion: "1 cup", macros: { calories: 280, protein: 2, carbs: 42, fat: 12 }, keywords: ["plantain", "fried"] },

  // ─── Frozen & Convenience ──────────────────────────────────────
  { name: "Frozen Pizza (whole)", portion: "1/3 pizza", macros: { calories: 350, protein: 14, carbs: 40, fat: 15 }, keywords: ["frozen", "pizza"] },
  { name: "Frozen Burrito", portion: "1 burrito", macros: { calories: 340, protein: 12, carbs: 48, fat: 12 }, keywords: ["frozen", "burrito"] },
  { name: "Frozen Dinner (lean)", portion: "1 tray", macros: { calories: 300, protein: 18, carbs: 40, fat: 7 }, keywords: ["frozen", "dinner", "lean", "cuisine"] },
  { name: "Instant Ramen", portion: "1 package", macros: { calories: 380, protein: 8, carbs: 52, fat: 15 }, keywords: ["instant", "ramen", "noodles"] },
  { name: "Frozen Waffles", portion: "2 waffles", macros: { calories: 180, protein: 4, carbs: 30, fat: 5 }, keywords: ["frozen", "waffles", "eggo"] },
  { name: "Fish Sticks", portion: "4 sticks", macros: { calories: 200, protein: 10, carbs: 18, fat: 10 }, keywords: ["fish", "sticks", "frozen"] },

  // ─── More Proteins & Deli ──────────────────────────────────────
  { name: "Turkey Deli Meat", portion: "3 oz", macros: { calories: 70, protein: 14, carbs: 1, fat: 1 }, keywords: ["turkey", "deli", "lunch", "meat"] },
  { name: "Roast Beef Deli Meat", portion: "3 oz", macros: { calories: 90, protein: 15, carbs: 1, fat: 3 }, keywords: ["roast", "beef", "deli"] },
  { name: "Salami", portion: "3 slices", macros: { calories: 120, protein: 7, carbs: 0, fat: 10 }, keywords: ["salami"] },
  { name: "Pepperoni", portion: "15 slices", macros: { calories: 130, protein: 6, carbs: 1, fat: 11 }, keywords: ["pepperoni"] },
  { name: "Prosciutto", portion: "2 oz", macros: { calories: 100, protein: 14, carbs: 0, fat: 5 }, keywords: ["prosciutto"] },
  { name: "Smoked Salmon", portion: "3 oz", macros: { calories: 100, protein: 16, carbs: 0, fat: 4 }, keywords: ["smoked", "salmon", "lox"] },
  { name: "Sardines (canned)", portion: "1 can", macros: { calories: 190, protein: 23, carbs: 0, fat: 11 }, keywords: ["sardines"] },
  { name: "Bison Burger", portion: "4 oz patty", macros: { calories: 190, protein: 24, carbs: 0, fat: 10 }, keywords: ["bison", "burger", "buffalo"] },
  { name: "Venison Steak", portion: "4 oz", macros: { calories: 160, protein: 30, carbs: 0, fat: 4 }, keywords: ["venison", "deer", "game"] },

  // ─── Desserts & Sweet ──────────────────────────────────────────
  { name: "Frozen Yogurt", portion: "1/2 cup", macros: { calories: 110, protein: 3, carbs: 22, fat: 1 }, keywords: ["frozen", "yogurt", "froyo"] },
  { name: "Gelato", portion: "1/2 cup", macros: { calories: 160, protein: 4, carbs: 22, fat: 6 }, keywords: ["gelato"] },
  { name: "Sorbet", portion: "1/2 cup", macros: { calories: 100, protein: 0, carbs: 25, fat: 0 }, keywords: ["sorbet"] },
  { name: "Cake (chocolate)", portion: "1 slice", macros: { calories: 350, protein: 4, carbs: 50, fat: 16 }, keywords: ["cake", "chocolate"] },
  { name: "Tiramisu", portion: "1 piece", macros: { calories: 300, protein: 6, carbs: 30, fat: 18 }, keywords: ["tiramisu"] },
  { name: "Rice Pudding", portion: "1/2 cup", macros: { calories: 170, protein: 4, carbs: 30, fat: 4 }, keywords: ["rice", "pudding"] },
  { name: "Chocolate Mousse", portion: "1/2 cup", macros: { calories: 220, protein: 4, carbs: 22, fat: 14 }, keywords: ["chocolate", "mousse"] },
  { name: "Banana Split", portion: "1 serving", macros: { calories: 500, protein: 8, carbs: 70, fat: 22 }, keywords: ["banana", "split", "sundae"] },
  { name: "Pumpkin Pie (1 slice)", portion: "1 slice", macros: { calories: 320, protein: 7, carbs: 40, fat: 15 }, keywords: ["pumpkin", "pie"] },
  { name: "Carrot Cake (1 slice)", portion: "1 slice", macros: { calories: 380, protein: 4, carbs: 50, fat: 18 }, keywords: ["carrot", "cake"] },

  // ─── Sauces & Spreads (more) ───────────────────────────────────
  { name: "Tzatziki", portion: "2 tbsp", macros: { calories: 30, protein: 1, carbs: 2, fat: 2 }, keywords: ["tzatziki", "greek", "sauce"] },
  { name: "Sriracha", portion: "1 tsp", macros: { calories: 5, protein: 0, carbs: 1, fat: 0 }, keywords: ["sriracha", "hot", "sauce"] },
  { name: "Tahini", portion: "2 tbsp", macros: { calories: 180, protein: 5, carbs: 6, fat: 16 }, keywords: ["tahini"] },
  { name: "Hoisin Sauce", portion: "2 tbsp", macros: { calories: 70, protein: 1, carbs: 14, fat: 1 }, keywords: ["hoisin", "sauce"] },
  { name: "Chimichurri", portion: "2 tbsp", macros: { calories: 80, protein: 0, carbs: 1, fat: 9 }, keywords: ["chimichurri"] },
  { name: "Hollandaise Sauce", portion: "2 tbsp", macros: { calories: 80, protein: 1, carbs: 0, fat: 9 }, keywords: ["hollandaise", "sauce"] },
  { name: "Nutella", portion: "2 tbsp", macros: { calories: 200, protein: 2, carbs: 21, fat: 12 }, keywords: ["nutella", "hazelnut", "spread"] },
];

// Precomputed lowercase keywords for fast search
const _searchIndex = COMMON_FOODS.map((f) => ({
  food: f,
  searchTerms: [f.name.toLowerCase(), ...f.keywords].join(" "),
}));

export function searchCommonFoods(query: string, limit = 20): FoodItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const terms = q.split(/\s+/);

  const scored = _searchIndex
    .map(({ food, searchTerms }) => {
      let score = 0;
      for (const term of terms) {
        if (searchTerms.includes(term)) score += 2;
        else if (searchTerms.indexOf(term) !== -1) score += 1;
      }
      // Boost exact name match
      if (food.name.toLowerCase().startsWith(q)) score += 5;
      return { food, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ food }) => ({
    name: food.name,
    portion: food.portion,
    macros: food.macros,
    confidence: 90,
  }));
}
