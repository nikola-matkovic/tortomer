<script setup>

import { computed, onMounted, ref, watch } from 'vue';

const newIngredient = ref("")

const recipes = ref([])
const solution = ref([])

const creatingNewRecipe = ref(false)
const activeRecipeId = ref(null)
const screen = ref("selector")


const activeRecipe = computed(() => {
  return recipes.value.find(r => r.id === activeRecipeId.value)
})

const activeRecipeMass = computed(() => {


  console.log(activeRecipe);


  const masses = activeRecipe.value?.ingredients?.map(i => i.ingredientMass || 0)


  return masses?.reduce( (acc, curr) => acc + curr, 0 )
})

class Recipe {
  constructor() {
    this.id = Date.now();
    this.name = ""
    this.ingredients = []
  }
}


class Ingredient {
  constructor(text) {
    this.id = Date.now();
    this.textFormat = text
    this.unitType = Ingredient.getUnitType(text)
    this.ingredientText = Ingredient.extractIngredientText(text, this.unitType)
    this.quantity = Ingredient.getQuantity(text);
    this.normalizedIngredientName = Ingredient.normalizeIngredientName(this.ingredientText)
    this.ingredientMass = Ingredient.convertToGrams(this.quantity, this.unitType, this.normalizedIngredientName);
  }

