import { DislikeOutlined, LikeOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Card, Col, message, Row, Tooltip, Typography, Space, Divider, Affix, Popover, Input, Spin, List, Tag } from 'antd';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import styles from './AnnotationPage.module.css';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

// 定义数据类型
interface DocumentDetail {
  id: number;
  title: string;
  source_content: string;
  generated_content: string;  // 修改字段名与后端一致
}
interface AnnotationComment {
  selected_text: string;
  comment: string;
}
interface AnnotationData {
  evaluation?: 'good' | 'bad';
  comments: AnnotationComment[];
}

const AnnotationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [annotation, setAnnotation] = useState<AnnotationData>({ comments: [] });
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  
  const fetchDocumentAndAnnotation = useCallback(async () => {
    setLoading(true);
    try {
      const docPromise = api.get(`/documents/${id}`);
      const annotationPromise = api.get(`/annotations/${id}`);
      const [docResponse, annotationResponse] = await Promise.all([docPromise, annotationPromise]);

      setDocument(docResponse.data);
      if (annotationResponse.data && annotationResponse.data.evaluation !== null) {
        // 转换后端数据格式为前端格式
        const backendData = annotationResponse.data;
        const frontendData: AnnotationData = {
          evaluation: backendData.evaluation !== null ? (backendData.evaluation ? 'good' : 'bad') : undefined,
          comments: backendData.comments.map((comment: any) => ({
            selected_text: comment.selection || comment.text,
            comment: comment.text
          }))
        };
        setAnnotation(frontendData);
      }
    } catch (error) {
      // 404 error for annotation is fine, means it's new
      if ((error as any).response?.status !== 404) {
         console.error('Failed to fetch data:', error);
      }
      if(!(error as any).response?.config?.url.includes('annotations')){
        // if the doc fails to load, we have a problem.
        console.error('Failed to fetch document:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocumentAndAnnotation();
  }, [fetchDocumentAndAnnotation]);

  const handleSelection = () => {
    const selectedText = window.getSelection()?.toString();
    if (selectedText && selectedText.trim() !== '') {
      setSelection(selectedText.trim());
    }
  };

  const handleAddComment = () => {
    if (!selection || !commentInput.trim()) {
      message.warning('请确保选择了文本并输入了评论内容');
      return;
    }
    const newComment: AnnotationComment = {
      selected_text: selection,
      comment: commentInput.trim(),
    };
    setAnnotation(prev => ({ ...prev, comments: [...prev.comments, newComment] }));
    setSelection(null);
    setCommentInput('');
    message.success('评论已在本地添加');
  };
  
  const handleSetEvaluation = (evaluation: 'good' | 'bad') => {
    setAnnotation(prev => ({ ...prev, evaluation }));
    message.info(`已评价为: ${evaluation === 'good' ? '内容很好' : '有待改进'}`);
  };

  const postAnnotation = async (isCompleted: boolean) => {
    try {
      // 转换数据格式以匹配后端API期望
      const payload = {
        evaluation: annotation.evaluation ? annotation.evaluation === 'good' : false, // 没有评价时默认为false
        comments: annotation.comments.map(comment => ({
          text: comment.comment,
          selection: comment.selected_text
        })),
        time_spent: 0, // 默认值，可以根据需要添加时间追踪
        is_completed: isCompleted,
      };
      console.log('Sending payload:', payload); // 调试日志
      await api.post(`/annotations/${id}`, payload);
      message.success(`标注已成功${isCompleted ? '提交' : '保存'}!`);
    } catch (error) {
      console.error('Failed to post annotation:', error);
      if ((error as any).response?.status === 422) {
        console.error('422 Error Details:', (error as any).response?.data);
        message.error('数据格式错误，请检查输入内容');
      } else {
        message.error('保存失败，请稍后重试');
      }
    }
  };

  const commentPopoverContent = (
    <div style={{ width: 300 }}>
      <Paragraph>对选中文字 "<span className={styles.selectedText}>{selection}</span>" 添加评论:</Paragraph>
      <TextArea 
        rows={4} 
        placeholder="输入您的意见..." 
        value={commentInput}
        onChange={(e) => setCommentInput(e.target.value)}
      />
      <Button 
        type="primary" 
        size="small" 
        style={{ marginTop: 8, width: '100%' }} 
        icon={<SendOutlined />}
        onClick={handleAddComment}
      >
        添加评论
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <Spin tip="加载中..." size="large" />
      </div>
    );
  }
  if (!document) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <Title level={3}>文档加载失败或不存在。</Title>
      </div>
    );
  }

  
  if (!document || !document.source_content || !document.generated_content) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <Title level={3}>文档数据不完整</Title>
        <Paragraph>请检查文档是否包含原始素材和AI生成内容</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <Title level={3}>{document.title || '无标题文档'}</Title>
      <Row gutter={16}>
        <Col span={11}>
          <Card title="原始素材">
            <Paragraph className={styles.contentBox} onMouseUp={handleSelection}>
              {document.source_content}
            </Paragraph>
          </Card>
        </Col>
        <Col span={11}>
          <Card title="AI 生成内容">
            <Paragraph className={styles.contentBox} onMouseUp={handleSelection}>
              {document.generated_content}
            </Paragraph>
          </Card>
        </Col>
         <Col span={2}>
            <Card title="评论列表" size="small">
                <List
                  dataSource={annotation.comments || []}
                  renderItem={item => (
                    <List.Item>
                      <Tooltip title={item.comment}>
                        <Tag color="blue">{item.selected_text?.substring(0, 10) || '...'}...</Tag>
                      </Tooltip>
                    </List.Item>
                  )}
                />
            </Card>
        </Col>
      </Row>

      <Affix offsetBottom={20}>
        <Card className={styles.actionBar}>
          <Row justify="space-between" align="middle">
            <Col>
              <Popover
                content={commentPopoverContent}
                title="添加评论"
                trigger="click"
                open={!!selection}
                onOpenChange={(visible) => !visible && setSelection(null)}
              >
                <Button icon={<MessageOutlined />} disabled={!selection}>
                  {selection ? `评论选中: "${selection.substring(0, 15)}..."` : '请先划词评论'}
                </Button>
              </Popover>
            </Col>
            <Col>
              <Space>
                <Tooltip title="内容很好">
                  <Button 
                    type={annotation.evaluation === 'good' ? 'primary' : 'default'} 
                    shape="circle" 
                    icon={<LikeOutlined />} 
                    size="large" 
                    onClick={() => handleSetEvaluation('good')}
                  />
                </Tooltip>
                <Tooltip title="有待改进">
                  <Button 
                    danger 
                    type={annotation.evaluation === 'bad' ? 'primary' : 'default'}
                    shape="circle" 
                    icon={<DislikeOutlined />} 
                    size="large" 
                    onClick={() => handleSetEvaluation('bad')}
                  />
                </Tooltip>
                <Divider type="vertical" />
                <Button onClick={() => postAnnotation(false)}>保存标注</Button>
                <Button type="primary" onClick={() => postAnnotation(true)}>完成标注</Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </Affix>
    </div>
  );
};


export default AnnotationPage;
