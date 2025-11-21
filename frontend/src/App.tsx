import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 导入页面组件
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/PrivateRoute';
import DocumentListPage from './pages/DocumentListPage';
import AnnotationPage from './pages/AnnotationPage';
import StatsPage from './pages/StatsPage';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Routes>
          {/* 公共路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 私有路由 */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/documents" replace />} />
            <Route path="/documents" element={<DocumentListPage />} />
            <Route path="/documents/:id" element={<AnnotationPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Route>
          
          {/* 兜底路由 */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
