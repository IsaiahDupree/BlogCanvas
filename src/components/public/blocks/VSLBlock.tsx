import { Button } from '@/components/ui/button';
import type { VSLBlock as VSLBlockType } from '@/types/offer-page';

interface VSLBlockProps {
  data: VSLBlockType['data'];
  preview?: boolean;
}

export default function VSLBlock({ data, preview }: VSLBlockProps) {
  const getEmbedUrl = (url: string, provider: string) => {
    if (provider === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (provider === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  };

  const embedUrl = data.videoUrl ? getEmbedUrl(data.videoUrl, data.videoProvider || 'youtube') : '';

  return (
    <section className="py-16 px-6 md:px-12 lg:px-20 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {data.videoUrl ? (
          <div className="aspect-video w-full rounded-lg overflow-hidden shadow-2xl">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video w-full rounded-lg bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Video will appear here</p>
          </div>
        )}

        {data.ctaText && (
          <div className="mt-8 text-center">
            <Button size="lg" className="text-lg px-8 py-6">
              {data.ctaText}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
