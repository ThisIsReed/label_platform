import { Navigate, Outlet } from 'react-router-dom';
import AppLayout from './AppLayout';

const PrivateRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token'); // 检查 token 是否存在

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default PrivateRoute;
