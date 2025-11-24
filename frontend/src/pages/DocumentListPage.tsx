import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// 定义文档数据类型
interface DocumentType {
  id: number;
  title: string;
  status: string;
  annotation_status?: string; // "未标注", "进行中", "已标注"
  word_count_source: number;
  word_count_generated: number;
  created_at: string;
}

const DocumentListPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await api.get('/documents/');
        setDocuments(response.data);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        // 错误消息由拦截器处理
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

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

  const columns: ColumnsType<DocumentType> = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'annotation_status',
      key: 'annotation_status',
      render: (annotationStatus) => getStatusTag(annotationStatus),
    },
    {
      title: '字数',
      dataIndex: 'word_count_source',
      key: 'word_count_source',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => navigate(`/documents/${record.id}`)}>
            {record.annotation_status === '已标注' ? '查看标注' : '开始标注'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Table
        columns={columns}
        dataSource={documents}
        rowKey="id"
        loading={loading}
        title={() => <h2>文档列表</h2>}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default DocumentListPage;
