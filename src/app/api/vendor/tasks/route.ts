import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateTaskInput, Task } from '@/types/task';

// GET /api/vendor/tasks - List all tasks for vendor
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated vendor
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigned_to = searchParams.get('assigned_to');
    const workspace_id = searchParams.get('workspace_id');

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }
    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/vendor/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated vendor
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateTaskInput = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        vendor_id: user.id,
        assigned_by: user.id,
        title: body.title,
        description: body.description,
        priority: body.priority || 'medium',
        assigned_to: body.assigned_to,
        workspace_id: body.workspace_id,
        blog_post_id: body.blog_post_id,
        client_id: body.client_id,
        due_date: body.due_date,
        tags: body.tags,
        status: 'todo'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
