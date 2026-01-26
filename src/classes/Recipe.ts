import Ingredient from "./Ingredient";
import { removeWrongCharactersFromIngString } from "@/functions/helpers";


export default class Recipe {
  constructor(minimalObject = "") {
    if (minimalObject === "") {
      this.id = Date.now();
      this.name = "";
      this.ingredients = [];
    } else {
      this.name = minimalObject.name;
      this.id = minimalObject.id;
      this.ingredients = minimalObject.ingredients.map(
        (ing) => new Ingredient(ing),
      );
    }
  }

  removeIngredient(i) {
    this.ingredients = this.ingredients.filter((_, index) => i != index);
  }

  getMass() {
    const masses = this.ingredients?.map((i) => i.ingredientMass || 0);

    const grams = masses?.reduce((a, b) => a + b, 0);

    if (grams > 1000) return (grams / 1000).toFixed(3) + " kg";

    return grams.toFixed(0) + " g";
  }

  getMinimalObject() {
    let obj = {
      name: this.name,
      id: this.id,
      ingredients: this.ingredients.map((i) => i.textFormat),
    };

    return obj;
  }

  ingredientsToTextarea() {
    const ingredientPlainTextArray = this.ingredients.map((i) => i.textFormat);
    const ingredientsTextWithNewLines = ingredientPlainTextArray.join("\n");
    return ingredientsTextWithNewLines;
  }

  removeAllIngredients() {
    this.ingredients = [];
  }

  isInsideParentheses(parenthesesRanges, index) {
    return parenthesesRanges.some(([s, e]) => index > s && index < e);
  }

  // Plain text can be separated by \n
  updateIngredients(plainTextIngredient, updateInPlace = false) {
    const updated = [];

    if (!plainTextIngredient) return;

    const trimmed = removeWrongCharactersFromIngString(plainTextIngredient);

    let lines = [];
    let ings = [];

    if (trimmed.indexOf("\n") != -1) {
      lines = trimmed.split("\n");
    } else {
      lines.push(trimmed);
    }

    // can be only one if single input is active
    lines.forEach((line) => {
      let commaSeparatedStrings = line.split(",");

      commaSeparatedStrings.forEach((commaSeparatedString) => {
        const finnalCut = commaSeparatedString.split(":");

        if (finnalCut.length === 2) {
          ings.push(finnalCut[0] + ":");
          ings.push(finnalCut[1]);
        } else {
          ings.push(finnalCut[0]);
        }
      });
    });

    ings.forEach((ingredient) => {
      const DASH_REGEX = /[-–—−]/;

      // 1. Pronađi opsege zagrada
      const parenthesesRanges = [];
      const stack = [];

      for (let i = 0; i < ingredient.length; i++) {
        if (ingredient[i] === "(") stack.push(i);
        if (ingredient[i] === ")" && stack.length) {
          parenthesesRanges.push([stack.pop(), i]);
        }
      }

      // 2. Pronađi brojeve (uključujući razlomke)
      const numberRegex = /\d+\/\d+|\d+(?:[.,]\d+)?/g;

      const matches = [...ingredient.matchAll(numberRegex)].filter((m) => {
        const idx = m.index;
        const len = m[0].length;

        if (this.isInsideParentheses(parenthesesRanges, idx)) return false;

        const before = ingredient.slice(Math.max(0, idx - 2), idx);
        const after = ingredient.slice(idx + len, idx + len + 2);

        // ❌ deo raspona (100-150, 100–150, 100−150)
        if (DASH_REGEX.test(before) || DASH_REGEX.test(after)) {
          return false;
        }

        return true;
      });

      // 3. Ako nema validnih brojeva → ceo string je jedan sastojak
      if (matches.length === 0) {
        updated.push(new Ingredient(ingredient.trim()));
        return;
      }

      // 4. Iseci od broja do sledećeg validnog broja
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index;
        const end = matches[i + 1]?.index ?? ingredient.length;

        const part = ingredient.slice(start, end).trim();

        console.log("here", start, end, part);

        if (part) {
          updated.push(new Ingredient(part));
        }
      }
    });

    if (updateInPlace) {
      this.ingredients = updated;
    } else {
      this.ingredients.push(...updated);
    }
  }
}
