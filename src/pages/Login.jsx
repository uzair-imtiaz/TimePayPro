import React, { useState } from "react";
import { Form, Input, Button, notification } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import "./Login.css"; // Optional for styling

const predefinedCredentials = {
  username: "admin",
  password: "1234",
};

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = (values) => {
    setLoading(true);
    const { username, password } = values;

    if (
      username.toLowerCase() === predefinedCredentials.username.toLowerCase() &&
      password === predefinedCredentials.password
    ) {
      notification.success({
        message: "Login Successful",
        description: "Welcome back!",
      });
      onLoginSuccess();
    } else {
      notification.error({
        message: "Login Failed",
        description: "Invalid username or password.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <Form
        name="login"
        layout="vertical"
        onFinish={handleLogin}
        style={{ maxWidth: 400 }}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Username"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
          >
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
