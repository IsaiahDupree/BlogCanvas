'use client';

import React, { useState } from 'react';

// Block types that can be added to the newsletter
export type BlockType = 'header' | 'text' | 'image' | 'posts-grid' | 'posts-list' | 'cta' | 'footer';

export interface NewsletterBlock {
    id: string;
    type: BlockType;
    content: string;
    metadata?: {
        url?: string;
        imageUrl?: string;
        buttonText?: string;
        buttonUrl?: string;
    };
}

interface NewsletterBuilderProps {
    initialBlocks?: NewsletterBlock[];
    onChange?: (blocks: NewsletterBlock[], html: string) => void;
}

export function NewsletterBuilder({ initialBlocks = [], onChange }: NewsletterBuilderProps) {
    const [blocks, setBlocks] = useState<NewsletterBlock[]>(initialBlocks);
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

    // Generate HTML from blocks
    const generateHTML = (blocks: NewsletterBlock[]): string => {
        let html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        `;

        for (const block of blocks) {
            switch (block.type) {
                case 'header':
                    html += `
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0;">${block.content}</h1>
                        </div>
                    `;
                    break;

                case 'text':
                    html += `
                        <div style="padding: 20px; background: #f9fafb;">
                            <p style="color: #4b5563; line-height: 1.6;">${block.content}</p>
                        </div>
                    `;
                    break;

                case 'image':
                    html += `
                        <div style="padding: 20px; text-align: center; background: #f9fafb;">
                            <img src="${block.metadata?.imageUrl || ''}" alt="${block.content}" style="max-width: 100%; height: auto; border-radius: 8px;" />
                        </div>
                    `;
                    break;

                case 'posts-grid':
                    html += `
                        <div style="padding: 20px; background: #f9fafb;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <!-- Blog posts will be inserted here dynamically -->
                                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <h3 style="margin-top: 0; color: #1f2937;">Post Title</h3>
                                    <p style="color: #6b7280; font-size: 14px;">Post excerpt will appear here...</p>
                                    <a href="#" style="color: #6366f1; text-decoration: none;">Read more →</a>
                                </div>
                            </div>
                        </div>
                    `;
                    break;

                case 'posts-list':
                    html += `
                        <div style="padding: 20px; background: #f9fafb;">
                            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <h3 style="margin-top: 0; color: #1f2937;">Post Title</h3>
                                <p style="color: #6b7280; font-size: 14px;">Post excerpt will appear here...</p>
                                <a href="#" style="color: #6366f1; text-decoration: none;">Read more →</a>
                            </div>
                        </div>
                    `;
                    break;

                case 'cta':
                    html += `
                        <div style="text-align: center; padding: 30px 20px; background: #f9fafb;">
                            <a href="${block.metadata?.buttonUrl || '#'}" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
                                ${block.metadata?.buttonText || block.content}
                            </a>
                        </div>
                    `;
                    break;

                case 'footer':
                    html += `
                        <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px; background: #e5e7eb;">
                            <p>${block.content}</p>
                            <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
                        </div>
                    `;
                    break;
            }
        }

        html += `</div>`;
        return html;
    };

    // Add a new block
    const addBlock = (type: BlockType) => {
        const newBlock: NewsletterBlock = {
            id: `block-${Date.now()}`,
            type,
            content: getDefaultContent(type),
            metadata: {}
        };

        const updatedBlocks = [...blocks, newBlock];
        setBlocks(updatedBlocks);
        onChange?.(updatedBlocks, generateHTML(updatedBlocks));
    };

    // Get default content for a block type
    const getDefaultContent = (type: BlockType): string => {
        switch (type) {
            case 'header': return 'Newsletter Header';
            case 'text': return 'Add your text content here...';
            case 'image': return 'Image description';
            case 'posts-grid': return 'Blog Posts Grid';
            case 'posts-list': return 'Blog Posts List';
            case 'cta': return 'Click Here';
            case 'footer': return 'Powered by BlogCanvas';
            default: return '';
        }
    };

    // Update block content
    const updateBlock = (id: string, updates: Partial<NewsletterBlock>) => {
        const updatedBlocks = blocks.map(block =>
            block.id === id ? { ...block, ...updates } : block
        );
        setBlocks(updatedBlocks);
        onChange?.(updatedBlocks, generateHTML(updatedBlocks));
    };

    // Remove a block
    const removeBlock = (id: string) => {
        const updatedBlocks = blocks.filter(block => block.id !== id);
        setBlocks(updatedBlocks);
        onChange?.(updatedBlocks, generateHTML(updatedBlocks));
    };

    // Drag and drop handlers
    const handleDragStart = (blockId: string) => {
        setDraggedBlockId(blockId);
    };

    const handleDragOver = (e: React.DragEvent, targetBlockId: string) => {
        e.preventDefault();
        if (!draggedBlockId || draggedBlockId === targetBlockId) return;

        const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId);
        const targetIndex = blocks.findIndex(b => b.id === targetBlockId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const updatedBlocks = [...blocks];
        const [draggedBlock] = updatedBlocks.splice(draggedIndex, 1);
        updatedBlocks.splice(targetIndex, 0, draggedBlock);

        setBlocks(updatedBlocks);
        onChange?.(updatedBlocks, generateHTML(updatedBlocks));
    };

    const handleDragEnd = () => {
        setDraggedBlockId(null);
    };

    return (
        <div className="flex gap-6">
            {/* Block Palette */}
            <div className="w-64 flex-shrink-0">
                <h3 className="font-semibold text-gray-900 mb-4">Add Blocks</h3>
                <div className="space-y-2">
                    <BlockPaletteItem icon="📄" label="Header" onClick={() => addBlock('header')} />
                    <BlockPaletteItem icon="📝" label="Text" onClick={() => addBlock('text')} />
                    <BlockPaletteItem icon="🖼️" label="Image" onClick={() => addBlock('image')} />
                    <BlockPaletteItem icon="📰" label="Posts Grid" onClick={() => addBlock('posts-grid')} />
                    <BlockPaletteItem icon="📋" label="Posts List" onClick={() => addBlock('posts-list')} />
                    <BlockPaletteItem icon="🔘" label="Button (CTA)" onClick={() => addBlock('cta')} />
                    <BlockPaletteItem icon="👣" label="Footer" onClick={() => addBlock('footer')} />
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                <h3 className="font-semibold text-gray-900 mb-4">Newsletter Preview</h3>
                {blocks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>Start building by adding blocks from the left sidebar</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {blocks.map((block, index) => (
                            <div
                                key={block.id}
                                draggable
                                onDragStart={() => handleDragStart(block.id)}
                                onDragOver={(e) => handleDragOver(e, block.id)}
                                onDragEnd={handleDragEnd}
                                className={`bg-white border-2 rounded-lg p-4 cursor-move hover:border-indigo-400 transition-colors ${
                                    draggedBlockId === block.id ? 'opacity-50' : ''
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {block.type.replace('-', ' ')}
                                    </span>
                                    <button
                                        onClick={() => removeBlock(block.id)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <BlockEditor block={block} onUpdate={(updates) => updateBlock(block.id, updates)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Block palette item
function BlockPaletteItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all"
        >
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </button>
    );
}

// Block editor (editable fields for each block)
function BlockEditor({ block, onUpdate }: { block: NewsletterBlock; onUpdate: (updates: Partial<NewsletterBlock>) => void }) {
    switch (block.type) {
        case 'header':
        case 'text':
        case 'footer':
            return (
                <textarea
                    value={block.content}
                    onChange={(e) => onUpdate({ content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter text..."
                />
            );

        case 'image':
            return (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={block.metadata?.imageUrl || ''}
                        onChange={(e) => onUpdate({ metadata: { ...block.metadata, imageUrl: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Image URL"
                    />
                    <input
                        type="text"
                        value={block.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Alt text"
                    />
                </div>
            );

        case 'cta':
            return (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={block.metadata?.buttonText || block.content}
                        onChange={(e) => onUpdate({ metadata: { ...block.metadata, buttonText: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Button text"
                    />
                    <input
                        type="text"
                        value={block.metadata?.buttonUrl || ''}
                        onChange={(e) => onUpdate({ metadata: { ...block.metadata, buttonUrl: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Button URL"
                    />
                </div>
            );

        case 'posts-grid':
        case 'posts-list':
            return (
                <div className="text-sm text-gray-600 italic">
                    Blog posts will be automatically populated when the newsletter is sent
                </div>
            );

        default:
            return null;
    }
}
