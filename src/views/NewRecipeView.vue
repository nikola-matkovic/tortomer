<script setup lang="ts">
import { useRecipeStore } from '@/stores/recipes';
import Recipe from '@/classes/Recipe';
import router from '@/router';
import { ref } from 'vue';

const store = useRecipeStore();

const recipeName = ref("")

function addIngredients() {
  let recipe = new Recipe();
  recipe.name = recipeName.value

  store.recipes.push(recipe)
  router.push(`/recipe/${recipe.id}`)
}

</script>

<template>

  <section class="input-box">
    <input placeholder="Ime torte" type="text" v-model="recipeName">
  </section>

  <button @click="addIngredients">Dodaj sastojke</button>

</template>

<style scoped lang="scss">
.input-box {
  display: flex;
  gap: .5rem;
}

.input-box input {
  flex-grow: 1;
}
</style>