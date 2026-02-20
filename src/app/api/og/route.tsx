import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const title = searchParams.get('title') || 'BlogCanvas'
    const description = searchParams.get('description') || 'Client-Vendor Relationship Management'
    const type = searchParams.get('type') || 'default'
    const vendorName = searchParams.get('vendor')
    const author = searchParams.get('author')

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0a0a0a',
            padding: '80px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              BC
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: '600',
                color: 'white',
              }}
            >
              BlogCanvas
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxWidth: '900px',
            }}
          >
            <h1
              style={{
                fontSize: type === 'post' ? '64px' : '72px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.1,
                margin: 0,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title}
            </h1>

            {description && (
              <p
                style={{
                  fontSize: '28px',
                  color: '#a1a1aa',
                  margin: 0,
                  lineHeight: 1.4,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              {vendorName && (
                <div
                  style={{
                    fontSize: '24px',
                    color: '#71717a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: '#6366f1' }}>By</span>
                  {vendorName}
                </div>
              )}
              {author && !vendorName && (
                <div
                  style={{
                    fontSize: '24px',
                    color: '#71717a',
                  }}
                >
                  {author}
                </div>
              )}
            </div>

            {type === 'post' && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#6366f1',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '2px solid #6366f1',
                }}
              >
                Blog Post
              </div>
            )}

            {type === 'offer' && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#8b5cf6',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '2px solid #8b5cf6',
                }}
              >
                Service Offer
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: unknown) {
    console.error('Error generating OG image:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
