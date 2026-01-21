<script setup>

import { computed, onMounted, ref, watch } from 'vue';
import { createWorker } from 'tesseract.js';

const newIngredientInputValue = ref("")

const recipes = ref([])
const solution = ref(null)

const creatingNewRecipe = ref(false)
const activeRecipeId = ref(null)
const screen = ref("selector")
const inputMethod = ref("one-by-one")

const activeRecipe = computed(() => {
  const recipe =  recipes.value.find(r => r.id === activeRecipeId.value)
  return recipe;
})

class Recipe {
  constructor(minimalObject = "") {

    if(minimalObject === ""){
      this.id = Date.now();
      this.name = ""
      this.ingredients = []
    }

    else{
      this.name = minimalObject.name;
      this.id = minimalObject.id
      this.ingredients = minimalObject.ingredients.map(ing => new Ingredient(ing))
    }

  }

  addIngredient(ingredient){
    this.ingredients.push(ingredient)
  }

  removeIngredient(i){
    this.ingredients = this.ingredients.filter((_, index) => i != index)
  }

  getMass(){
    const masses = this.ingredients?.map(i => i.ingredientMass || 0)
    return masses?.reduce( (acc, curr) => acc + curr, 0 ) / 1000
  }

  getMinimalObject(){
    let obj =  {
      name: this.name,
      id: this.id,
      ingredients: this.ingredients.map(i => i.textFormat)
    }

    return obj
  }

  ingredientsToTextarea(){
    const ingredientPlainTextArray = this.ingredients.map(i => i.textFormat )
    const ingredientsTextWithNewLines = ingredientPlainTextArray.join("\n")
    return ingredientsTextWithNewLines
  }


  removeAllIngredients() {
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
    this.isHeader = text.endsWith(":"); // Fil: , Kora1:
  }

  static getUnitType(text) {
    const number = "\\d+(?:[.,]\\d+)?";

    const regexMl = new RegExp(`\\b${number}\\s*(ml|mililit(ar|ra|ara))\\b`, "i");
    const regexDl = new RegExp(`\\b${number}\\s*(dl|decilit(ar|ra|ara))\\b`, "i");
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

    // cup
    const regexCup = new RegExp(
      `\\b${number}\\s*(šolj(a|e|i)?|solj(a|e|i)?)\\b`,
      "i"
    );

    const regexSmallCup = new RegExp(
      `\\b${number}\\s*(šoljic(a|e)?|soljic(a|e)?)\\b`,
      "i"
    );

    if (regexMl.test(text)) return "ml";
    if (regexDl.test(text)) return "dl";
    if (regexL.test(text))  return "l";
    if (regexKg.test(text)) return "kg";
    if (regexG.test(text))  return "g";
    if (regexTablespoon.test(text)) return "tbsp";
    if (regexTeaspoon.test(text))   return "tsp";
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

  static getQuantity(text) {
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
        return numerator / denominator;
      }
    }

    // 2️⃣ Decimalni ili ceo broj "1.5", "2", "2,5"
    const decimalRegex = /\d+(?:[.,]\d+)?/;
    match = text.match(decimalRegex);
    if (match) {
      if(!isInsideParentheses(match.index)){
        return Number(match[0].replace(",", "."));
      }
    }

    // 3️⃣ ništa nije pronađeno
    return null;
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
      vanilla_pod: ["vanila", "vanilija"],
      yeast_cube: ["kvasac", "kvasca"],
      rum: ["rum", "ruma"]
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
    };

    return densities[ingredientKey] ?? null;
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

function addSingleIngredient(plainTextIngredient) {
  if (!plainTextIngredient) return;

  const text = plainTextIngredient;

  const DASH_REGEX = /[-–—−]/;

  // 1. Pronađi opsege zagrada
  const parenthesesRanges = [];
  const stack = [];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") stack.push(i);
    if (text[i] === ")" && stack.length) {
      parenthesesRanges.push([stack.pop(), i]);
    }
  }

  const isInsideParentheses = index =>
    parenthesesRanges.some(([s, e]) => index > s && index < e);

  // 2. Pronađi brojeve (uključujući razlomke)
  const numberRegex = /\d+\/\d+|\d+(?:[.,]\d+)?/g;

  const matches = [...text.matchAll(numberRegex)].filter(m => {
    const idx = m.index;
    const len = m[0].length;

    // ❌ broj u zagradi
    if (isInsideParentheses(idx)) return false;

    // okolina broja
    const before = text.slice(Math.max(0, idx - 2), idx);
    const after = text.slice(idx + len, idx + len + 2);

    // ❌ deo raspona (100-150, 100–150, 100−150)
    if (DASH_REGEX.test(before) || DASH_REGEX.test(after)) {
      return false;
    }

    return true;
  });

  // 3. Ako nema validnih brojeva → ceo string je jedan sastojak
  if (matches.length === 0) {
    activeRecipe.value.addIngredient(
      new Ingredient(text.trim())
    );
    return;
  }

  // 4. Iseci od broja do sledećeg validnog broja
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = matches[i + 1]?.index ?? text.length;

    const part = text.slice(start, end).trim();

    if (part) {
      activeRecipe.value.addIngredient(
        new Ingredient(part)
      );
    }
  }
}


