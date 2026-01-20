import { Button } from '@/components/ui/button';
import type { CTABlock as CTABlockType } from '@/types/offer-page';

interface CTABlockProps {
  data: CTABlockType['data'];
  preview?: boolean;
}

export default function CTABlock({ data, preview }: CTABlockProps) {
  const bgColor = data.backgroundColor || '#000000';

  // Determine if the background is dark or light to set text color
  const isDark = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const textColor = isDark(bgColor) ? 'text-white' : 'text-gray-900';

  return (
    <section
      className="py-20 px-6 md:px-12 lg:px-20"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${textColor}`}>
          {data.headline || 'Ready to Get Started?'}
        </h2>

        {data.description && (
          <p className={`text-xl mb-8 ${textColor} opacity-90`}>
            {data.description}
          </p>
        )}

        {data.ctaText && (
          <Button
            size="lg"
            variant={isDark(bgColor) ? 'default' : 'outline'}
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

        {data.urgency && (
          <p className={`text-sm mt-4 ${textColor} opacity-75`}>
            {data.urgency}
          </p>
        )}
      </div>
    </section>
  );
}
