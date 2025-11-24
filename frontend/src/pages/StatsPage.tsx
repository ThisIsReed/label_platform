import React, { useEffect, useState } from 'react';
import { Card, Col, Progress, Row, Statistic, Spin, Alert, Button, Table, Tag, Divider } from 'antd';
import { LikeOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';

interface StatsData {
  overview: {
    total_documents: number;
    annotated_documents: number;
    positive_rate: number;
    completion_rate: number;
  };
  my_stats: {
    completed_annotations: number;
    positive_rate: number;
    total_time_minutes: number;
  };
  document_stats?: {
    total_documents: number;
    completed_documents: number;
    completion_rate: number;
    documents_per_annotator: Array<{
      document_id: number;
      annotations_count: number;
      annotators_count: number;
    }>;
  };
  approval_analysis?: {
    overall_approval_rate: number;
    total_evaluations: number;
    positive_evaluations: number;
    user_approval_rates: Array<{
      user_id: number;
      username: string;
      approval_rate: number;
      evaluation_count: number;
    }>;
  };
}

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const overviewPromise = api.get('/stats/overview');
      const myStatsPromise = api.get('/stats/my-stats');
      const documentPromise = api.get('/stats/document-completion');
      const approvalPromise = api.get('/stats/approval-analysis');

      const [overviewRes, myStatsRes, documentRes, approvalRes] = await Promise.all([
        overviewPromise, myStatsPromise, documentPromise, approvalPromise
      ]);

      setStats({
        overview: overviewRes.data,
        my_stats: myStatsRes.data,
        document_stats: documentRes.data,
        approval_analysis: approvalRes.data
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('统计数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <Spin size="large" tip="统计数据加载中..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchStats} icon={<ReloadOutlined />}>
              重试
            </Button>
          }
        />
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <Alert
          message="无数据"
          description="暂时没有统计数据，请稍后再试。"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  const completionPercentage = Math.round(stats.overview.completion_rate);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>统计分析</h2>
        <Button
          onClick={fetchStats}
          loading={loading}
          icon={<ReloadOutlined />}
        >
          刷新数据
        </Button>
      </div>

      <h3>总体标注进度</h3>
      <Card>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总文档数" value={stats.overview.total_documents} prefix={<TeamOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="已完成" value={stats.overview.annotated_documents} prefix={<CheckCircleOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic
              title="总体好评率"
              value={stats.overview.positive_rate}
              precision={2}
              suffix="%"
              prefix={<LikeOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic title="完成进度" value={completionPercentage} suffix="%" />
            <Progress percent={completionPercentage} showInfo={false} />
          </Col>
        </Row>
      </Card>

      <h2 style={{ marginTop: '24px' }}>我的统计</h2>
      <Card>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="我已标注" value={stats.my_stats.completed_annotations} prefix={<CheckCircleOutlined />} />
          </Col>
          <Col span={8}>
            <Statistic title="总用时" value={stats.my_stats.total_time_minutes} suffix="分钟" prefix={<ClockCircleOutlined />} />
          </Col>
          <Col span={8}>
            <Statistic
              title="我的好评率"
              value={stats.my_stats.positive_rate}
              precision={2}
              suffix="%"
              prefix={<LikeOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* 文档完成状态分析 */}
      {stats.document_stats && (
        <>
          <h3 style={{ marginTop: '24px' }}>文档完成状态分析</h3>
          <Card>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={6}>
                <Statistic
                  title="总文档数"
                  value={stats.document_stats.total_documents}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已完成文档"
                  value={stats.document_stats.completed_documents}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="完成率"
                  value={stats.document_stats.completion_rate}
                  precision={2}
                  suffix="%"
                  prefix={<LikeOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均每文档标注人数"
                  value={stats.document_stats.documents_per_annotator.length > 0
                    ? (stats.document_stats.documents_per_annotator.reduce((sum, doc) => sum + doc.annotators_count, 0) / stats.document_stats.documents_per_annotator.length).toFixed(1)
                    : 0}
                  prefix={<TeamOutlined />}
                />
              </Col>
            </Row>

            <Divider />
            <h4>文档标注详情</h4>
            <Table
              dataSource={stats.document_stats.documents_per_annotator}
              rowKey="document_id"
              pagination={{ pageSize: 5 }}
              size="small"
              columns={[
                {
                  title: '文档ID',
                  dataIndex: 'document_id',
                  key: 'document_id',
                },
                {
                  title: '标注数量',
                  dataIndex: 'annotations_count',
                  key: 'annotations_count',
                  render: (count: number) => (
                    <Tag color={count > 0 ? 'green' : 'default'}>
                      {count}
                    </Tag>
                  ),
                },
                {
                  title: '标注人数',
                  dataIndex: 'annotators_count',
                  key: 'annotators_count',
                  render: (count: number) => (
                    <Tag color={count > 0 ? 'blue' : 'default'}>
                      {count}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}

      {/* 好评率分析 */}
      {stats.approval_analysis && (
        <>
          <h3 style={{ marginTop: '24px' }}>好评率分析</h3>
          <Card>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic
                  title="总体好评率"
                  value={stats.approval_analysis.overall_approval_rate}
                  precision={2}
                  suffix="%"
                  prefix={<LikeOutlined />}
                  valueStyle={{
                    color: stats.approval_analysis.overall_approval_rate >= 80 ? '#3f8600' :
                           stats.approval_analysis.overall_approval_rate >= 60 ? '#fa8c16' : '#cf1322'
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="总评价数"
                  value={stats.approval_analysis.total_evaluations}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="好评数"
                  value={stats.approval_analysis.positive_evaluations}
                  prefix={<LikeOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>

            <Divider />
            <h4>用户好评率分布</h4>
            <Table
              dataSource={stats.approval_analysis.user_approval_rates}
              rowKey="user_id"
              pagination={{ pageSize: 5 }}
              size="small"
              columns={[
                {
                  title: '用户名',
                  dataIndex: 'username',
                  key: 'username',
                },
                {
                  title: '评价数量',
                  dataIndex: 'evaluation_count',
                  key: 'evaluation_count',
                },
                {
                  title: '好评率',
                  dataIndex: 'approval_rate',
                  key: 'approval_rate',
                  render: (rate: number) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Progress
                        percent={rate}
                        size="small"
                        style={{ width: '100px' }}
                        strokeColor={
                          rate >= 80 ? '#3f8600' :
                          rate >= 60 ? '#fa8c16' : '#cf1322'
                        }
                      />
                      <span style={{ minWidth: '50px' }}>{rate.toFixed(1)}%</span>
                    </div>
                  ),
                },
                {
                  title: '评级',
                  dataIndex: 'approval_rate',
                  key: 'rating',
                  render: (rate: number) => (
                    <Tag color={
                      rate >= 80 ? 'green' :
                      rate >= 60 ? 'orange' : 'red'
                    }>
                      {rate >= 80 ? '优秀' : rate >= 60 ? '良好' : '待改进'}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default StatsPage;
