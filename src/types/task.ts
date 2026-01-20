// Task management types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked' | 'cancelled';

export interface Task {
  id: string;
  vendor_id: string;
  workspace_id?: string;

  // Task details
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  // Assignment
  assigned_to?: string;
  assigned_by?: string;

  // Relationships
  blog_post_id?: string;
  client_id?: string;

  // Scheduling
  due_date?: string;
  started_at?: string;
  completed_at?: string;

  // Tags
  tags?: string[];

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_type: 'vendor' | 'client';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigned_to?: string;
  workspace_id?: string;
  blog_post_id?: string;
  client_id?: string;
  due_date?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  tags?: string[];
}
