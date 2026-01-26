const DEBUGGING = true;
import { roundNumber } from "@/functions/helpers";

export default class Ingredient {
  constructor(text) {
    this.id = Date.now();
    this.unitType = Ingredient.getUnitType(text);
    this.ingredientText = Ingredient.extractIngredientText(text, this.unitType);

    let quantityDefinition = Ingredient.getQuantity(text);

    this.quantity = quantityDefinition.quantity;
    this.isQuantityDefined = quantityDefinition.defined;

    if (this.quantity === 1 && this.isQuantityDefined === false) {
      this.textFormat = "1 " + text;
    } else {
      this.textFormat = text;
    }

    this.normalizedIngredientName = Ingredient.normalizeIngredientName(
      this.ingredientText,
    );
    this.ingredientMass = roundNumber(
      Ingredient.convertToGrams(
        this.quantity,
        this.unitType,
        this.normalizedIngredientName,
      ),
    );
    this.isHeader = text.endsWith(":");
  }

  static definedIngredients = {
    egg: {
      name: "egg",
      singleWeight: 50,
      words: ["jaje", "jaja", "jajeta"],
      density: 1.03,
    },
    egg_white: {
      name: "egg_white",
      singleWeight: 30,
      words: ["belance", "belanca", "belanaca"],
      density: 1.03,
    },
    egg_yolk: {
      name: "egg_yolk",
      singleWeight: 20,
      words: [
        "žumance",
        "žumanca",
        "zumance",
        "zumanca",
        "žumanaca",
        "zumanaca",
      ],
      density: 1.05,
    },
    banana: {
      name: "banana",
      singleWeight: 120,
      words: ["banana", "banane"],
      density: 0.94,
    },
    apple: {
      name: "apple",
      singleWeight: 180,
      words: ["jabuka", "jabuke"],
      density: 0.96,
    },
    lemon: {
      name: "lemon",
      singleWeight: 120,
      words: ["limun", "limuna"],
      density: 0.98,
    },
    orange: {
      name: "orange",
      singleWeight: 200,
      words: [
        "pomorandža",
        "narandža",
        "pomorandže",
        "narandže",
        "pomorandza",
        "narandza",
        "pomorandze",
        "narandze",
      ],
      density: 0.97,
    },
    vanilla_pod: {
      name: "vanilla_pod",
      singleWeight: 5,
      words: ["vanila", "vanilija", "vanile", "vanilije"],
      density: 0.6,
    },
    yeast_cube: {
      name: "yeast_cube",
      singleWeight: 40,
      words: ["kvasac", "kvasca"],
      density: 0.85,
    },
    vanilla_sugar: {
      name: "vanilla_sugar",
      singleWeight: 10,
      words: [
        "vanilin šećer",
        "vanilin secer",
        "vanilin šećera",
        "vanilin secera",
        "vanilinog šećera",
        "vanilinog secera",
        "vanila šećer",
        "vanila secer",
        "vanila šećera",
        "vanila secera",
      ],
      density: 0.85,
    },

    kremfix: {
      name: "kremfix",
      singleWeight: 7,
      words: ["kremfix", "kremfixa", "kremfiksa", "kremfiks"],
      density: 0.5,
    },
    milk: {
      name: "milk",
      words: ["mleko", "mleka"],
      density: 1.03,
    },
    water: {
      name: "water",
      words: ["voda", "vode"],
      density: 1.0,
    },
    sugar: {
      name: "sugar",
      words: ["šećer", "secer", "šećera", "secera"],
      density: 0.85,
    },
    flour: {
      name: "flour",
      words: ["brašno", "brasno", "brašna", "brasna"],
      density: 0.53,
    },
    butter: {
      name: "butter",
      words: ["puter", "putera", "maslac", "maslaca"],
      density: 0.91,
    },
    oil: {
      name: "oil",
      words: ["ulje", "ulja"],
      density: 0.92,
    },
    yogurt: {
      name: "yogurt",
      words: ["jogurt", "jogurta"],
      density: 1.03,
    },
    sour_cream: {
      name: "sour_cream",
      words: ["pavlaka", "pavlake"],
      density: 1.02,
    },
    whipping_cream: {
      name: "whipping_cream",
      words: ["slatka pavlaka", "slatke pavlake"],
      density: 0.99,
    },
    cocoa: {
      name: "cocoa",
      words: ["kakao", "kakaoa", "kakaa"],
      density: 0.65,
    },
    honey: {
      name: "honey",
      words: ["med", "meda"],
      density: 1.42,
    },
    salt: {
      name: "salt",
      words: ["so", "soli"],
      density: 1.2,
    },
    powdered_sugar: {
      name: "powdered_sugar",
      words: [
        "šećer u prahu",
        "secer u prahu",
        "šećera u prahu",
        "secera u prahu",
        "prah šećer",
        "prah šećera",
        "prah secer",
        "prah secera",
      ],
      density: 0.56,
    },
    rum: {
      name: "rum",
      words: ["rum", "ruma"],
      density: 0.95,
    },
    baking_powder: {
      name: "baking_powder",
      words: [
        "prašak za pecivo",
        "praska za pecivo",
        "prasak za pecivo",
        "praška za pecivo",
      ],
      density: 0.8,
    },
    fat: {
      name: "fat",
      words: ["mast", "masti"],
      density: 0.92,
    },
    semolina: {
      name: "semolina",
      words: ["griz", "griza"],
      density: 0.7,
    },
    lemonJuice: {
      name: "lemonJuice",
      words: [
        "soka od limuna",
        "Sok od limuna",
        "limunovog soka",
        "limun soka",
      ],
      density: 1.03,
    },
    margarine: {
      name: "margarine",
      words: ["margarin", "margarina"],
      density: 0.91,
    },
    cocoa_powder: {
      name: "cocoa_powder",
      words: ["kakao u prahu", "kakao prah", "kakao praha"],
      density: 0.55,
    },
    chocolate: {
      name: "chocolate",
      words: ["čokolada", "cokolada", "čokolade", "cokolade"],
      density: 1.3,
    },
    milk_chocolate: {
      name: "milk_chocolate",
      words: [
        "mlečna čokolada",
        "mlecna cokolada",
        "mlečne čokolade",
        "mlecne cokolade",
      ],
      density: 1.2,
    },
    coconut: {
      name: "coconut",
      words: [
        "kokos",
        "kokosa",
        "kokosovo brašno",
        "kokosovo brasno",
        "kokosovog brašna",
        "kokosovog brasna",
      ],
      density: 0.35,
    },
    hazelnut: {
      name: "hazelnut",
      words: ["lešnik", "lesnik", "lešnici", "lesnici", "lešnika", "lesnika"],
      density: 0.6,
    },

    gelatine: {
      name: "gelatine",
      words: [
        "želatin",
        "zelatin",
        "želatina",
        "zelatina",
        "želatine",
        "zelatine",
      ],
      density: 0.8,
    },
  };

