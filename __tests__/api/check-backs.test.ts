
import { NextRequest } from 'next/server';

// Mock scheduler library
const mockScheduleCheckBacks = jest.fn();

jest.mock('@/lib/analytics/check-back-scheduler', () => ({
    scheduleCheckBacks: (...args: any[]) => mockScheduleCheckBacks(...args)
}));

describe('Check-back API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/check-backs/schedule', () => {
        it('should schedule check-backs successfully', async () => {
            const { POST } = await import('@/app/api/check-backs/schedule/route');

            const request = new NextRequest('http://localhost/api/check-backs/schedule', {
                method: 'POST',
                body: JSON.stringify({
                    blogPostId: 'test-post-123',
                    publishedDate: '2025-01-01T12:00:00Z'
                })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(mockScheduleCheckBacks).toHaveBeenCalledWith(
                'test-post-123',
                new Date('2025-01-01T12:00:00Z')
            );
        });

        it('should return 400 if blogPostId is missing', async () => {
            const { POST } = await import('@/app/api/check-backs/schedule/route');

            const request = new NextRequest('http://localhost/api/check-backs/schedule', {
                method: 'POST',
                body: JSON.stringify({
                    publishedDate: '2025-01-01'
                })
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain('ID required');
        });

        it('should handle scheduling errors', async () => {
            const { POST } = await import('@/app/api/check-backs/schedule/route');

            mockScheduleCheckBacks.mockRejectedValue(new Error('Scheduling failed'));

            const request = new NextRequest('http://localhost/api/check-backs/schedule', {
                method: 'POST',
                body: JSON.stringify({
                    blogPostId: 'test-post-123'
                })
            });

            const response = await POST(request);
            expect(response.status).toBe(500);
        });
    });
});
