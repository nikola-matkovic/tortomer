const DEBUGGING = true
import { roundNumber } from "@/functions/helpers";

export default class Ingredient {
  constructor(text) {
    this.id = Date.now();
    this.unitType = Ingredient.getUnitType(text)
    this.ingredientText = Ingredient.extractIngredientText(text, this.unitType)

    let quantityDefinition = Ingredient.getQuantity(text);

    this.quantity = quantityDefinition.quantity;
    this.isQuantityDefined = quantityDefinition.defined

    if(this.quantity === 1 && this.isQuantityDefined === false){
      this.textFormat = "1 " + text
    }
    else{
      this.textFormat = text
    }

    this.normalizedIngredientName = Ingredient.normalizeIngredientName(this.ingredientText)
    this.ingredientMass = roundNumber(Ingredient.convertToGrams(this.quantity, this.unitType, this.normalizedIngredientName));
    this.isHeader = text.endsWith(":");
  }

  static getUnitType(text) {
    const number = "\\d+(?:[.,]\\d+)?";

    const regexMl = new RegExp(`\\b(?:${number}\\s*)?(ml|mililit(ar|ra|ara))\\b`, "i");
    const regexDl = new RegExp(`\\b(?:${number}\\s*)?(dl|decilit(ar|ra|ara))\\b`, "i");
    const regexL  = new RegExp(`\\b(?:${number}\\s*)?(l|lit(ar|ra|ara))\\b`, "i");
    const regexG  = new RegExp(`\\b(?:${number}\\s*)?(g|gram(a|i)?)\\b`, "i");
    const regexKg = new RegExp(`\\b(?:${number}\\s*)?(kg|kilogram(a|i)?)\\b`, "i");

    // tablespoon
    const regexTablespoon = new RegExp(
      `\\b(?:${number}\\s*)?(kašik(a|e|i)?|kasik(a|e|i)?)\\b`,
      "i"
    );

    // teaspoon
    const regexTeaspoon = new RegExp(
      `\\b(?:${number}\\s*)?(kašičic(a|e|i)?|kasicic(a|e|i)?)\\b`,
      "i"
    );

    // cup
    const regexCup = new RegExp(
      `\\b(?:${number}\\s*)?(šolj(a|e|i)?|solj(a|e|i)?)\\b`,
      "i"
    );

    const regexSmallCup = new RegExp(
      `\\b(?:${number}\\s*)?(šoljic(a|e)?|soljic(a|e)?)\\b`,
      "i"
    );

    if (regexMl.test(text)) return "ml";
    if (regexDl.test(text)) return "dl";
    if (regexL.test(text))  return "l";
    if (regexKg.test(text)) return "kg";
    if (regexG.test(text))  return "g";
    if (regexTablespoon.test(text)) return "tbsp";
    if (regexTeaspoon.test(text))  {
      return "tsp"
    };
    if (regexCup.test(text)) return "cup";
    if (regexSmallCup.test(text)) return "smallCup";

    return null;
  }

  static extractIngredientText(text, unitType) {
    // broj (sa decimalama) + opcioni razmak
    let re;

    if (unitType) {
      // broj + (razmak?) + JEDNA reč (jedinica)
      re = /^\s*\d+(?:[.,]\d+)?\s*\p{L}+\s*/u;
    } else {
      // samo broj
      re = /^\s*\d+(?:[.,]\d+)?\s*/;
    }

    const ingredient = text.replace(re, "").trim();
    return ingredient || null;
  }

  static getQuantity(text, unitType) {

    if (!text) return null;

    const openParenthesesIndex = text.indexOf("(")
    const closeParenthesesIndex = text.indexOf(")")

    const isInsideParentheses = (index) => {
      return index > openParenthesesIndex && index < closeParenthesesIndex
    }

    // 1️⃣ Pokušaj razlomak tipa "1/2", "3/4"
    const fractionRegex = /(\d+)\s*\/\s*(\d+)/;
    let match = text.match(fractionRegex);

    if (match) {
      if(!isInsideParentheses(match.index)){
        const numerator = Number(match[1]);
        const denominator = Number(match[2]);
        return {
          quantity: numerator/denominator,
          defined: true
        };
      }
    }

    // 1️⃣ Pokušaj range tipa "5-6", "3-4"
    const rangeRegex = /(\d+)\s*\-\s*(\d+)/;
    match = text.match(rangeRegex);

    if (match) {
      if(!isInsideParentheses(match.index)){
        const first = Number(match[1]);
        const second = Number(match[2]);
        return {
          quantity:  (first + second) / 2,
          defined: true,
        }
      }
    }

    // 2️⃣ Decimalni ili ceo broj "1.5", "2", "2,5"
    const decimalRegex = /\d+(?:[.,]\d+)?/;
    match = text.match(decimalRegex);
    if (match) {
      if(!isInsideParentheses(match.index)){
        return {
          quantity: Number(match[0].replace(",", ".")),
          defined: true
        }
      }
    }

    const textInside = text.substring(openParenthesesIndex + 1, closeParenthesesIndex)

    let recursiveCallAnswer = ""

    if(textInside) {
      recursiveCallAnswer = this.getQuantity(textInside)
    }

    if(recursiveCallAnswer) return recursiveCallAnswer


    if(!unitType){
      return {
        quantity: 1,
        defined: false
      }
    }

    return {
      quantity: null,
      defined: null,
    }
  }


  static spoonToMl(quantity, unitType) {
    if (unitType === "tbsp") return quantity * 15;
    if (unitType === "tsp") return quantity * 5;
    return null;
  }