  static getUnitType(text) {
    const number = "\\d+(?:[.,]\\d+)?";

    const regexMl = new RegExp(
      `\\b(?:${number}\\s*)?(ml|mililit(ar|ra|ara))\\b`,
      "i",
    );
    const regexDl = new RegExp(
      `\\b(?:${number}\\s*)?(dl|decilit(ar|ra|ara))\\b`,
      "i",
    );
    const regexL = new RegExp(
      `\\b(?:${number}\\s*)?(l|lit(ar|ra|ara))\\b`,
      "i",
    );
    const regexG = new RegExp(`\\b(?:${number}\\s*)?(g|gram(a|i)?)\\b`, "i");
    const regexKg = new RegExp(
      `\\b(?:${number}\\s*)?(kg|kilogram(a|i)?)\\b`,
      "i",
    );

    // tablespoon
    const regexTablespoon = new RegExp(
      `\\b(?:${number}\\s*)?(kašik(a|e|i)?|kasik(a|e|i)?)\\b`,
      "i",
    );

    // teaspoon
    const regexTeaspoon = new RegExp(
      `\\b(?:${number}\\s*)?(kašičic(a|e|i)?|kasicic(a|e|i)?)\\b`,
      "i",
    );

    // cup
    const regexCup = new RegExp(
      `\\b(?:${number}\\s*)?(šolj(a|e|i)?|solj(a|e|i)?)\\b`,
      "i",
    );

    const regexSmallCup = new RegExp(
      `\\b(?:${number}\\s*)?(šoljic(a|e)?|soljic(a|e)?)\\b`,
      "i",
    );

    if (regexMl.test(text)) return "ml";
    if (regexDl.test(text)) return "dl";
    if (regexL.test(text)) return "l";
    if (regexKg.test(text)) return "kg";
    if (regexG.test(text)) return "g";
    if (regexTablespoon.test(text)) return "tbsp";
    if (regexTeaspoon.test(text)) {
      return "tsp";
    }
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

    const openParenthesesIndex = text.indexOf("(");
    const closeParenthesesIndex = text.indexOf(")");

    const isInsideParentheses = (index) => {
      return index > openParenthesesIndex && index < closeParenthesesIndex;
    };

    // 1️⃣ Pokušaj razlomak tipa "1/2", "3/4"
    const fractionRegex = /(\d+)\s*\/\s*(\d+)/;
    let match = text.match(fractionRegex);

    if (match) {
      if (!isInsideParentheses(match.index)) {
        const numerator = Number(match[1]);
        const denominator = Number(match[2]);
        return {
          quantity: numerator / denominator,
          defined: true,
        };
      }
    }

    // 1️⃣ Pokušaj range tipa "5-6", "3-4"
    const rangeRegex = /(\d+)\s*\-\s*(\d+)/;
    match = text.match(rangeRegex);

    if (match) {
      if (!isInsideParentheses(match.index)) {
        const first = Number(match[1]);
        const second = Number(match[2]);
        return {
          quantity: (first + second) / 2,
          defined: true,
        };
      }
    }

    // 2️⃣ Decimalni ili ceo broj "1.5", "2", "2,5"
    const decimalRegex = /\d+(?:[.,]\d+)?/;
    match = text.match(decimalRegex);
    if (match) {
      if (!isInsideParentheses(match.index)) {
        return {
          quantity: Number(match[0].replace(",", ".")),
          defined: true,
        };
      }
    }

    const textInside = text.substring(
      openParenthesesIndex + 1,
      closeParenthesesIndex,
    );

    let recursiveCallAnswer = "";

    if (textInside) {
      recursiveCallAnswer = this.getQuantity(textInside);
    }

    if (recursiveCallAnswer) return recursiveCallAnswer;

    if (!unitType) {
      return {
        quantity: 1,
        defined: false,
      };
    }

    return {
      quantity: null,
      defined: null,
    };
  }

