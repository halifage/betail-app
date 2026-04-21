import { createRouter, createWebHistory } from 'vue-router';
import Login from './login/Login.vue';
import Logout from './login/Logout.vue';
import Home from './home/Home.vue';
import CreateAnimalForm from './livestock/CreateAnimalForm.vue';
import AnimalDetail from './livestock/AnimalDetail.vue';
import WeighInForm from './livestock/WeighInForm.vue';
import HealthEventForm from './livestock/HealthEventForm.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', name: 'Login', component: Login },
    { path: '/logout', name: 'Logout', component: Logout },
    { path: '/home', name: 'Home', component: Home },
    { path: '/animals/new', name: 'CreateAnimal', component: CreateAnimalForm },
    { path: '/animals/:id', name: 'AnimalDetail', component: AnimalDetail },
    { path: '/animals/:id/weigh-in', name: 'WeighIn', component: WeighInForm },
    { path: '/animals/:id/health-event', name: 'HealthEvent', component: HealthEventForm },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
});

export default router;
