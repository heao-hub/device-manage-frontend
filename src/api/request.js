
import axios from 'axios';
import { getToken } from '../utils/auth';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器，自动加 token
request.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers['token'] = token;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

export default request;
