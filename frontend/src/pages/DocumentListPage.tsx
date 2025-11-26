import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Tag, Space, message, Select, Card, Row, Col, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { assignmentApi } from '../services/api';
import { Document, User } from '../types';

const { Option } = Select;

const DocumentListPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // 获取用户信息
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }, []);

  // 获取文档列表
  const fetchDocuments = useCallback(async (currentUser: User) => {
    try {
      setLoading(true);
      const response = await api.get('/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取用户列表（管理员用）
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data.filter((u: User) => u.role === 'expert'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      const currentUser = await fetchUserProfile();
      if (currentUser?.role === 'admin') {
        await fetchUsers();
      }
      if (currentUser) {
        await fetchDocuments(currentUser);
      }
    };

    initializeData();
  }, [fetchUserProfile, fetchDocuments, fetchUsers]);

  // 分配文档给用户（管理员用）
  const handleAssignDocument = async (documentId: number, userId: number | null) => {
    try {
      await assignmentApi.assignDocument({
        document_id: documentId,
        assigned_to: userId
      });
      message.success(userId ? '文档分配成功' : '文档分配已取消');

      // 刷新文档列表
      if (user) {
        await fetchDocuments(user);
      }
    } catch (error) {
      console.error('Failed to assign document:', error);
    }
  };

  // 认领文档（专家用）
  const handleClaimDocument = async (documentId: number) => {
    try {
      await assignmentApi.claimDocument(documentId);
      message.success('文档认领成功');

      // 刷新文档列表
      if (user) {
        await fetchDocuments(user);
      }
    } catch (error) {
      console.error('Failed to claim document:', error);
    }
  };

  const getStatusTag = (annotationStatus?: string) => {
    switch (annotationStatus) {
      case "未标注":
        return <Tag color="gold">待标注</Tag>;
      case "已标注":
        return <Tag color="green">已标注</Tag>;
      case "进行中":
        return <Tag color="blue">标注中</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  const getAssignmentTag = (assignedTo: number | null, assignedToUsername: string | null, currentUser: User) => {
    if (currentUser.role === 'expert') {
      // 专家视图：不显示分配标签，保持透明
      return null;
    }

    if (assignedTo && assignedToUsername) {
      return <Tag color="purple">已分配给 {assignedToUsername}</Tag>;
    } else {
      return <Tag color="orange">未分配</Tag>;
    }
  };

  // 构建表格列
  const buildColumns = useCallback((): ColumnsType<Document> => {
    if (!user) return [];

    const baseColumns: ColumnsType<Document> = [
      {
        title: '文档标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
      },
      {
        title: '标注状态',
        dataIndex: 'annotation_status',
        key: 'annotation_status',
        render: (annotationStatus) => getStatusTag(annotationStatus),
      },
      {
        title: '字数',
        dataIndex: 'word_count_source',
        key: 'word_count_source',
        width: 100,
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
      },
    ];

    // 管理员视图：添加分配状态和操作列
    if (user.role === 'admin') {
      baseColumns.push(
        {
          title: '分配状态',
          key: 'assignment_status',
          render: (_, record) => getAssignmentTag(record.assigned_to, record.assigned_to_username, user),
        },
        {
          title: '分配操作',
          key: 'assignment_action',
          width: 200,
          render: (_, record) => (
            <Select
              style={{ width: '100%' }}
              placeholder="选择专家"
              value={record.assigned_to}
              onChange={(value) => handleAssignDocument(record.id, value)}
              allowClear
            >
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.full_name || u.username}
                </Option>
              ))}
            </Select>
          ),
        }
      );
    }

    // 添加操作列
    baseColumns.push({
      title: '操作',
      key: 'action',
      width: user.role === 'expert' ? 150 : 120,
      render: (_, record) => (
        <Space size="middle">
          {user.role === 'expert' && !record.assigned_to && (
            <Button
              size="small"
              onClick={() => handleClaimDocument(record.id)}
            >
              认领
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            onClick={() => navigate(`/documents/${record.id}`)}
          >
            {user.role === 'admin' ? '查看标注' : (record.annotation_status === '已标注' ? '查看标注' : '开始标注')}
          </Button>
        </Space>
      ),
    });

    return baseColumns;
  }, [user, users, handleAssignDocument, handleClaimDocument, navigate]);

  // 计算统计数据
  const getStats = () => {
    if (!user) return null;

    if (user.role === 'expert') {
      const assignedToMe = documents.filter(doc => doc.assigned_to === user.id).length;
      const available = documents.filter(doc => !doc.assigned_to).length;
      const annotated = documents.filter(doc => doc.annotation_status === '已标注').length;

      return (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic title="分配给我" value={assignedToMe} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="可认领" value={available} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="已标注" value={annotated} />
            </Card>
          </Col>
        </Row>
      );
    }

    // 管理员统计
    const totalDocs = documents.length;
    const assignedDocs = documents.filter(doc => doc.assigned_to).length;
    const unassignedDocs = documents.filter(doc => !doc.assigned_to).length;
    const annotatedDocs = documents.filter(doc => doc.annotation_status === '已标注').length;

    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总文档数" value={totalDocs} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已分配" value={assignedDocs} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="未分配" value={unassignedDocs} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已标注" value={annotatedDocs} />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {user && (
        <>
          {getStats()}
          <Table
            columns={buildColumns()}
            dataSource={documents}
            rowKey="id"
            loading={loading}
            title={() => (
              <h2>
                {user.role === 'admin' ? '文档管理' : '我的文档'}
                {user.role === 'expert' && (
                  <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: 16, color: '#666' }}>
                    包含分配给您和可认领的文档
                  </span>
                )}
              </h2>
            )}
            scroll={{ x: 'max-content' }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条文档`,
            }}
          />
        </>
      )}
    </div>
  );
};

export default DocumentListPage;
