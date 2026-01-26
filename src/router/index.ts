import { createRouter, createWebHistory } from 'vue-router'
import NewRecipeView from '@/views/NewRecipeView.vue'
import SingleRecipeView from '@/views/SingleRecipeView.vue'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: "/creating-new", component: NewRecipeView},
    { path: "/recipe/:id", component: SingleRecipeView}
  ],
})

export default router
