import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useRecipeStore = defineStore("recipe", () => {
  const recipes = ref([]);

  const activeRecipeId = ref<Number | null>(null);

  const activeRecipe = computed(() => {
    const recipe = recipes.value.find((r) => r.id === activeRecipeId.value);
    return recipe;
  });

  function deleteActiveRecipe() {
    recipes.value = recipes.value.filter(
      (recipe) => recipe.id !== activeRecipe.value.id,
    );
    localStorage.setItem(
      "recipe",
      JSON.stringify(recipes.value.map((recipe) => recipe.getMinimalObject())),
    );
  }

  return { recipes, activeRecipe, deleteActiveRecipe, activeRecipeId };
});
