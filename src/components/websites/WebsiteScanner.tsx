'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scan, 
  FileText, 
  Image, 
  Code, 
  Link, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Eye
} from 'lucide-react';

interface WebsiteScan {
  id: string;
  website_id: string;
  scan_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  url: string;
  max_pages: number;
  pages_scanned: number;
  text_content: Array<{
    url: string;
    title: string;
    headings: Array<{ level: string; text: string }>;
    paragraphs: string[];
    wordCount: number;
  }>;
  schema_markup: Array<{
    url: string;
    type: string;
    data: Record<string, unknown>;
  }>;
  images: Array<{
    url: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
    context?: string;
  }>;
  site_metadata: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTags?: Record<string, string>;
    twitterCards?: Record<string, string>;
  };
  internal_links: string[];
  external_links: string[];
  content_analysis: {
    totalWords: number;
    avgWordCount: number;
    topics: string[];
  };
  seo_elements: {
    metaDescriptions: Array<{ url: string; content: string }>;
    h1Tags: Array<{ url: string; content: string }>;
    h2Tags: Array<{ url: string; content: string }>;
    altTexts: Array<{ url: string; src: string; alt: string }>;
  };
  errors: Array<{ url: string; error: string; timestamp: string }>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface WebsiteScannerProps {
  websiteId: string;
  websiteUrl: string;
}

