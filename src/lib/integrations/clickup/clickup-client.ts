/**
 * ClickUp API Client
 * Handles API calls to ClickUp
 */

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;

/**
 * Update ClickUp task
 */
export async function updateClickUpTask(
    taskId: string,
    updates: {
        name?: string;
        description?: string;
        status?: string;
        tags?: string[];
        customFields?: Record<string, any>;
    }
): Promise<void> {
    if (!CLICKUP_API_TOKEN) {
        console.warn('ClickUp API token not configured');
        return;
    }
    
    try {
        const response = await fetch(`${CLICKUP_API_URL}/task/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': CLICKUP_API_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ClickUp API error: ${error}`);
        }
    } catch (error) {
        console.error('Error updating ClickUp task:', error);
        throw error;
    }
}

/**
 * Get ClickUp task details
 */
export async function getClickUpTask(taskId: string): Promise<any> {
    if (!CLICKUP_API_TOKEN) {
        throw new Error('ClickUp API token not configured');
    }
    
    const response = await fetch(`${CLICKUP_API_URL}/task/${taskId}`, {
        headers: {
            'Authorization': CLICKUP_API_TOKEN
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch ClickUp task: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Add comment to ClickUp task
 */
export async function addClickUpComment(
    taskId: string,
    comment: string
): Promise<void> {
    if (!CLICKUP_API_TOKEN) {
        console.warn('ClickUp API token not configured');
        return;
    }
    
    try {
        const response = await fetch(`${CLICKUP_API_URL}/task/${taskId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': CLICKUP_API_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment_text: comment
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ClickUp API error: ${error}`);
        }
    } catch (error) {
        console.error('Error adding ClickUp comment:', error);
        throw error;
    }
}



