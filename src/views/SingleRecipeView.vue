<script setup>
import { useRecipeStore } from '@/stores/recipes';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
const store = useRecipeStore();
import Recipe from '@/classes/Recipe';
import Ingredient from '@/classes/Ingredient';
import { roundNumber } from '@/functions/helpers';

const newIngredientInputValue = ref("")
const activeSolutionButton = ref(null)
const activeSolutionMultiplier = ref(null)
const solution = ref(null)


const route = useRoute();
const id = route.params.id;

store.activeRecipeId = Number(id);
const inputMethod = ref("one-by-one")

function addIngredient() {

  if(inputMethod.value === "one-by-one"){
    store.activeRecipe.updateIngredients(newIngredientInputValue.value, false)
    newIngredientInputValue.value = ""
  }

  if(inputMethod.value === "all-in-one"){
    store.activeRecipe.updateIngredients(newIngredientInputValue.value, true)
  }

  if(activeSolutionMultiplier.value){
    updateSolution(activeSolutionMultiplier.value)
  }

  localStorage.setItem("recipe", JSON.stringify(store.recipes.map(recipe => recipe.getMinimalObject())))
}

function selectInputType(inputType){
  inputMethod.value = inputType


  if(inputType === "all-in-one"){
    newIngredientInputValue.value = store.activeRecipe.ingredientsToTextarea()
  }
  else if(inputType === "one-by-one"){
    newIngredientInputValue.value = ""
  }
}


function removeIngredient(index) {
  store.activeRecipe.removeIngredient(index);

  if(inputMethod.value === "all-in-one"){
    newIngredientInputValue.value = store.activeRecipe.ingredientsToTextarea()
  }

  if(activeSolutionMultiplier.value){
    updateSolution(activeSolutionMultiplier.value)
  }

  localStorage.setItem("recipe", JSON.stringify(store.recipes.map(recipe => recipe.getMinimalObject())))
}

function showSolution(multiplier, e) {


  // Click on the same button twice - hide solution
  if(activeSolutionButton.value === e.target){
    activeSolutionButton.value.classList.remove("active")
    activeSolutionButton.value = null
    solution.value = null
    activeSolutionMultiplier.value = null
    return
  }


  // Already opened another - clean up old
  if(activeSolutionButton.value){
    activeSolutionButton.value.classList.remove("active")
  }

  activeSolutionMultiplier.value = multiplier
  e.target.classList.add("active");
  activeSolutionButton.value = e.target;

  updateSolution(multiplier)
}


function updateSolution(multiplier){
    const newRecipe = new Recipe()

  store.activeRecipe.ingredients.forEach(item => {
    const transformedString = multiplyNumberInString(item.textFormat, multiplier)
    newRecipe.ingredients.push(new Ingredient(transformedString))
  })

  solution.value = newRecipe
}

function multiplyNumberInString(text, multiplier) {
  return text.replace(/\d+(\.\d+)?/, (match) => {
    let num = Number(match) * multiplier;
    return roundNumber(num)
  });
}

</script>

<template>

    <div class="tabs">
      <div class="tab" @click="selectInputType('one-by-one')" :class="{ selected: inputMethod === 'one-by-one'}">Jedan po jedan sastojak</div>
      <div class="tab" @click="selectInputType('all-in-one')" :class="{ selected: inputMethod === 'all-in-one'}">Ceo recept odjedanput</div>
    </div>

    <section class="input-box" :class="inputMethod">

      <template v-if="inputMethod === 'one-by-one'">
        <input  type="text" v-model="newIngredientInputValue" @keyup.enter="addIngredient" /> <button @click="addIngredient">+</button>
      </template>


      <template v-if="inputMethod === 'all-in-one'">
        <textarea type="text" v-model="newIngredientInputValue"> {{ store?.activeRecipe.ingredientsToTextarea() }} </textarea> <button @click="addIngredient">Gotovo</button>
      </template>

    </section>

    <section class="recipe">
      <div v-for="(item, index) in store?.activeRecipe.ingredients" class="recipe-item item">


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

      <div class="mass">
        {{ store?.activeRecipe?.getMass() }}
      </div>


    </section>


    <section class="buttons">
      <button class="button" @click="(e) => showSolution(0.25, e)">1/4 Četvrtina</button>
      <button class="button" @click="(e) => showSolution(0.33333333, e)">1/3 Trećina</button>
      <button class="button" @click="(e) => showSolution(0.5, e)">1/2 Pola</button>
      <button class="button" @click="(e) => showSolution(0.66666666, e)">2/3 Dve trećine</button>
      <button class="button" @click="(e) => showSolution(0.75, e)">3/4 Tri četvrtine</button>
      <button class="button" @click="(e) => showSolution(1.25, e)">1 1/4 (1 + jedna četvrtina)

      </button>
      <button class="button" @click="(e) => showSolution(1.5, e)">1.5x Pola više</button>
      <button class="button" @click="(e) => showSolution(2, e)">X2 Duplo</button>
      <button class="button" @click="(e) => showSolution(2.5, e)">X2.5 2 Ipo puta više</button>
      <button class="button" @click="(e) => showSolution(3, e)">X3 3 puta više</button>
      <button class="button" @click="(e) => showSolution(4, e)">X4 4 puta više</button>
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

      <div class="mass">
        {{ solution?.getMass() }} kg
      </div>

    </section>

</template>


<style lang="scss" scoped>


.input-box {
  display: flex;
  gap: .5rem;
}

.input-box input {
  flex-grow: 1;
}

.item {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: .5rem;

  padding-inline-start: .5rem;

  background-color: #f082ac34;
}

.item-text {
  flex-grow: 1;
  min-height: 40px;
  display: flex;
  align-items: center;
}


.recipe,
.solution {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.tabs{
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  margin-bottom: 1rem;

 .tab {
    border: 1px solid #F082AC;
    border-radius: .5rem;
    padding: 1rem;
    cursor: pointer;
    transition: 0.3s;
 }

 .tab.selected {
    background-color: #EA4C89;
    color: white;
  }

  .tab:hover:not(.tab.selected){
    background-color: #EA4C89;
    color: white;
  }
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

.buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .5rem;
}


.mass{
  width: 100%;
  font-weight: bold;
  font-size: 2rem;
}


</style>