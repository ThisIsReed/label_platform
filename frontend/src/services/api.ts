import axios from 'axios';
import { message } from 'antd';

// 创建 Axios 实例
const api = axios.create({
  baseURL: '/api', // Vite proxy 会将 /api 转发到 http://localhost:8001
  timeout: 10000,
});

// 请求拦截器：在每个请求头中添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理全局错误
api.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，跳转到登录页
          message.error('认证失败，请重新登录');
          localStorage.removeItem('token');
          // 使用 window.location.href 是因为此时可能无法访问 useNavigate
          window.location.href = '/login';
          break;
        case 403:
          message.error('您没有权限执行此操作');
          break;
        case 404:
          message.error('请求的资源未找到');
          break;
        case 500:
          message.error('服务器内部错误，请联系管理员');
          break;
        default:
          message.error(error.response.data?.detail || '请求发生错误');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      message.error('无法连接到服务器，请检查您的网络');
    } else {
      // 发送请求时出了点问题
      message.error('请求失败');
    }
    return Promise.reject(error);
  }
);

export default api;
