<script setup>
import { useRecipeStore } from '@/stores/recipes';
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';

const store = useRecipeStore()

onMounted(() => {
  store.activeRecipeId = null
})
</script>

<template>

  <div class="selector">
    <div class="buttons">

      <RouterLink v-for="recipe in store.recipes" :to="`/recipe/${recipe.id}`" :key="recipe.id" >
        <div class="recipe-card">
          {{ recipe.name }}
        </div>
      </RouterLink>

      <RouterLink to="/creating-new">
        <button>Dodaj recept</button>
      </RouterLink>
    </div>
  </div>

</template>


<style lang="scss" scoped>

.selector .buttons {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
  gap: .5rem;
}

.recipe-card {

  border-radius: .5rem;
  padding: .5rem;
  border: 1px solid #F082AC;

  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .5rem;

}

</style>