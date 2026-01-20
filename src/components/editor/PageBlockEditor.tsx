'use client';

import { useState } from 'react';
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { OfferPage, PageBlock, BlockType } from '@/types/offer-page';
import HeroBlockEditor from './blocks/HeroBlockEditor';
import VSLBlockEditor from './blocks/VSLBlockEditor';
import FeaturesBlockEditor from './blocks/FeaturesBlockEditor';
import PricingBlockEditor from './blocks/PricingBlockEditor';
import CTABlockEditor from './blocks/CTABlockEditor';
import FAQBlockEditor from './blocks/FAQBlockEditor';
import ProblemSolutionBlockEditor from './blocks/ProblemSolutionBlockEditor';
import TestimonialsBlockEditor from './blocks/TestimonialsBlockEditor';
import OfferStackBlockEditor from './blocks/OfferStackBlockEditor';

interface PageBlockEditorProps {
  page: OfferPage;
  onChange: (page: OfferPage) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'hero', label: 'Hero Section', icon: '🚀' },
  { type: 'vsl', label: 'Video (VSL)', icon: '🎥' },
  { type: 'problem_solution', label: 'Problem → Solution', icon: '💡' },
  { type: 'features', label: 'Features', icon: '✨' },
  { type: 'testimonials', label: 'Testimonials', icon: '💬' },
  { type: 'offer_stack', label: 'Offer Stack', icon: '📦' },
  { type: 'pricing', label: 'Pricing', icon: '💰' },
  { type: 'faq', label: 'FAQ', icon: '❓' },
  { type: 'cta', label: 'Call to Action', icon: '👉' },
];

