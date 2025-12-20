import { createRouter, createWebHistory } from 'vue-router';
import Layout from '../layout/Layout.vue';
import Login from '../views/login/Login.vue';
import Home from '../views/home/Home.vue';
import UserManage from '../views/user/UserManage.vue';
import DeviceManage from '../views/device/DeviceManage.vue';
import BorrowApply from '../views/borrow/BorrowApply.vue';
import BorrowReturn from '../views/borrow/BorrowReturn.vue';
import Feedback from '../views/feedback/Feedback.vue';
import BorrowOrder from '../views/order/BorrowOrder.vue';
import FeedbackOrder from '../views/order/FeedbackOrder.vue';
import InsertOrder from '../views/order/InsertOrder.vue';
import ScrapOrder from '../views/order/ScrapOrder.vue';
import Statistics from '../views/order/Statistics.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'Home', component: Home, meta: { roles: [1, 2] } },
      { path: 'user', name: 'UserManage', component: UserManage, meta: { roles: [1] } },
      { path: 'device', name: 'DeviceManage', component: DeviceManage, meta: { roles: [1] } },
      { path: 'borrow/apply', name: 'BorrowApply', component: BorrowApply, meta: { roles: [2, 1] } },
      { path: 'borrow/return', name: 'BorrowReturn', component: BorrowReturn, meta: { roles: [2, 1] } },
      { path: 'feedback', name: 'Feedback', component: Feedback, meta: { roles: [2, 1] } },
      { path: 'order/borrow', name: 'BorrowOrder', component: BorrowOrder, meta: { roles: [1] } },
      { path: 'order/feedback', name: 'FeedbackOrder', component: FeedbackOrder, meta: { roles: [1] } },
      { path: 'order/insert', name: 'InsertOrder', component: InsertOrder, meta: { roles: [1] } },
      { path: 'order/scrap', name: 'ScrapOrder', component: ScrapOrder, meta: { roles: [1] } },
      { path: 'order/statistics', name: 'Statistics', component: Statistics, meta: { roles: [1] } },
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 权限路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('app_token');
  const userInfo = localStorage.getItem('user_info');
  if (to.meta.public) return next();
  if (!token) return next('/login');
  if (to.meta.roles && userInfo) {
    const user = JSON.parse(userInfo);
    if (!to.meta.roles.includes(user.type)) {
      return next('/');
    }
  }
  next();
});

export default router;