function normalizeRecipeOCR(text) {
  return text
    // 4jaja → 4 jaja, 250g → 250 g
    .replace(/(?<=\d)(?=[A-Za-zČĆŽŠĐčćžšđ])/g, " ")

    // ukloni sve što nije "naše"
    .replace(/[^A-Za-zČĆŽŠĐčćžšđ0-9.,\-(): \n\r]/g, "")

    // normalizuj razmake
    .replace(/\s+/g, " ")
    .trim();
}

async function addIngredient(fileEvent = null) {

  if(inputMethod.value === "one-by-one"){
    addSingleIngredient(newIngredientInputValue.value)
    newIngredientInputValue.value = ""
  }

  if(inputMethod.value === "all-in-one"){
    const ingredientPlainTextsArray = newIngredientInputValue.value.trim().split("\n")

    activeRecipe.value.removeAllIngredients()

    ingredientPlainTextsArray.forEach(ing => {

      if(ing) addSingleIngredient(ing)
    })
  }


  if (inputMethod.value === "image") {
    const file = fileEvent.target.files[0];

    // Kreiramo workera sa definisanim lokalnim putanjama
    const worker = await createWorker(["hrv", "eng", "bos"], 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/tesseract-core.wasm.js',
      langPath: '/tesseract/tessdata',
      gzip: false,
      // logger: m => console.log(m),
    });

    // await worker.setParameters({
    //   tessedit_char_whitelist:
    //     "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    //     "abcdefghijklmnopqrstuvwxyz" +
    //     "ČĆŽŠĐčćžšđ" +
    //     "0123456789" +
    //     ".,-(): ",
    // });

    try {
      const data = await worker.recognize(file);

      console.log(data)

      const text = data.data.text

      const newText = normalizeRecipeOCR(text)

      inputMethod.value = "all-in-one";
      newIngredientInputValue.value = newText

      await worker.terminate();
    } catch (err) {
      console.error("Greška pri čitanju:", err);
    }
  }

  localStorage.setItem("recipe", JSON.stringify(recipes.value.map(recipe => recipe.getMinimalObject())))
}

function removeIngredient(index) {
  activeRecipe.value.removeIngredient(index);

   newIngredientInputValue.value = activeRecipe.value.ingredientsToTextarea()

  localStorage.setItem("recipe", JSON.stringify(recipes.value.map(recipe => recipe.getMinimalObject())))
}

function multiplyNumberInString(text, multiplier) {
  return text.replace(/\d+(\.\d+)?/, (match) => {
    let num = Number(match) * multiplier;

    num = +(Math.round(num + "e+2")  + "e-2");

    return num

  });
}

function showSolution(multiplier) {

  const newRecipe = new Recipe()

  activeRecipe.value.ingredients.forEach(item => {
    const transformedString = multiplyNumberInString(item.textFormat, multiplier)
    newRecipe.ingredients.push(new Ingredient(transformedString))
  })

  solution.value = newRecipe
}

function addNewRecipe() {
  let recipe = new Recipe();
  recipes.value.push(recipe);


  activeRecipeId.value = recipe.id;

  creatingNewRecipe.value = true
}

function finishRecipe(){
  creatingNewRecipe.value = false;
  screen.value = "recipe"
}

function showRecipe(id){
  activeRecipeId.value = id;

  screen.value = "recipe"
}

function changeScreen(s){
  inputMethod.value = "one-by-one"
  screen.value = s;
  activeRecipeId.value = null
  newIngredientInputValue.value = ""

  solution.value = null
}

function selectInputType(inputType){
  inputMethod.value = inputType


  if(inputType === "all-in-one"){
    newIngredientInputValue.value = activeRecipe.value.ingredientsToTextarea()
  }
  else if(inputType === "one-by-one"){
    newIngredientInputValue.value = ""
  }
  else if(inputType === "image"){
    newIngredientInputValue.value = null
  }
}

onMounted(() => {
  const local = localStorage.getItem("recipe")

  if (!local || local === "null") return;

  let localArray = JSON.parse(local);

  localArray.forEach(r => {

    const recipe = new Recipe(r)
    recipes.value.push(recipe)
  })
})


function deleteRecipe(){
  recipes.value = recipes.value.filter(recipe => recipe.id !== activeRecipe.value.id);
  changeScreen("selector")
  localStorage.setItem("recipe", JSON.stringify(recipes.value.map(recipe => recipe.getMinimalObject())))
}

