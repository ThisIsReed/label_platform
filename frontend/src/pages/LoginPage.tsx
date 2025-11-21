import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Layout, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import styles from './LoginPage.module.css';

const { Content } = Layout;

const LoginPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      // 发送真实 API 请求
      const response = await api.post('/auth/login', new URLSearchParams(values).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      message.success('登录成功！');
      localStorage.setItem('token', response.data.access_token); // 保存真实的 token
      navigate('/'); // 跳转到主页
    } catch (error) {
      console.error('Login failed:', error);
      // 错误消息会由 api service 的拦截器统一处理
    }
  };

  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <Card title="地方志智能写作助手标注平台" className={styles.loginCard}>
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className={styles.loginButton}>
                登录
              </Button>
              <Button type="link" onClick={() => navigate('/register')}>
                立即注册
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPage;