  static cupToMl(quantity, unitType){
    if (unitType === "cup") return quantity * 200;
    if (unitType === "smallCup") return quantity * 50;
    return null;
  }

  static getCountBasedWeight(ingredientKey) {
    const weights = {
      egg: 50,
      egg_white: 30,
      egg_yolk: 20,
      banana: 120,
      apple: 180,
      lemon: 120,
      orange: 200,
      vanilla_pod: 5,
      yeast_cube: 40,
      vanilla_sugar: 10,
      kremfix: 7,
    };

    return weights[ingredientKey] ?? null;
  }

  static normalizeIngredientName(text) {
    if (!text) return null;

    const t = text.toLowerCase();

    const map = {
      milk: ["mleko", "mleka"],
      water: ["voda", "vode"],
      sugar: ["šećer", "secer", "šećera", "secera"],
      flour: ["brašno", "brasno", "brašna", "brasna"],
      butter: ["puter", "putera", "maslac", "maslaca"],
      oil: ["ulje", "ulja"],
      egg: ["jaje", "jaja", "jajeta"],
      egg_white: ["belance", "belanca", "belanaca"],
      egg_yolk: ["žumance", "žumanca", "zumance", "zumanca", "žumanaca", "zumanaca"],
      yogurt: ["jogurt", "jogurta"],
      sour_cream: ["pavlaka", "pavlake"],
      whipping_cream: ["slatka pavlaka", "slatke pavlake"],
      cocoa: ["kakao", "kakaoa", "kakaa"],
      honey: ["med", "meda"],
      salt: ["so", "soli"],
      powdered_sugar: [
        "šećer u prahu", "secer u prahu",
        "šećera u prahu", "secera u prahu",
        "prah šećer", "prah šećera",
        "prah secer", "prah secera"
      ],
      banana: ["banana", "banane"],
      apple: ["jabuka", "jabuke"],
      lemon: ["limun", "limuna"],
      orange: ["pomorandža", "narandža", "pomorandže", "narandže"],
      vanilla_pod: ["vanila", "vanilija", "vanile", "vanilije"],
      yeast_cube: ["kvasac", "kvasca"],
      rum: ["rum", "ruma"],
      baking_powder: [
      "prašak za pecivo",
      "praska za pecivo",
      "prasak za pecivo",
      "praška za pecivo"
      ],
      vanilla_sugar: [
        "vanilin šećer",
        "vanilin secer",
        "vanilin šećera",
        "vanilin secera",
        "vanilinog šećera",
        "vanilinog secera",
        "vanila šećer",
        "vanila secer",
        "vanila šećera",
        "vanila secera"
      ],
      fat: [
        "mast", "masti",
      ],
      semolina: [
        "griz", "griza",
      ],
      lemonJuice: [
        "soka od limuna",
        "Sok od limuna",
        "limunovog soka",
        "limun soka",
      ],
      kremfix: ["kremfix", "kremfixa", "kremfiksa", "kremfiks"]
    };

    // 1. Flatten + sort by phrase length (DESC)
    const entries = Object.entries(map)
      .flatMap(([key, values]) =>
        values.map(v => ({ key, value: v }))
      )
      .sort((a, b) => b.value.length - a.value.length);

    // 2. Unicode-aware "whole word / phrase" regex
    for (const { key, value } of entries) {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`,
        "iu"
      );

      if (regex.test(t)) {
        return key;
      }
    }

    return text;
  }

  static getDensity(ingredientKey) {
    const densities = {
      milk: 1.03,
      water: 1.0,
      yogurt: 1.03,
      sour_cream: 1.02,
      whipping_cream: 0.99,
      oil: 0.92,
      butter: 0.91,
      margarine: 0.91,
      honey: 1.42,
      sugar: 0.85,
      powdered_sugar: 0.56,
      flour: 0.53,
      cocoa: 0.65,
      cocoa_powder: 0.55,
      chocolate: 1.3,
      milk_chocolate: 1.2,
      egg: 1.03,
      coconut: 0.35,
      hazelnut: 0.6,
      salt: 1.2,
      rum: 0.94,
      baking_powder: 0.8,
      vanilla_sugar: 0.85,
      fat: 0.9,
      semolina: 0.65,
      lemonJuice: 1.03,
    };

    // Real-world need average, in development I want see which ing does not have defined danciy
    if(DEBUGGING){
      return densities[ingredientKey] ?? null;
    }

    return densities[ingredientKey] ?? 0.9;

  }

  static convertToGrams(quantity, unitType, ingredient) {

    if (quantity == null) return null;

    // mass units
    if (unitType === "g") return quantity;
    if (unitType === "kg") return quantity * 1000;

    // volume → ml
    let ml = null;

    if (unitType === "ml") ml = quantity;
    if(unitType === "dl") ml = quantity * 100;
    if (unitType === "l") ml = quantity * 1000;

    if (unitType === "tbsp" || unitType === "tsp") {
      ml = Ingredient.spoonToMl(quantity, unitType);
    }

    if(unitType === "cup" || unitType === "smallCup"){
      ml = Ingredient.cupToMl(quantity)
    }

    // VOLUME BASED
    if (ml != null) {
      const density = Ingredient.getDensity(ingredient);
      if (!density) return null;
      return ml * density;
    }

    // COUNT BASED (no unit)
    if (!unitType) {
      const perItemWeight = Ingredient.getCountBasedWeight(ingredient);
      if (!perItemWeight) return null;
      return quantity * perItemWeight;
    }

    return null;
  }
}
