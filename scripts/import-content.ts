import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { db } from '../server/db';
import { dailyContent } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface ContentRow {
  dayNumber: string;
  weekNumber: string;
  morningScriptureRef: string;
  morningScriptureText: string;
  morningMeditation: string;
  morningPrayer?: string;
  'eveningCatechismRef '?: string;
  eveningCatechism: string;
  eveningSummary?: string;
  eveningQuestions: string;
  isReflectionDay: string;
}

// Remove PDF artifacts like "Spiritual Healing Ministry | First 30 Days of Prayer Page X of 101"
function sanitizeContent(text: string): string {
  if (!text) return '';
  
  // Remove PDF page headers/footers
  let cleaned = text.replace(/Spiritual Healing Ministry \| First 30 Days of Prayer Page \d+ of \d+/gi, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Convert YouTube URLs to embeddable format
function formatYouTubeLinks(text: string): string {
  if (!text) return '';
  
  // Match YouTube URLs and convert to embed format
  // Patterns: youtube.com/watch?v=ID, youtu.be/ID
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:[^\s]*)?/gi;
  
  return text.replace(youtubeRegex, (match, videoId) => {
    return `[VIDEO:${videoId}]`;
  });
}

// Process evening content - sanitize and format videos
function processEveningContent(text: string): string {
  let processed = sanitizeContent(text);
  processed = formatYouTubeLinks(processed);
  return processed;
}

// Balance long text - extract core content if over word limit
function balanceText(text: string, maxWords: number = 500): string {
  if (!text) return '';
  
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  if (paragraphs.length <= 3) {
    // Just truncate with ellipsis if already few paragraphs
    return words.slice(0, maxWords).join(' ') + '...';
  }
  
  // Take first 3 paragraphs and last paragraph for summary
  const coreParagraphs = paragraphs.slice(0, 3);
  const result = coreParagraphs.join('\n\n');
  
  // Ensure we're not over the limit
  const resultWords = result.split(/\s+/);
  if (resultWords.length > maxWords) {
    return resultWords.slice(0, maxWords).join(' ') + '...';
  }
  
  return result;
}

async function importContent(csvPath: string) {
  console.log(`Reading CSV from: ${csvPath}`);
  
  const fileContent = readFileSync(csvPath, 'utf-8');
  
  const records: ContentRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });

  console.log(`Found ${records.length} records to import`);

  // Reflection days are 6, 12, 18, 24, 30
  const reflectionDays = new Set([6, 12, 18, 24, 30]);

  let successCount = 0;
  let errorCount = 0;

  for (const row of records) {
    const dayNum = parseInt(row.dayNumber);
    const weekNum = parseInt(row.weekNumber);
    
    if (isNaN(dayNum) || isNaN(weekNum)) {
      console.log(`Skipping invalid row: dayNumber=${row.dayNumber}, weekNumber=${row.weekNumber}`);
      continue;
    }

    // Process questions - split by numbered pattern
    const questionsStr = row.eveningQuestions || '';
    const questions = questionsStr
      .split(/\d+\.\s+/)
      .filter(q => q.trim().length > 0)
      .map(q => sanitizeContent(q.trim().replace(/\n/g, ' ')));

    // Process and sanitize content
    const morningScriptureText = sanitizeContent(row.morningScriptureText || '');
    const morningMeditation = sanitizeContent(row.morningMeditation || '');
    const eveningCatechism = processEveningContent(balanceText(row.eveningCatechism || '', 500));

    const contentData = {
      dayNumber: dayNum,
      weekNumber: weekNum,
      morningScriptureRef: sanitizeContent(row.morningScriptureRef || ''),
      morningScriptureText: morningScriptureText,
      morningMeditation: morningMeditation,
      morningPrayer: row.morningPrayer ? sanitizeContent(row.morningPrayer) : null,
      eveningCatechismRef: (row['eveningCatechismRef '] || '').trim() || null,
      eveningCatechism: eveningCatechism,
      eveningSummary: row.eveningSummary ? sanitizeContent(row.eveningSummary) : null,
      eveningQuestions: questions.length > 0 ? questions : null,
      isReflectionDay: reflectionDays.has(dayNum) || row.isReflectionDay?.toUpperCase() === 'TRUE',
    };

    try {
      const existing = await db.select().from(dailyContent).where(
        eq(dailyContent.dayNumber, dayNum)
      );

      if (existing.length > 0) {
        await db.update(dailyContent)
          .set(contentData)
          .where(eq(dailyContent.dayNumber, dayNum));
        console.log(`Updated Day ${dayNum} (Week ${weekNum})${contentData.isReflectionDay ? ' [REFLECTION DAY]' : ''}`);
      } else {
        await db.insert(dailyContent).values(contentData);
        console.log(`Inserted Day ${dayNum} (Week ${weekNum})${contentData.isReflectionDay ? ' [REFLECTION DAY]' : ''}`);
      }
      successCount++;
    } catch (error) {
      console.error(`Error processing Day ${dayNum}:`, error);
      errorCount++;
    }
  }

  console.log(`\nImport complete! Success: ${successCount}, Errors: ${errorCount}`);
  process.exit(0);
}

const csvPath = process.argv[2] || 'attached_assets/First_30_Days_Prayer_Manual_Structured.xlsx_-_Sheet1_(2)_1769149453183.csv';
importContent(csvPath);
