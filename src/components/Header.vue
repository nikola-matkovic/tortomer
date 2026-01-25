<template>
  <RouterLink to="/" >
    <h1>Tortomer</h1>
  </RouterLink>

  <h2 v-if="store?.activeRecipe">{{store?.activeRecipe?.name}}  <button @click="deleteRecipe" class="button button-danger">Obriši</button></h2>
</template>

<script setup>

import router from '@/router';
import { useRecipeStore } from '../stores/recipes';

const store = useRecipeStore();

function deleteRecipe(){

  const res = confirm("Da li ste sigurni da želite da obrišete ovaj recept?")

  if(res){
    store?.deleteActiveRecipe()
    router.push("/")
  }
}

</script>


<style lang="scss" scoped>


</style>
