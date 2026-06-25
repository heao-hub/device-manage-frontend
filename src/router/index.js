import { createRouter, createWebHistory } from 'vue-router';
import Layout from '../layout/Layout.vue';
import Login from '../views/login/Login.vue';
import Register from '../views/login/Register.vue';
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
    meta: { public: true, title: '登录 - 设备预约管理系统' }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { public: true, title: '注册 - 设备预约管理系统' }
  },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'Home', component: Home, meta: { roles: [1, 2], title: '首页 - 设备预约管理系统' } },
      { path: 'user', name: 'UserManage', component: UserManage, meta: { roles: [1], title: '用户管理' } },
      { path: 'device', name: 'DeviceManage', component: DeviceManage, meta: { roles: [1], title: '设备管理' } },
      { path: 'borrow/apply', name: 'BorrowApply', component: BorrowApply, meta: { roles: [2, 1], title: '预约设备' } },
      { path: 'borrow/return', name: 'BorrowReturn', component: BorrowReturn, meta: { roles: [2, 1], title: '我的预约' } },
      { path: 'feedback', name: 'Feedback', component: Feedback, meta: { roles: [2, 1], title: '设备反馈' } },
      { path: 'order/borrow', name: 'BorrowOrder', component: BorrowOrder, meta: { roles: [1], title: '预约单管理' } },
      { path: 'order/feedback', name: 'FeedbackOrder', component: FeedbackOrder, meta: { roles: [1], title: '反馈表管理' } },
      { path: 'order/insert', name: 'InsertOrder', component: InsertOrder, meta: { roles: [1], title: '入库单管理' } },
      { path: 'order/scrap', name: 'ScrapOrder', component: ScrapOrder, meta: { roles: [1], title: '报废单管理' } },
      { path: 'order/statistics', name: 'Statistics', component: Statistics, meta: { roles: [1], title: '数据统计' } },
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
  
  if (to.meta && to.meta.public) {
    console.log('Public route, allowing access');
    return next();
  }
  
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
      return next('/login');
    }
  }
  
  console.log('Access granted');
  next();
});

// 全局后置钩子，页面滚动到顶部
router.afterEach((to, from) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  window.scrollTo(0, 0);
});

export default router;
