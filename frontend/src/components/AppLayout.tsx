import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Menu, theme, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User } from '../types';
import './AppLayout.css';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('文档列表', '/documents', <DesktopOutlined />),
  getItem('统计分析', '/stats', <PieChartOutlined />),
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSidebarMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const breadcrumbItems = location.pathname.split('/').filter(i => i).map((segment, index, array) => {
    const url = `/${array.slice(0, index + 1).join('/')}`;
    return (
      <Breadcrumb.Item key={url}>
        {index === array.length - 1 ? segment : <a onClick={() => navigate(url)}>{segment}</a>}
      </Breadcrumb.Item>
    );
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="app-logo">
          <div className="logo-icon">📚</div>
          <div className="logo-text">
            <div className="logo-main">地方志标注平台</div>
            <div className="logo-sub">Chronicle Annotator</div>
          </div>
        </div>
        <Menu theme="dark" defaultSelectedKeys={[location.pathname]} mode="inline" items={items} onClick={handleSidebarMenuClick} />
      </Layout.Sider>
      <Layout>
        <Layout.Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
            trigger={['click']}
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {loading ? (
                <Avatar icon={<UserOutlined />} />
              ) : (
                <Avatar icon={<UserOutlined />} src={user?.avatar} />
              )}
              <span style={{ marginLeft: 8 }}>
                {loading ? '加载中...' : (
                  <>
                    <span>{user?.full_name || user?.username || '未知用户'}</span>
                    {user?.role && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: '12px',
                        color: '#666',
                        backgroundColor: user.role === 'admin' ? '#f0f5ff' : '#f6ffed',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {user.role === 'admin' ? '管理员' : '专家'}
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          </Dropdown>
        </Layout.Header>
        <Layout.Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            {breadcrumbItems}
          </Breadcrumb>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet /> {/* 子路由对应的组件将在这里渲染 */}
          </div>
        </Layout.Content>
        <Layout.Footer style={{ textAlign: 'center' }}>
          地方志智能写作助手标注平台 ©{new Date().getFullYear()}
        </Layout.Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;