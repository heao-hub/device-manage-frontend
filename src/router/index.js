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
  
  console.log('Routing guard triggered:', { to: to.path, from: from.path, token, userInfo });
  
  // 如果访问的是公共页面，直接放行
  if (to.meta && to.meta.public) {
    console.log('Public route, allowing access');
    return next();
  }
  
  // 如果没有token，重定向到登录页
  if (!token) {
    console.log('No token found, redirecting to login');
    return next('/login');
  }
  
  // 检查权限角色
  if (to.meta && to.meta.roles && userInfo) {
    try {
      const user = JSON.parse(userInfo);
      console.log('Checking role permissions:', { requiredRoles: to.meta.roles, userRole: user.type });
      if (!to.meta.roles.includes(user.type)) {
        console.log('Insufficient permissions, redirecting to login');
        return next('/login');
      }
    } catch (e) {
      console.error('Error parsing user info:', e);
      // 如果解析用户信息出错，重定向到登录页
      return next('/login');
    }
  }
  
  console.log('Access granted');
  next();
});

// 全局后置钩子，页面滚动到顶部
router.afterEach((to, from) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  // 滚动到顶部
  window.scrollTo(0, 0);
});

export default router;
