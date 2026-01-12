-- Competitors Feature (feat-030)
-- Enables tracking and comparing competitor websites for SEO analysis

-- Competitors table: stores competitor websites linked to client websites
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  competitor_url TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  name TEXT, -- Optional display name
  notes TEXT, -- Why tracking this competitor
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, competitor_domain)
);

-- Competitor audits: SEO audit data for competitor websites
CREATE TABLE IF NOT EXISTS competitor_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  pages_indexed INTEGER,
  audit_date TIMESTAMPTZ DEFAULT NOW(),
  raw_metrics JSONB, -- Full audit data (same structure as seo_audits)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor keywords: keywords that competitors rank for
CREATE TABLE IF NOT EXISTS competitor_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER, -- Monthly search volume
  difficulty INTEGER CHECK (difficulty >= 0 AND difficulty <= 100),
  ranking_position INTEGER, -- Competitor's ranking position (1-100)
  ranking_url TEXT, -- URL that ranks for this keyword
  search_intent TEXT, -- informational, commercial, transactional, navigational
  we_rank BOOLEAN DEFAULT false, -- Does our client also rank for this?
  our_position INTEGER, -- Our ranking position if we_rank is true
  gap_priority INTEGER CHECK (gap_priority >= 1 AND gap_priority <= 10), -- 1 = highest priority gap
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_id, keyword)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitors_website ON competitors(website_id);
CREATE INDEX IF NOT EXISTS idx_competitors_status ON competitors(status);
CREATE INDEX IF NOT EXISTS idx_competitors_domain ON competitors(competitor_domain);

CREATE INDEX IF NOT EXISTS idx_competitor_audits_competitor ON competitor_audits(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_audits_date ON competitor_audits(audit_date DESC);

CREATE INDEX IF NOT EXISTS idx_competitor_keywords_competitor ON competitor_keywords(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_keywords_keyword ON competitor_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_competitor_keywords_gap ON competitor_keywords(we_rank, gap_priority);
CREATE INDEX IF NOT EXISTS idx_competitor_keywords_volume ON competitor_keywords(search_volume DESC);

-- Automatic updated_at triggers
CREATE OR REPLACE FUNCTION update_competitors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competitors_updated_at
  BEFORE UPDATE ON competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_competitors_updated_at();

CREATE TRIGGER competitor_audits_updated_at
  BEFORE UPDATE ON competitor_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_competitors_updated_at();

CREATE TRIGGER competitor_keywords_updated_at
  BEFORE UPDATE ON competitor_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_competitors_updated_at();

-- RLS Policies
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_keywords ENABLE ROW LEVEL SECURITY;

-- Competitors policies: vendors can manage competitors for their clients' websites
CREATE POLICY "Competitors are viewable by website owners"
  ON competitors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = competitors.website_id
        AND (
          websites.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = websites.client_id
              AND clients.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Competitors are manageable by website owners"
  ON competitors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = competitors.website_id
        AND websites.user_id = auth.uid()
    )
  );

-- Competitor audits policies
CREATE POLICY "Competitor audits are viewable by website owners"
  ON competitor_audits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitors
      JOIN websites ON websites.id = competitors.website_id
      WHERE competitors.id = competitor_audits.competitor_id
        AND (
          websites.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = websites.client_id
              AND clients.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Competitor audits are manageable by website owners"
  ON competitor_audits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM competitors
      JOIN websites ON websites.id = competitors.website_id
      WHERE competitors.id = competitor_audits.competitor_id
        AND websites.user_id = auth.uid()
    )
  );

-- Competitor keywords policies
CREATE POLICY "Competitor keywords are viewable by website owners"
  ON competitor_keywords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitors
      JOIN websites ON websites.id = competitors.website_id
      WHERE competitors.id = competitor_keywords.competitor_id
        AND (
          websites.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = websites.client_id
              AND clients.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Competitor keywords are manageable by website owners"
  ON competitor_keywords FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM competitors
      JOIN websites ON websites.id = competitors.website_id
      WHERE competitors.id = competitor_keywords.competitor_id
        AND websites.user_id = auth.uid()
    )
  );

-- Helper function to get keyword gap analysis for a website
CREATE OR REPLACE FUNCTION get_keyword_gaps(p_website_id UUID, p_min_volume INT DEFAULT 100, p_limit INT DEFAULT 50)
RETURNS TABLE (
  keyword TEXT,
  total_competitors INTEGER,
  avg_competitor_position NUMERIC,
  max_search_volume INTEGER,
  search_intent TEXT,
  gap_priority INTEGER,
  competitor_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ck.keyword,
    COUNT(DISTINCT ck.competitor_id)::INTEGER as total_competitors,
    ROUND(AVG(ck.ranking_position), 1) as avg_competitor_position,
    MAX(ck.search_volume)::INTEGER as max_search_volume,
    MODE() WITHIN GROUP (ORDER BY ck.search_intent) as search_intent,
    MIN(ck.gap_priority)::INTEGER as gap_priority,
    ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as competitor_names
  FROM competitor_keywords ck
  JOIN competitors c ON c.id = ck.competitor_id
  WHERE c.website_id = p_website_id
    AND c.status = 'active'
    AND ck.we_rank = false
    AND (ck.search_volume IS NULL OR ck.search_volume >= p_min_volume)
  GROUP BY ck.keyword
  ORDER BY
    MIN(ck.gap_priority) ASC,
    MAX(ck.search_volume) DESC,
    COUNT(DISTINCT ck.competitor_id) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get competitor comparison summary
CREATE OR REPLACE FUNCTION get_competitor_comparison(p_website_id UUID)
RETURNS TABLE (
  competitor_id UUID,
  competitor_name TEXT,
  competitor_url TEXT,
  latest_seo_score INTEGER,
  our_seo_score INTEGER,
  score_difference INTEGER,
  keywords_tracked INTEGER,
  keyword_gaps INTEGER,
  last_analyzed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as competitor_id,
    COALESCE(c.name, c.competitor_domain) as competitor_name,
    c.competitor_url,
    (
      SELECT ca.seo_score
      FROM competitor_audits ca
      WHERE ca.competitor_id = c.id
      ORDER BY ca.audit_date DESC
      LIMIT 1
    ) as latest_seo_score,
    (
      SELECT sa.baseline_score
      FROM seo_audits sa
      WHERE sa.website_id = p_website_id
      ORDER BY sa.audit_date DESC
      LIMIT 1
    ) as our_seo_score,
    (
      SELECT sa.baseline_score
      FROM seo_audits sa
      WHERE sa.website_id = p_website_id
      ORDER BY sa.audit_date DESC
      LIMIT 1
    ) - (
      SELECT ca.seo_score
      FROM competitor_audits ca
      WHERE ca.competitor_id = c.id
      ORDER BY ca.audit_date DESC
      LIMIT 1
    ) as score_difference,
    (
      SELECT COUNT(*)::INTEGER
      FROM competitor_keywords ck
      WHERE ck.competitor_id = c.id
    ) as keywords_tracked,
    (
      SELECT COUNT(*)::INTEGER
      FROM competitor_keywords ck
      WHERE ck.competitor_id = c.id
        AND ck.we_rank = false
    ) as keyword_gaps,
    c.last_analyzed_at
  FROM competitors c
  WHERE c.website_id = p_website_id
    AND c.status = 'active'
  ORDER BY latest_seo_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;