  static getUnitType(text) {
    const number = "\\d+(?:[.,]\\d+)?";

    const regexMl = new RegExp(`\\b${number}\\s*(ml|mililit(ar|ra|ara))\\b`, "i");
    const regexL  = new RegExp(`\\b${number}\\s*(l|lit(ar|ra|ara))\\b`, "i");
    const regexG  = new RegExp(`\\b${number}\\s*(g|gram(a|i)?)\\b`, "i");
    const regexKg = new RegExp(`\\b${number}\\s*(kg|kilogram(a|i)?)\\b`, "i");

    // tablespoon
    const regexTablespoon = new RegExp(
      `\\b${number}\\s*(kašik(a|e|i)?|kasik(a|e|i)?)\\b`,
      "i"
    );

    // teaspoon
    const regexTeaspoon = new RegExp(
      `\\b${number}\\s*(kašičic(a|e|i)?|kasicic(a|e|i)?)\\b`,
      "i"
    );

    if (regexMl.test(text)) return "ml";
    if (regexL.test(text))  return "l";
    if (regexKg.test(text)) return "kg";
    if (regexG.test(text))  return "g";
    if (regexTablespoon.test(text)) return "tbsp";
    if (regexTeaspoon.test(text))   return "tsp";

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

  static getQuantity(text) {
    const match = text.match(/\d+(?:[.,]\d+)?/);
    if (!match) return null;

    return Number(match[0].replace(",", "."));
  }

  static spoonToMl(quantity, unitType) {
    if (unitType === "tbsp") return quantity * 15;
    if (unitType === "tsp") return quantity * 5;
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
      egg: ["jaje", "jaja"],
      egg_white: ["belance", "belanca"],
      egg_yolk: ["žumance", "žumanca", "zumance", "zumanca"],
      yogurt: ["jogurt", "jogurta"],
      sour_cream: ["pavlaka", "pavlake"],
      whipping_cream: ["slatka pavlaka", "slatke pavlake"],
      cocoa: ["kakao", "kakaoa", "kakaa"],
      honey: ["med", "meda"],
      salt: ["so", "soli"],
      powdered_sugar: ["šećer u prahu", "secer u prahu", "secera u prahu", "šećera u prahu", "prah šećer", "prah šećera", "prah secer", "prah secera"],
      banana: ["banana", "banane"],
      apple: ["jabuka", "jabuke"],
      lemon: ["limun", "limuna"],
      orange: ["pomorandža", "narandža", "pomorandže", "narandže"],
      vanilla_pod: ["vanila", "vanilija"],
      yeast_cube: ["kvasac", "kvasca"],
    };

    for (const key in map) {
      if (map[key].some(v => t.includes(v))) {
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
    };

    return densities[ingredientKey] ?? null;
  }


  static convertToGrams(quantity, unitType, ingredient) {


    console.log("getting", {quantity, unitType, ingredient});


    if (quantity == null) return null;

    // mass units
    if (unitType === "g") return quantity;
    if (unitType === "kg") return quantity * 1000;

    // volume → ml
    let ml = null;

    if (unitType === "ml") ml = quantity;
    if (unitType === "l") ml = quantity * 1000;

    if (unitType === "tbsp" || unitType === "tsp") {
      ml = Ingredient.spoonToMl(quantity, unitType);
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

function addIngredient() {

  const ingredient = new Ingredient(newIngredient.value)

  console.log("added", ingredient)

  activeRecipe.value.ingredients.push(ingredient)
  newIngredient.value = ""

  localStorage.setItem("recipe", JSON.stringify(recipes.value))

}

function removeItem(i) {
  activeRecipe.value.ingredients = activeRecipe.value.ingredients.filter((_, index) => i != index)

  localStorage.setItem("recipe", JSON.stringify(recipes.value))

}

function multiplyNumberInString(text, multiplier) {
  return text.replace(/\d+(\.\d+)?/, (match) => {
    let num = Number(match) * multiplier;

    num = +(Math.round(num + "e+2")  + "e-2");

    return num

  });
}

function showSolution(multiplier) {

  solution.value = []

  activeRecipe.value.ingredients.forEach(item => {
    const transformedString = multiplyNumberInString(item.textFormat, multiplier)
    solution.value.push(transformedString)
  })
}

function addNewRecipe() {
  let recipe = new Recipe();
  recipes.value.push(recipe);


  activeRecipeId.value = recipe.id;

  creatingNewRecipe.value = true
}

function finishRecipe(){
  creatingNewRecipe.value = false;
  activeRecipeId.value = null
}

function showRecipe(id){
  activeRecipeId.value = id;

  screen.value = "recipe"
}

function changeScreen(s){
  screen.value = s;
  activeRecipeId.value = null

  solution.value = []
}

onMounted(() => {
  const local = localStorage.getItem("recipe")

  if (!local || local === "null") return;

  recipes.value = JSON.parse(local);
})

</script>

<template>
  <h1>Tortomer</h1> <h2 v-if="activeRecipe?.name">{{activeRecipe.name}} </h2>


  <template v-if="screen === 'selector'">



    <div class="buttons" v-if="!creatingNewRecipe">
      <div v-for="recipe in recipes" @click="showRecipe(recipe.id)" class="recipe-card">
        {{ recipe.name }}
      </div>

      <button @click="addNewRecipe">Dodaj recept</button>
    </div>


    <div v-if="creatingNewRecipe">

      <section class="input-box">
        <input placeholder="Ime torte" type="text" v-model="activeRecipe.name">
      </section>

      <section class="input-box">
        <input type="text" v-model="newIngredient" @keyup.enter="addIngredient"> <button
          @click="addIngredient">+</button>
      </section>

      <section class="recipe">
        <div v-for="(item, index) in activeRecipe.ingredients" class="recipe-item item">

          <div class="item-text">
            {{ item.textFormat }}
          </div>

          <button @click="removeItem(index)">x</button>
        </div>


        <button @click="finishRecipe">Gotovo</button>
      </section>

    </div>


  </template>


  <template v-else-if="screen === 'recipe'">

    <section class="input-box">
      <input type="text" v-model="newIngredient" @keyup.enter="addIngredient"> <button @click="addIngredient">+</button>
    </section>


    <section class="recipe">
      <div v-for="(item, index) in activeRecipe.ingredients" class="recipe-item item">

        <div class="item-text">
          {{ item.textFormat }} --- {{ item.ingredientMass}}
        </div>

        <button @click="removeItem(index)">x</button>
      </div>


      {{ activeRecipeMass }} g

    </section>


    <section class="buttons">
      <button class="button" @click="showSolution(0.25)">1/4 Četvrtina</button>
      <button class="button" @click="showSolution(0.33333333)">1/3 Trećina</button>
      <button class="button" @click="showSolution(0.5)">1/2 Pola</button>
      <button class="button" @click="showSolution(0.66666666)">2/3 Dve trećine</button>
      <button class="button" @click="showSolution(0.75)">3/4 Tri četvrtine</button>
      <button class="button" @click="showSolution(1.5)">1.5x Pola više</button>
      <button class="button" @click="showSolution(2)">X2 Duplo</button>
      <button class="button" @click="showSolution(2.5)">X2.5 2 Ipo puta više</button>
      <button class="button" @click="showSolution(3)">X3 3 puta više</button>
      <button class="button" @click="showSolution(4)">X4 4 puta više</button>
    </section>

    <section class="solution">
      <div v-for="item in solution" class="solution-item item">

        <div class="item-text">
          {{ item }}
        </div>
      </div>
    </section>


    <button @click="changeScreen('selector')">Nazad na recepte</button>

  </template>


</template>

<style>
* {
  font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.item {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: .5rem;

  padding-inline-start: .5rem;

  background-color: #f082ac34;
}

section {
  margin-bottom: 1rem;
}

.item-text {
  flex-grow: 1;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .5rem;
}

button {
  background-color: #EA4C89;
  border-radius: 8px;
  border-style: none;
  box-sizing: border-box;
  color: #FFFFFF;
  cursor: pointer;
  display: inline-block;
  font-size: 14px;
  font-weight: 500;
  height: 40px;
  line-height: 20px;
  list-style: none;
  margin: 0;
  outline: none;
  padding: 10px 16px;
  position: relative;
  text-align: center;
  text-decoration: none;
  transition: color 100ms;
  vertical-align: baseline;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

button:hover,
button:focus {
  background-color: #F082AC;
}

input,
input:focus,
input:focus-visible {
  outline: 0;
  border-radius: .5rem;
  height: 40px;
  border: 1px solid #EA4C89;
}


.input-box {
  display: flex;
  gap: .5rem;
}

.input-box input {
  flex-grow: 1;
}

.recipe,
.solution {
  display: flex;
  flex-direction: column;
  gap: 20px;
}


.recipe-card{
  height: 40px;
  border: 1px solid #EA4C89;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .5rem;
}
</style>