</script>

<template>

  <h1>Tortomer</h1> <h2 v-if="activeRecipe?.name">{{activeRecipe.name}}  <button @click="deleteRecipe" class="button button-danger">Obriši</button>
    <button @click="changeScreen('selector')">Nazad na recepte</button>
  </h2>


  <div v-if="screen === 'selector'" class="selector">


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

      <button @click="finishRecipe">Dodaj sastojke</button>

    </div>


  </div>


  <template v-else-if="screen === 'recipe'">

    <div class="tabs">
      <div class="tab" @click="selectInputType('one-by-one')" :class="{ selected: inputMethod === 'one-by-one'}">Jedan po jedan sastojak</div>
      <div class="tab" @click="selectInputType('all-in-one')" :class="{ selected: inputMethod === 'all-in-one'}">Ceo recept odjedanput</div>
      <div class="tab" @click="selectInputType('image')" :class="{ selected: inputMethod === 'image'}">Slika</div>
    </div>

    <section class="input-box" :class="inputMethod">

      <template v-if="inputMethod === 'one-by-one'">
        <input  type="text" v-model="newIngredientInputValue" @keyup.enter="addIngredient" /> <button @click="addIngredient">+</button>
      </template>


      <template v-else-if="inputMethod === 'all-in-one'">
        <textarea type="text" v-model="newIngredientInputValue"> {{ activeRecipe.ingredientsToTextarea() }} </textarea> <button @click="addIngredient">Gotovo</button>
      </template>

      <template v-else-if="inputMethod === 'image'">
        <input type="file" name="file" id="file" @change="addIngredient">
      </template>


    </section>

    <section class="recipe">
      <div v-for="(item, index) in activeRecipe.ingredients" class="recipe-item item">


        <template v-if="!item.isHeader">
          <div class="item-text">
            {{ item.textFormat }} <span v-if="item.ingredientMass">  ~ {{ item.ingredientMass }}g</span>
          </div>

          <button @click="removeIngredient(index)">x</button>
        </template>



        <template v-else>
          <h3>{{ item.textFormat }}</h3>
        </template>


      </div>


      {{ activeRecipe?.getMass() }} kg

    </section>


    <section class="buttons">
      <button class="button" @click="showSolution(0.25)">1/4 Četvrtina</button>
      <button class="button" @click="showSolution(0.33333333)">1/3 Trećina</button>
      <button class="button" @click="showSolution(0.5)">1/2 Pola</button>
      <button class="button" @click="showSolution(0.66666666)">2/3 Dve trećine</button>
      <button class="button" @click="showSolution(0.75)">3/4 Tri četvrtine</button>
      <button class="button" @click="showSolution(1.25)">1 1/4 (1 + jedna četvrtina)

      </button>
      <button class="button" @click="showSolution(1.5)">1.5x Pola više</button>
      <button class="button" @click="showSolution(2)">X2 Duplo</button>
      <button class="button" @click="showSolution(2.5)">X2.5 2 Ipo puta više</button>
      <button class="button" @click="showSolution(3)">X3 3 puta više</button>
      <button class="button" @click="showSolution(4)">X4 4 puta više</button>
    </section>

    <section class="solution" v-if="solution">
      <div v-for="item in solution.ingredients" class="solution-item item">


        <template v-if="!item.isHeader">
          <div class="item-text">
            {{ item.textFormat }} <span v-if="item.ingredientMass">  ~ {{ item.ingredientMass }}g</span>
          </div>

          <button @click="removeIngredient(index)">x</button>
        </template>



        <template v-else>
          <h3>{{ item.textFormat }}</h3>
        </template>


      </div>

      {{ solution?.getMass() }} kg

    </section>
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .5rem;
}

.tabs{
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  margin-bottom: 1rem;
}

.tabs .tab {
  border: 1px solid #F082AC;
  border-radius: .5rem;
  padding: 1rem;
  cursor: pointer;
  transition: 0.3s;
}


.tabs .tab.selected {
  background-color: #EA4C89;
}

.tabs .tab:hover:not(.tab.selected){
  background-color: #EA4C89;
}

textarea {
  display: block;
  height: 100px;
  font-size: 1rem;
  margin-block: 1rem;
  padding-block: .5rem;

  border: 0;
  outline: 1px solid gray;
  border-radius: .5rem;
  padding-inline-start: .5rem;
}

.all-in-one{
  flex-direction: column;
}


* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  padding: .5rem;
}


.selector .buttons {


  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
  gap: .5rem;

}

.selector .buttons > * {

  border-radius: .5rem;
  padding: .5rem;
  border: 1px solid #F082AC;

}

</style>
