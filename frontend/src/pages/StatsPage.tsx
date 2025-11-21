import React, { useEffect, useState } from 'react';
import { Card, Col, Progress, Row, Statistic, Spin } from 'antd';
import { LikeOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../services/api';

interface StatsData {
  overview: {
    total_documents: number;
    completed_documents: number;
    overall_approval_rate: number;
  };
  my_stats: {
    annotated_documents: number;
    pending_documents: number;
    approval_rate: number;
  };
}

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const overviewPromise = api.get('/stats/overview');
        const myStatsPromise = api.get('/stats/my-stats');
        const [overviewRes, myStatsRes] = await Promise.all([overviewPromise, myStatsPromise]);
        
        setStats({ overview: overviewRes.data, my_stats: myStatsRes.data });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // 错误消息由拦截器处理
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !stats) {
    return <Card loading={loading}>数据加载中...</Card>;
  }

  const completionPercentage = Math.round(
    (stats.overview.completed_documents / stats.overview.total_documents) * 100
  );

  return (
    <div>
      <h2>总体标注进度</h2>
      <Card>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总文档数" value={stats.overview.total_documents} prefix={<TeamOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="已完成" value={stats.overview.completed_documents} prefix={<CheckCircleOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic
              title="总体好评率"
              value={stats.overview.overall_approval_rate * 100}
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
            <Statistic title="我已标注" value={stats.my_stats.annotated_documents} prefix={<CheckCircleOutlined />} />
          </Col>
          <Col span={8}>
            <Statistic title="待我处理" value={stats.my_stats.pending_documents} prefix={<ClockCircleOutlined />} />
          </Col>
          <Col span={8}>
            <Statistic
              title="我的好评率"
              value={stats.my_stats.approval_rate * 100}
              precision={2}
              suffix="%"
              prefix={<LikeOutlined />}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default StatsPage;
