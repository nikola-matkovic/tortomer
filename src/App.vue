<script setup lang="ts">
import Header from './components/Header.vue';
import { onMounted } from 'vue';
import { useRecipeStore } from './stores/recipes';

const store = useRecipeStore();
import Recipe from "./classes/Recipe.ts"

onMounted(() => {
  const local = localStorage.getItem("recipe")

  if (!local || local === "null") return;

  const localArray = JSON.parse(local);

  localArray.forEach(r => {

    const recipe = new Recipe(r)
    store.recipes.push(recipe)
  })
})

</script>

<template>
  <Header />
  <main>
    <RouterView />
  </main>
</template>


<style lang="scss">
section {
  margin-bottom: 1rem;
}

a,
a:hover,
a:active {
  color: inherit;
  text-decoration: none;
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

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

#app {
  padding: .5rem;
}

.button.active {
  background-color: #5e1e37;
}


input,
input:focus,
input:focus-visible {
  outline: 0;
  border-radius: .5rem;
  height: 40px;
  border: 1px solid #EA4C89;
}
</style>