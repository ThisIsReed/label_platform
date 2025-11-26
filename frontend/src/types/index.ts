// 用户相关类型定义
export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  role: 'admin' | 'expert';
  is_active: boolean;
  created_at: string;
}

// 文档相关类型定义
export interface Document {
  id: number;
  title: string;
  status: string;
  annotation_status?: string; // "未标注", "进行中", "已标注"
  word_count_source: number;
  word_count_generated: number;
  created_at: string;
  assigned_to?: number | null; // 分配给的用户ID
  assigned_to_username?: string | null; // 分配给的用户名（用于显示）
}

// 分配操作相关类型
export interface AssignDocumentRequest {
  document_id: number;
  assigned_to: number | null; // null 表示取消分配
}

// 统计数据类型
export interface DocumentStats {
  total_documents: number;
  annotated_documents: number;
  pending_documents: number;
  in_progress_documents: number;
  assigned_to_me?: number; // 分配给我的文档数量（专家用）
  available_for_claim?: number; // 可认领的文档数量（专家用）
}