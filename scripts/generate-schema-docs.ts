#!/usr/bin/env tsx

/**
 * Database Schema Documentation Generator
 *
 * Automatically generates database schema documentation by reading migration files.
 * Outputs comprehensive schema documentation in Markdown format.
 *
 * Usage:
 *   npx tsx scripts/generate-schema-docs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  primary?: boolean;
  unique?: boolean;
  references?: string;
}

interface TableInfo {
  name: string;
  columns: TableColumn[];
  description?: string;
  indexes?: string[];
  policies?: string[];
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase/migrations');
const OUTPUT_DIR = path.join(process.cwd(), 'docs/database');

/**
 * Get all migration files in chronological order
 */
function getMigrationFiles(): string[] {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    return files.map(f => path.join(MIGRATIONS_DIR, f));
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    return [];
  }
}

/**
 * Parse SQL migration file to extract table information
 */
function parseMigrationFile(filePath: string): TableInfo[] {
  const tables: TableInfo[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract CREATE TABLE statements
    const createTableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["']?(\w+)["']?\s*\(([\s\S]*?)\);/gi;
    const matches = content.matchAll(createTableRegex);

    for (const match of matches) {
      const tableName = match[1];
      const columnsText = match[2];

      const columns = parseColumns(columnsText);

      tables.push({
        name: tableName,
        columns
      });
    }

    // Extract comments for table descriptions
    const commentRegex = /COMMENT ON TABLE\s+["']?(\w+)["']?\s+IS\s+'([^']+)'/gi;
    const commentMatches = content.matchAll(commentRegex);

    for (const match of commentMatches) {
      const tableName = match[1];
      const description = match[2];

      const table = tables.find(t => t.name === tableName);
      if (table) {
        table.description = description;
      }
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
  }

  return tables;
}

/**
 * Parse column definitions from CREATE TABLE statement
 */
function parseColumns(columnsText: string): TableColumn[] {
  const columns: TableColumn[] = [];

  // Split by commas, but be careful of nested parentheses
  const lines = columnsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    // Skip constraints
    if (
      line.toLowerCase().startsWith('primary key') ||
      line.toLowerCase().startsWith('foreign key') ||
      line.toLowerCase().startsWith('unique') ||
      line.toLowerCase().startsWith('check') ||
      line.toLowerCase().startsWith('constraint')
    ) {
      continue;
    }

    // Parse column definition
    const columnMatch = line.match(/^["']?(\w+)["']?\s+(\w+(?:\([^)]+\))?)/i);

    if (columnMatch) {
      const columnName = columnMatch[1];
      const columnType = columnMatch[2];

      const column: TableColumn = {
        name: columnName,
        type: columnType,
        nullable: !line.toLowerCase().includes('not null'),
        primary: line.toLowerCase().includes('primary key'),
        unique: line.toLowerCase().includes('unique')
      };

      // Extract default value
      const defaultMatch = line.match(/DEFAULT\s+([^,]+)/i);
      if (defaultMatch) {
        column.default = defaultMatch[1].trim();
      }

      // Extract foreign key reference
      const referencesMatch = line.match(/REFERENCES\s+(\w+)/i);
      if (referencesMatch) {
        column.references = referencesMatch[1];
      }

      columns.push(column);
    }
  }

  return columns;
}

/**
 * Generate schema documentation in Markdown format
 */
function generateMarkdownDocs(tables: TableInfo[]): string {
  let markdown = `# BlogCanvas Database Schema Documentation

**Generated:** ${new Date().toISOString()}

## Overview

This document provides a comprehensive overview of the BlogCanvas database schema.

**Database:** PostgreSQL (via Supabase)
**Total Tables:** ${tables.length}

## Table of Contents

`;

  // Generate TOC
  const sortedTables = [...tables].sort((a, b) => a.name.localeCompare(b.name));

  for (const table of sortedTables) {
    markdown += `- [${table.name}](#${table.name.toLowerCase().replace(/_/g, '-')})\n`;
  }

  markdown += `\n---\n\n`;

  // Generate table documentation
  for (const table of sortedTables) {
    markdown += `## ${table.name}\n\n`;

    if (table.description) {
      markdown += `${table.description}\n\n`;
    }

    markdown += `### Columns\n\n`;
    markdown += `| Column | Type | Nullable | Default | Constraints |\n`;
    markdown += `|--------|------|----------|---------|-------------|\n`;

    for (const column of table.columns) {
      const constraints: string[] = [];

      if (column.primary) constraints.push('PRIMARY KEY');
      if (column.unique) constraints.push('UNIQUE');
      if (column.references) constraints.push(`FK → ${column.references}`);

      markdown += `| ${column.name} | ${column.type} | ${column.nullable ? 'Yes' : 'No'} | ${column.default || '-'} | ${constraints.join(', ') || '-'} |\n`;
    }

    markdown += `\n`;

    if (table.indexes && table.indexes.length > 0) {
      markdown += `### Indexes\n\n`;
      for (const index of table.indexes) {
        markdown += `- ${index}\n`;
      }
      markdown += `\n`;
    }

    if (table.policies && table.policies.length > 0) {
      markdown += `### Row Level Security Policies\n\n`;
      for (const policy of table.policies) {
        markdown += `- ${policy}\n`;
      }
      markdown += `\n`;
    }

    markdown += `---\n\n`;
  }

  // Generate statistics
  markdown += `## Statistics\n\n`;

  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);
  const tablesWithPK = tables.filter(t => t.columns.some(c => c.primary)).length;
  const totalFKs = tables.reduce((sum, t) =>
    sum + t.columns.filter(c => c.references).length, 0
  );

  markdown += `- **Total Tables:** ${tables.length}\n`;
  markdown += `- **Total Columns:** ${totalColumns}\n`;
  markdown += `- **Tables with Primary Key:** ${tablesWithPK}\n`;
  markdown += `- **Foreign Key Relations:** ${totalFKs}\n`;

  // Column type distribution
  const typeDistribution: Record<string, number> = {};
  tables.forEach(table => {
    table.columns.forEach(column => {
      const baseType = column.type.split('(')[0].toLowerCase();
      typeDistribution[baseType] = (typeDistribution[baseType] || 0) + 1;
    });
  });

  markdown += `\n### Column Type Distribution\n\n`;
  Object.entries(typeDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      markdown += `- **${type}:** ${count}\n`;
    });

  return markdown;
}

/**
 * Generate Entity-Relationship diagram in Mermaid format
 */
function generateMermaidERD(tables: TableInfo[]): string {
  let mermaid = `# Entity-Relationship Diagram

\`\`\`mermaid
erDiagram
`;

  for (const table of tables) {
    // Add table with key columns
    const pkColumns = table.columns.filter(c => c.primary);
    const fkColumns = table.columns.filter(c => c.references);

    mermaid += `    ${table.name.toUpperCase()} {\n`;

    for (const column of table.columns) {
      const constraints = [];
      if (column.primary) constraints.push('PK');
      if (column.references) constraints.push('FK');
      if (column.unique) constraints.push('UK');

      const constraintStr = constraints.length > 0 ? ` ${constraints.join(',')}` : '';
      mermaid += `        ${column.type} ${column.name}${constraintStr}\n`;
    }

    mermaid += `    }\n\n`;

    // Add relationships
    for (const column of fkColumns) {
      if (column.references) {
        mermaid += `    ${table.name.toUpperCase()} }o--|| ${column.references.toUpperCase()} : "references"\n`;
      }
    }
  }

  mermaid += `\`\`\`\n`;

  return mermaid;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning migration files...\n');

  const migrationFiles = getMigrationFiles();
  console.log(`Found ${migrationFiles.length} migration files\n`);

  console.log('📝 Parsing schema information...\n');

  const allTables = new Map<string, TableInfo>();

  for (const file of migrationFiles) {
    const tables = parseMigrationFile(file);

    for (const table of tables) {
      // Merge with existing table info if it exists
      if (allTables.has(table.name)) {
        const existing = allTables.get(table.name)!;

        // Merge columns (newer definitions override)
        const columnMap = new Map(existing.columns.map(c => [c.name, c]));

        for (const col of table.columns) {
          columnMap.set(col.name, col);
        }

        existing.columns = Array.from(columnMap.values());

        if (table.description) {
          existing.description = table.description;
        }
      } else {
        allTables.set(table.name, table);
      }
    }
  }

  const tables = Array.from(allTables.values());
  console.log(`Discovered ${tables.length} tables\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate main schema documentation
  console.log('📄 Generating schema documentation...');
  const markdown = generateMarkdownDocs(tables);
  const markdownPath = path.join(OUTPUT_DIR, 'SCHEMA.md');
  fs.writeFileSync(markdownPath, markdown);
  console.log(`✅ Written: ${markdownPath}\n`);

  // Generate ERD
  console.log('📄 Generating ERD diagram...');
  const erd = generateMermaidERD(tables);
  const erdPath = path.join(OUTPUT_DIR, 'ERD.md');
  fs.writeFileSync(erdPath, erd);
  console.log(`✅ Written: ${erdPath}\n`);

  // Generate table list as JSON for programmatic access
  console.log('📄 Generating JSON schema...');
  const jsonPath = path.join(OUTPUT_DIR, 'schema.json');
  fs.writeFileSync(jsonPath, JSON.stringify(tables, null, 2));
  console.log(`✅ Written: ${jsonPath}\n`);

  // Generate summary
  console.log('📊 Summary:');
  console.log(`  - Total tables: ${tables.length}`);
  console.log(`  - Total columns: ${tables.reduce((sum, t) => sum + t.columns.length, 0)}`);
  console.log(`  - Output directory: ${OUTPUT_DIR}`);
  console.log('\n✅ Database schema documentation generated successfully!');
}

main().catch(error => {
  console.error('❌ Error generating schema documentation:', error);
  process.exit(1);
});
