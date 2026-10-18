/**
 * ClickUp Webhook Processor
 * Processes incoming webhooks from ClickUp and extracts relevant data
 */

export interface ClickUpWebhookData {
    taskId: string;
    taskName: string;
    tags: string[];
    status?: string;
    assignees?: string[];
    dueDate?: string;
    description?: string;
    customFields?: Record<string, any>;
    listId?: string;
    spaceId?: string;
    folderId?: string;
}

/**
 * Process ClickUp webhook payload and extract relevant information
 */
export async function processClickUpWebhook(payload: any): Promise<ClickUpWebhookData> {
    // ClickUp webhook structure varies by event type
    const event = payload.event || payload;
    
    // Extract task information
    const task = event.task || event;
    const taskId = task.id || task.task_id;
    const taskName = task.name || task.task_name;
    
    // Extract tags
    const tags: string[] = [];
    if (task.tags && Array.isArray(task.tags)) {
        tags.push(...task.tags.map((tag: any) => 
            typeof tag === 'string' ? tag : tag.name || tag.tag_name
        ));
    }
    
    // Extract status
    const status = task.status?.status || task.status;
    
    // Extract assignees
    const assignees = task.assignees?.map((a: any) => 
        a.username || a.email || a.id
    ) || [];
    
    // Extract due date
    const dueDate = task.due_date || task.dueDate;
    
    // Extract description
    const description = task.description || task.text_content;
    
    // Extract custom fields
    const customFields: Record<string, any> = {};
    if (task.custom_fields) {
        for (const field of task.custom_fields) {
            customFields[field.name || field.id] = field.value;
        }
    }
    
    // Extract list/space/folder IDs
    const listId = task.list?.id || task.list_id;
    const spaceId = task.space?.id || task.space_id;
    const folderId = task.folder?.id || task.folder_id;
    
    return {
        taskId,
        taskName,
        tags,
        status,
        assignees,
        dueDate,
        description,
        customFields,
        listId,
        spaceId,
        folderId
    };
}

/**
 * Extract automation tags from task tags
 * Automation tags follow a pattern like: automation:blog, automation:email-campaign, etc.
 */
export function extractAutomationTags(tags: string[]): string[] {
    return tags
        .filter(tag => tag.toLowerCase().startsWith('automation:'))
        .map(tag => tag.toLowerCase().replace('automation:', '').trim());
}



