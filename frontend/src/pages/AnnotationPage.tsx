import { DislikeOutlined, LikeOutlined, MessageOutlined, SendOutlined, SaveOutlined, CheckOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, message, Row, Tooltip, Typography, Space, Divider, Affix, Popover, Input, Spin, List, Tag, Modal, Progress, Tabs, Empty, Avatar } from 'antd';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  annotation_status?: string;
  annotations?: AnnotationItem[];  // 管理员查看时使用
}
interface AnnotationComment {
  selected_text: string;
  comment: string;
}
interface AnnotationData {
  evaluation?: 'good' | 'bad';
  comments: AnnotationComment[];
}
interface AnnotationItem {
  annotation_id: number;
  annotator_id: number;
  annotator_name: string;
  evaluation: boolean;
  comments: any[];
  time_spent: number;
  is_completed: boolean;
  created_at: string;
}
interface User {
  id: number;
  username: string;
  role: string;
  full_name?: string;
}

const AnnotationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [annotation, setAnnotation] = useState<AnnotationData>({ comments: [] });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }, []);

  const fetchDocumentAndAnnotation = useCallback(async () => {
    setLoading(true);
    try {
      // 获取用户信息和文档信息
      const [userResponse, docResponse] = await Promise.all([
        fetchUser(),
        api.get(`/documents/${id}`)
      ]);

      const currentUser = userResponse;
      setDocument(docResponse.data);

      // 根据用户角色处理标注数据
      if (currentUser.role === 'admin' && docResponse.data.annotations) {
        // 管理员：显示所有标注数据（只读）
        // 不需要额外获取标注数据，因为文档API已返回所有标注
      } else {
        // 专家：获取自己的标注数据
        try {
          const annotationResponse = await api.get(`/annotations/${id}`);
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
            console.error('Failed to fetch annotation:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, fetchUser]);

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
    // 设置对应的加载状态
    if (isCompleted) {
      setSubmitting(true);
    } else {
      setSaving(true);
    }

    try {
      // 显示保存进度
      const loadingMessage = isCompleted
        ? message.loading('正在提交标注...', 0)
        : message.loading('正在保存标注...', 0);

      // 转换数据格式以匹配后端API期望
      const payload = {
        evaluation: annotation.evaluation ? annotation.evaluation === 'good' : false,
        comments: annotation.comments.map(comment => ({
          text: comment.comment,
          selection: comment.selected_text
        })),
        time_spent: 0,
        is_completed: isCompleted,
      };

      console.log('Sending payload:', payload);
      await api.post(`/annotations/${id}`, payload);

      // 关闭加载消息
      loadingMessage();

      // 更新最后保存时间
      setLastSaveTime(new Date());

      if (isCompleted) {
        // 显示成功模态框
        setShowSuccessModal(true);
        message.success('🎉 标注已成功提交！感谢您的参与！');
      } else {
        message.success('✅ 标注已成功保存！');
      }

    } catch (error) {
      console.error('Failed to post annotation:', error);

      if ((error as any).response?.status === 422) {
        console.error('422 Error Details:', (error as any).response?.data);
        message.error('❌ 数据格式错误，请检查输入内容');
      } else if ((error as any).response?.status === 401) {
        message.error('❌ 身份验证失败，请重新登录');
      } else if ((error as any).response?.status >= 500) {
        message.error('❌ 服务器错误，请稍后重试');
      } else {
        message.error('❌ 保存失败，请检查网络连接');
      }
    } finally {
      // 无论成功失败都要重置加载状态
      setSaving(false);
      setSubmitting(false);
    }
  };

  // 处理成功模态框的关闭和跳转
  const handleSuccessModalOk = () => {
    setShowSuccessModal(false);
    navigate('/documents');
  };

  const handleSuccessModalCancel = () => {
    setShowSuccessModal(false);
  };

  const handleContinueAnnotating = () => {
    setShowSuccessModal(false);
    // 可以跳转到下一个待标注的文档
    navigate('/documents');
  };

  // 成功提交模态框
  const SuccessModal = () => (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <CheckOutlined style={{ color: '#52c41a', fontSize: '24px', marginRight: '8px' }} />
          标注提交成功！
        </div>
      }
      open={showSuccessModal}
      onOk={handleSuccessModalOk}
      onCancel={handleSuccessModalCancel}
      footer={[
        <Button key="continue" type="primary" onClick={handleContinueAnnotating}>
          继续标注其他文档
        </Button>,
        <Button key="back" onClick={handleSuccessModalOk}>
          返回文档列表
        </Button>,
      ]}
      centered
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '16px', marginBottom: '16px' }}>
          🎉 感谢您的参与！您的标注对AI内容改进非常重要。
        </div>
        <div style={{ color: '#666', fontSize: '14px' }}>
          <p>本次标注统计：</p>
          <p>• 评价：{annotation.evaluation === 'good' ? '内容很好 👍' : annotation.evaluation === 'bad' ? '有待改进 📝' : '未评价'}</p>
          <p>• 评论数：{annotation.comments.length} 条</p>
        </div>
      </div>
    </Modal>
  );

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
    <>
      <div style={{ padding: '0 16px' }}>
        <Title level={3}>{document.title || '无标题文档'}</Title>

        {/* 文档状态显示 */}
        {document.annotation_status && (
          <div style={{ marginBottom: 16 }}>
            <Tag color={document.annotation_status === '已标注' ? 'green' : document.annotation_status === '进行中' ? 'blue' : 'orange'}>
              标注状态: {document.annotation_status}
            </Tag>
            {user?.role === 'admin' && document.annotations && (
              <Tag color="purple">
                共 {document.annotations.length} 位专家参与标注
              </Tag>
            )}
          </div>
        )}

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title="原始素材">
              <Paragraph className={styles.contentBox} onMouseUp={user?.role !== 'admin' ? handleSelection : undefined}>
                {document.source_content}
              </Paragraph>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="AI 生成内容">
              <Paragraph className={styles.contentBox} onMouseUp={user?.role !== 'admin' ? handleSelection : undefined}>
                {document.generated_content}
              </Paragraph>
            </Card>
          </Col>
        </Row>

        {/* 根据用户角色显示不同的标注界面 */}
        {user?.role === 'admin' && document.annotations ? (
          // 管理员视图：显示所有专家的标注
          <Row>
            <Col span={24}>
              <Card title="所有专家标注" className={styles.commentsCard}>
                {document.annotations.length > 0 ? (
                  <Tabs
                    type="card"
                    items={document.annotations.map((ann, index) => ({
                      key: ann.annotation_id.toString(),
                      label: (
                        <span>
                          <Avatar size="small" icon={<UserOutlined />} />
                          {ann.annotator_name}
                          {ann.is_completed ? (
                            <Tag color="green" size="small" style={{ marginLeft: 8 }}>已完成</Tag>
                          ) : (
                            <Tag color="blue" size="small" style={{ marginLeft: 8 }}>进行中</Tag>
                          )}
                        </span>
                      ),
                      children: (
                        <div>
                          <div style={{ marginBottom: 16 }}>
                            <Title level={5}>
                              整体评价: {ann.evaluation ? '内容很好 👍' : '有待改进 📝'}
                            </Title>
                            <div style={{ color: '#666', fontSize: '12px' }}>
                              标注时间: {new Date(ann.created_at).toLocaleString()}
                              {ann.time_spent > 0 && ` | 用时: ${Math.floor(ann.time_spent / 60)}分钟`}
                            </div>
                          </div>

                          <Title level={5}>
                            评论列表 ({ann.comments.length} 条评论)
                          </Title>

                          {ann.comments.length > 0 ? (
                            <List
                              dataSource={ann.comments}
                              renderItem={(comment: any, commentIndex: number) => (
                                <List.Item className={styles.commentItem}>
                                  <div className={styles.commentContent}>
                                    <div className={styles.selectedTextSection}>
                                      <Tag color="blue" className={styles.textTag}>
                                        引用: "{comment.selection || comment.text?.substring(0, 30)}..."
                                      </Tag>
                                    </div>
                                    <div className={styles.commentText}>
                                      {comment.text}
                                    </div>
                                  </div>
                                </List.Item>
                              )}
                            />
                          ) : (
                            <Empty
                              description="该专家暂无评论"
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                          )}
                        </div>
                      )
                    }))}
                  />
                ) : (
                  <Empty
                    description="暂无专家标注"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>
        ) : (
          // 专家视图：显示自己的标注和编辑功能
          <Row>
            <Col span={24}>
              <Card title={`评论列表 (${annotation.comments?.length || 0} 条评论)`} className={styles.commentsCard}>
                <div className={styles.commentsContainer}>
                  {annotation.comments?.length > 0 ? (
                    <List
                      dataSource={annotation.comments}
                      renderItem={(item, index) => (
                        <List.Item className={styles.commentItem}>
                          <div className={styles.commentContent}>
                            <div className={styles.selectedTextSection}>
                              <Tag color="blue" className={styles.textTag}>
                                引用: "{item.selected_text?.substring(0, 30)}..."
                              </Tag>
                            </div>
                            <div className={styles.commentText}>
                              {item.comment}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className={styles.noComments}>
                      暂无评论，请在上方内容中划词并添加评论
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* 专家操作栏 - 管理员不显示 */}
      {user?.role !== 'admin' && (
        <Affix offsetBottom={20}>
          <Card className={styles.actionBar}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
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
                  {lastSaveTime && (
                    <Tooltip title={`最后保存时间: ${lastSaveTime.toLocaleTimeString()}`}>
                      <Tag color="green" icon={<SaveOutlined />}>
                        已保存
                      </Tag>
                    </Tooltip>
                  )}
                </Space>
              </Col>
              <Col>
                <Space>
                  <Tooltip title={annotation.evaluation === 'good' ? '当前评价: 内容很好' : '评价为内容很好'}>
                    <Button
                      type={annotation.evaluation === 'good' ? 'primary' : 'default'}
                      shape="circle"
                      icon={<LikeOutlined />}
                      size="large"
                      onClick={() => handleSetEvaluation('good')}
                      className={annotation.evaluation === 'good' ? styles.evaluationActive : ''}
                    />
                  </Tooltip>
                  <Tooltip title={annotation.evaluation === 'bad' ? '当前评价: 有待改进' : '评价为有待改进'}>
                    <Button
                      danger
                      type={annotation.evaluation === 'bad' ? 'primary' : 'default'}
                      shape="circle"
                      icon={<DislikeOutlined />}
                      size="large"
                      onClick={() => handleSetEvaluation('bad')}
                      className={annotation.evaluation === 'bad' ? styles.evaluationActive : ''}
                    />
                  </Tooltip>
                  <Divider type="vertical" />
                  <Button
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => postAnnotation(false)}
                    disabled={submitting}
                  >
                    {saving ? '保存中...' : '保存标注'}
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={submitting}
                    onClick={() => postAnnotation(true)}
                  disabled={saving}
                  danger={annotation.comments.length === 0}
                >
                  {submitting ? '提交中...' : '完成标注'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </Affix>
      )}
      <SuccessModal />
    </>
  );
};


export default AnnotationPage;