export function WebsiteScanner({ websiteId, websiteUrl }: WebsiteScannerProps) {
  const [scans, setScans] = useState<WebsiteScan[]>([]);
  const [selectedScan, setSelectedScan] = useState<WebsiteScan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanConfig, setScanConfig] = useState({
    scanType: 'full' as const,
    maxPages: 50,
    maxDepth: 3,
  });

  useEffect(() => {
    fetchScans();
  }, [websiteId]);

  useEffect(() => {
    // Poll for updates if a scan is running
    const runningScan = scans.find(s => s.status === 'running');
    if (runningScan) {
      const interval = setInterval(fetchScans, 5000);
      return () => clearInterval(interval);
    }
  }, [scans]);

  const fetchScans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/scan`);
      const data = await res.json();
      if (data.scans) {
        setScans(data.scans);
        // Auto-select most recent completed scan
        const completed = data.scans.find((s: WebsiteScan) => s.status === 'completed');
        if (completed && !selectedScan) {
          setSelectedScan(completed);
        }
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanConfig),
      });
      const data = await res.json();
      if (data.scanId) {
        fetchScans();
      }
    } catch (error) {
      console.error('Error starting scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const deleteScan = async (scanId: string) => {
    try {
      await fetch(`/api/website-scans/${scanId}`, { method: 'DELETE' });
      setScans(scans.filter(s => s.id !== scanId));
      if (selectedScan?.id === scanId) {
        setSelectedScan(null);
      }
    } catch (error) {
      console.error('Error deleting scan:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-gray-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Scan Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Website Scanner
          </CardTitle>
          <CardDescription>
            Scan {websiteUrl} to extract text, schema markup, and images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Scan Type</label>
              <select
                className="block mt-1 p-2 border rounded-md"
                value={scanConfig.scanType}
                onChange={(e) => setScanConfig({ ...scanConfig, scanType: e.target.value as 'full' })}
              >
                <option value="full">Full Scan</option>
                <option value="text_only">Text Only</option>
                <option value="schema_only">Schema Only</option>
                <option value="images_only">Images Only</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Max Pages</label>
              <input
                type="number"
                className="block mt-1 p-2 border rounded-md w-24"
                value={scanConfig.maxPages}
                onChange={(e) => setScanConfig({ ...scanConfig, maxPages: parseInt(e.target.value) || 50 })}
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Depth</label>
              <input
                type="number"
                className="block mt-1 p-2 border rounded-md w-24"
                value={scanConfig.maxDepth}
                onChange={(e) => setScanConfig({ ...scanConfig, maxDepth: parseInt(e.target.value) || 3 })}
                min={1}
                max={5}
              />
            </div>
            <Button onClick={startScan} disabled={isScanning}>
              {isScanning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
              ) : (
                <><Scan className="w-4 h-4 mr-2" /> Start Scan</>
              )}
            </Button>
            <Button variant="outline" onClick={fetchScans} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scan History */}
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          {scans.length === 0 ? (
            <p className="text-muted-foreground">No scans yet. Start a scan to analyze this website.</p>
          ) : (
            <div className="space-y-2">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-muted/50 ${
                    selectedScan?.id === scan.id ? 'border-primary bg-muted/50' : ''
                  }`}
                  onClick={() => setSelectedScan(scan)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusBadge(scan.status)}
                    <span className="text-sm">
                      {new Date(scan.created_at).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {scan.pages_scanned} pages • {scan.scan_type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedScan(scan); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteScan(scan.id); }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {selectedScan && selectedScan.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>
              Scanned {selectedScan.pages_scanned} pages on {new Date(selectedScan.completed_at || '').toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="text">
                  <FileText className="w-4 h-4 mr-1" /> Text ({selectedScan.text_content?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="schema">
                  <Code className="w-4 h-4 mr-1" /> Schema ({selectedScan.schema_markup?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="images">
                  <Image className="w-4 h-4 mr-1" /> Images ({selectedScan.images?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="links">
                  <Link className="w-4 h-4 mr-1" /> Links
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{selectedScan.pages_scanned}</div>
                    <div className="text-sm text-muted-foreground">Pages Scanned</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{selectedScan.content_analysis?.totalWords?.toLocaleString() || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Words</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{selectedScan.images?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Images Found</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{selectedScan.schema_markup?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Schema Items</div>
                  </div>
                </div>

                {selectedScan.content_analysis?.topics?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Top Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedScan.content_analysis.topics.map((topic, i) => (
                        <Badge key={i} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedScan.site_metadata && (
                  <div>
                    <h4 className="font-medium mb-2">Site Metadata</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Title:</strong> {selectedScan.site_metadata.title || 'N/A'}</p>
                      <p><strong>Description:</strong> {selectedScan.site_metadata.description || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="mt-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedScan.text_content?.map((page, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{page.title || page.url}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{page.url}</p>
                      <p className="text-sm">Word Count: {page.wordCount}</p>
                      {page.headings?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Headings:</p>
                          <ul className="text-sm text-muted-foreground">
                            {page.headings.slice(0, 5).map((h, j) => (
                              <li key={j}>{h.level.toUpperCase()}: {h.text}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="schema" className="mt-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedScan.schema_markup?.map((schema, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Badge className="mb-2">{schema.type}</Badge>
                      <p className="text-sm text-muted-foreground mb-2">{schema.url}</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(schema.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                  {(!selectedScan.schema_markup || selectedScan.schema_markup.length === 0) && (
                    <p className="text-muted-foreground">No schema markup found.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="images" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {selectedScan.images?.map((img, i) => (
                    <div key={i} className="border rounded-lg p-2">
                      <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
                        <img 
                          src={img.src} 
                          alt={img.alt || 'No alt text'} 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1 truncate" title={img.alt}>{img.alt || 'No alt text'}</p>
                      {img.width && img.height && (
                        <p className="text-xs text-muted-foreground">{img.width}x{img.height}</p>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="links" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Internal Links ({selectedScan.internal_links?.length || 0})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {selectedScan.internal_links?.slice(0, 50).map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline truncate">
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">External Links ({selectedScan.external_links?.length || 0})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {selectedScan.external_links?.slice(0, 50).map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline truncate">
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {selectedScan && selectedScan.errors && selectedScan.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Scan Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedScan.errors.map((error, i) => (
                <div key={i} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                  <p className="font-medium">{error.url}</p>
                  <p className="text-red-600">{error.error}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
