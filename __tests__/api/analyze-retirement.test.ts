import { GET as getLegacyAnalysis } from '@/app/api/analyze/[analysisId]/route'
import { POST as startLegacyAnalysis } from '@/app/api/analyze/route'

describe('retired generic website-analysis API', () => {
  it('does not create a fabricated scan when the legacy POST endpoint is called', async () => {
    const response = await startLegacyAnalysis()

    expect(response.status).toBe(410)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('legacy endpoint is retired'),
    })
  })

  it('does not return sample results for arbitrary legacy analysis IDs', async () => {
    const response = await getLegacyAnalysis()

    expect(response.status).toBe(410)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('legacy analysis endpoint is retired'),
    })
  })
})
