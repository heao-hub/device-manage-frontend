import { getToken, setToken, removeToken } from '../utils/auth';
import { login as apiLogin, getUserById, logout as apiLogout } from '../api/user';

const state = () => ({
  token: getToken(),
  info: JSON.parse(localStorage.getItem('user_info') || 'null'),
});

const mutations = {
  setToken(state, token) {
    state.token = token;
    setToken(token);
  },
  setInfo(state, info) {
    state.info = info;
    localStorage.setItem('user_info', JSON.stringify(info));
  },
  clear(state) {
    state.token = null;
    state.info = null;
    removeToken();
    localStorage.removeItem('user_info');
  }
};

const actions = {
  async login({ commit }, payload) {
    const res = await apiLogin(payload);
    if (res.data && res.data.code === 1) {
      commit('setToken', res.data.data.token);
      commit('setInfo', res.data.data);
      return true;
    }
    return false;
  },
  async logout({ commit }) {
    await apiLogout();
    commit('clear');
  },
  async fetchUserInfo({ commit, state }) {
    if (!state.info?.id) return;
    const res = await getUserById(state.info.id);
    if (res.data && res.data.code === 1) {
      commit('setInfo', res.data.data);
    }
  }
};

const getters = {
  isAdmin: state => state.info?.type === 1,
  isUser: state => state.info?.type === 2,
  userInfo: state => state.info,
  token: state => state.token,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