export default function PageBlockEditor({ page, onChange }: PageBlockEditorProps) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const blocks = page.blocks || [];

  const handleAddBlock = (blockType: BlockType) => {
    const newBlock: any = {
      id: crypto.randomUUID(),
      type: blockType,
      order: blocks.length,
      data: getDefaultBlockData(blockType)
    };

    onChange({
      ...page,
      blocks: [...blocks, newBlock]
    });

    setShowBlockMenu(false);
    setEditingBlockId(newBlock.id);
  };

  const handleUpdateBlock = (blockId: string, data: any) => {
    onChange({
      ...page,
      blocks: blocks.map(block =>
        block.id === blockId ? { ...block, data } : block
      )
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!confirm('Delete this block?')) return;

    const updatedBlocks = blocks
      .filter(b => b.id !== blockId)
      .map((b, index) => ({ ...b, order: index }));

    onChange({
      ...page,
      blocks: updatedBlocks
    });

    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[currentIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[currentIndex]];

    onChange({
      ...page,
      blocks: newBlocks.map((b, index) => ({ ...b, order: index }))
    });
  };

  return (
    <div className="space-y-4">
      {/* Blocks */}
      {blocks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No blocks yet. Add your first block to get started.</p>
          <Button onClick={() => setShowBlockMenu(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <Card key={block.id} className="overflow-hidden">
              {/* Block Header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <span className="text-sm font-medium text-gray-700">
                    {BLOCK_TYPES.find(t => t.type === block.type)?.icon || ''}
                    {' '}
                    {BLOCK_TYPES.find(t => t.type === block.type)?.label || block.type}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveBlock(block.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveBlock(block.id, 'down')}
                    disabled={index === blocks.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingBlockId(
                      editingBlockId === block.id ? null : block.id
                    )}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Block Editor */}
              {editingBlockId === block.id && (
                <div className="p-4">
                  {renderBlockEditor(block, (data) => handleUpdateBlock(block.id, data))}
                </div>
              )}

              {/* Block Preview when collapsed */}
              {editingBlockId !== block.id && (
                <div className="p-4 text-sm text-gray-600">
                  {getBlockPreview(block)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Block Button */}
      {blocks.length > 0 && (
        <Button
          variant="outline"
          onClick={() => setShowBlockMenu(!showBlockMenu)}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Block
        </Button>
      )}

      {/* Block Type Menu */}
      {showBlockMenu && (
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Choose a block type:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BLOCK_TYPES.map((blockType) => (
              <button
                key={blockType.type}
                onClick={() => handleAddBlock(blockType.type)}
                className="p-3 text-left rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-2xl mb-1">{blockType.icon}</div>
                <div className="text-sm font-medium text-gray-900">{blockType.label}</div>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowBlockMenu(false)}
            className="w-full mt-3"
          >
            Cancel
          </Button>
        </Card>
      )}
    </div>
  );
}

// Helper function to render the appropriate block editor
function renderBlockEditor(block: PageBlock, onChange: (data: any) => void) {
  switch (block.type) {
    case 'hero':
      return <HeroBlockEditor data={block.data} onChange={onChange} />;
    case 'vsl':
      return <VSLBlockEditor data={block.data} onChange={onChange} />;
    case 'problem_solution':
      return <ProblemSolutionBlockEditor data={block.data} onChange={onChange} />;
    case 'features':
      return <FeaturesBlockEditor data={block.data} onChange={onChange} />;
    case 'testimonials':
      return <TestimonialsBlockEditor data={block.data} onChange={onChange} />;
    case 'offer_stack':
      return <OfferStackBlockEditor data={block.data} onChange={onChange} />;
    case 'pricing':
      return <PricingBlockEditor data={block.data} onChange={onChange} />;
    case 'faq':
      return <FAQBlockEditor data={block.data} onChange={onChange} />;
    case 'cta':
      return <CTABlockEditor data={block.data} onChange={onChange} />;
    default:
      return <div>Unknown block type: {block.type}</div>;
  }
}

// Helper function to get block preview text
function getBlockPreview(block: PageBlock): string {
  switch (block.type) {
    case 'hero':
      return block.data.headline || 'Hero section';
    case 'vsl':
      return `Video: ${block.data.videoUrl || 'No video set'}`;
    case 'problem_solution':
      return block.data.problemHeadline || 'Problem → Solution';
    case 'features':
      return `${block.data.headline || 'Features'} (${block.data.features?.length || 0} items)`;
    case 'testimonials':
      return `Testimonials (${block.data.testimonials?.length || 0} items)`;
    case 'offer_stack':
      return `${block.data.headline || 'Offer Stack'} (${block.data.items?.length || 0} items)`;
    case 'pricing':
      return block.data.headline || 'Pricing';
    case 'faq':
      return `FAQ (${block.data.faqs?.length || 0} questions)`;
    case 'cta':
      return block.data.headline || 'Call to Action';
    default:
      return 'Click to edit';
  }
}

// Helper function to get default block data
function getDefaultBlockData(blockType: BlockType): any {
  switch (blockType) {
    case 'hero':
      return {
        headline: 'Your Compelling Headline',
        subheadline: 'Supporting text that explains the value',
        ctaText: 'Get Started',
        alignment: 'center'
      };
    case 'vsl':
      return {
        videoUrl: '',
        videoProvider: 'youtube',
        ctaText: 'Watch Now'
      };
    case 'problem_solution':
      return {
        problemHeadline: 'The Problem',
        problemDescription: 'Describe the problem your audience faces',
        solutionHeadline: 'The Solution',
        solutionDescription: 'Explain how you solve it'
      };
    case 'features':
      return {
        headline: 'What\'s Included',
        features: [],
        layout: 'grid'
      };
    case 'testimonials':
      return {
        headline: 'What Clients Say',
        testimonials: [],
        layout: 'grid'
      };
    case 'offer_stack':
      return {
        headline: 'Everything You Get',
        items: []
      };
    case 'pricing':
      return {
        headline: 'Investment',
        ctaText: 'Get Started',
        offerId: ''
      };
    case 'faq':
      return {
        headline: 'Frequently Asked Questions',
        faqs: []
      };
    case 'cta':
      return {
        headline: 'Ready to Get Started?',
        ctaText: 'Take Action Now'
      };
    default:
      return {};
  }
}