  static spoonToMl(quantity, unitType) {
    if (unitType === "tbsp") return quantity * 15;
    if (unitType === "tsp") return quantity * 5;
    return null;
  }

  static cupToMl(quantity, unitType) {
    if (unitType === "cup") return quantity * 200;
    if (unitType === "smallCup") return quantity * 50;
    return null;
  }

  static getCountBasedWeight(ingredientKey) {
    return this.definedIngredients?.[ingredientKey]?.singleWeight || null;
  }

  static normalizeIngredientName(text) {
    if (!text) return null;

    const t = text.toLowerCase();

    const entries = Object.entries(this.definedIngredients)
      .flatMap(([key, obj]) =>
        (obj.words || []).map((v) => ({ key, value: v })),
      )
      .sort((a, b) => b.value.length - a.value.length);

    // 2. Unicode-aware "whole word / phrase" regex
    for (const { key, value } of entries) {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, "iu");

      if (regex.test(t)) {
        return key;
      }
    }

    return text;
  }

  static getDensity(ingredientKey) {
    console.log(ingredientKey, this.definedIngredients);

    // Real-world need average, in development I want see which ing does not have defined danciy
    if (DEBUGGING) {
      return this.definedIngredients?.[ingredientKey]?.density ?? null;
    }

    return this.definedIngredients?.[ingredientKey]?.density ?? 0.9;
  }

  static convertToGrams(quantity, unitType, ingredient) {
    if (quantity == null) return null;

    // mass units
    if (unitType === "g") return quantity;
    if (unitType === "kg") return quantity * 1000;

    // volume → ml
    let ml = null;

    if (unitType === "ml") ml = quantity;
    if (unitType === "dl") ml = quantity * 100;
    if (unitType === "l") ml = quantity * 1000;

    if (unitType === "tbsp" || unitType === "tsp") {
      ml = Ingredient.spoonToMl(quantity, unitType);
    }

    if (unitType === "cup" || unitType === "smallCup") {
      ml = Ingredient.cupToMl(quantity);
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
