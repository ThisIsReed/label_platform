import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Layout, message } from 'antd';
import { useNavigate } from 'react-router-dom';
// import { api } from '../services/api'; // 稍后创建
import styles from './LoginPage.module.css'; // 复用登录页样式

const { Content } = Layout;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      // 密码和确认密码一致性已由 Form.Item 规则保证
      const { confirmPassword, ...registerData } = values;
      const response = await api.post('/auth/register', registerData);
      console.log('Registration successful:', response.data);
      message.success('注册成功！正在跳转到登录页...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error('Registration failed:', error);
      // 全局错误拦截器会处理消息提示
    }
  };

  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <Card title="创建新账户" className={styles.loginCard}>
          <Form
            form={form}
            name="register"
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
              name="real_name"
              rules={[{ required: true, message: '请输入真实姓名!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="真实姓名" />
            </Form.Item>
            
            <Form.Item
              name="email"
              rules={[{ required: true, message: '请输入邮箱!', type: 'email' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className={styles.loginButton}>
                注册
              </Button>
              <Button type="link" onClick={() => navigate('/login')}>
                已有账户？立即登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default RegisterPage;
