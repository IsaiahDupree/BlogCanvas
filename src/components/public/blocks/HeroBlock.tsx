import { Button } from '@/components/ui/button';
import type { HeroBlock as HeroBlockType } from '@/types/offer-page';

interface HeroBlockProps {
  data: HeroBlockType['data'];
  preview?: boolean;
}

export default function HeroBlock({ data, preview }: HeroBlockProps) {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const alignment = alignmentClasses[data.alignment || 'center'];

  return (
    <section
      className="py-20 px-6 md:px-12 lg:px-20"
      style={{
        backgroundImage: data.backgroundImage ? `url(${data.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className={alignment}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {data.headline || 'Your Headline Here'}
          </h1>

          {data.subheadline && (
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {data.subheadline}
            </p>
          )}

          {data.ctaText && (
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => {
                if (!preview && data.ctaLink) {
                  if (data.ctaLink.startsWith('#')) {
                    document.querySelector(data.ctaLink)?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = data.ctaLink;
                  }
                }
              }}
            >
              {data.ctaText}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
