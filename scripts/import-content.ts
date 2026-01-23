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
  morningPrayer: string;
  'eveningCatechismRef ': string;
  eveningCatechism: string;
  eveningSummary: string;
  eveningQuestions: string;
  isReflectionDay: string;
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

  for (const row of records) {
    const dayNum = parseInt(row.dayNumber);
    const weekNum = parseInt(row.weekNumber);
    
    if (isNaN(dayNum) || isNaN(weekNum)) {
      console.log(`Skipping invalid row: dayNumber=${row.dayNumber}, weekNumber=${row.weekNumber}`);
      continue;
    }

    const questionsStr = row.eveningQuestions || '';
    const questions = questionsStr
      .split(/\d+\.\s+/)
      .filter(q => q.trim().length > 0)
      .map(q => q.trim().replace(/\n/g, ' '));

    const contentData = {
      dayNumber: dayNum,
      weekNumber: weekNum,
      morningScriptureRef: row.morningScriptureRef?.trim() || '',
      morningScriptureText: row.morningScriptureText?.trim() || '',
      morningMeditation: row.morningMeditation?.trim() || '',
      morningPrayer: row.morningPrayer?.trim() || null,
      eveningCatechismRef: (row['eveningCatechismRef '] || '').trim() || null,
      eveningCatechism: row.eveningCatechism?.trim() || '',
      eveningSummary: row.eveningSummary?.trim() || null,
      eveningQuestions: questions.length > 0 ? questions : null,
      isReflectionDay: row.isReflectionDay?.toUpperCase() === 'TRUE',
    };

    try {
      const existing = await db.select().from(dailyContent).where(
        eq(dailyContent.dayNumber, dayNum)
      );

      if (existing.length > 0) {
        await db.update(dailyContent)
          .set(contentData)
          .where(eq(dailyContent.dayNumber, dayNum));
        console.log(`Updated Day ${dayNum}`);
      } else {
        await db.insert(dailyContent).values(contentData);
        console.log(`Inserted Day ${dayNum}`);
      }
    } catch (error) {
      console.error(`Error processing Day ${dayNum}:`, error);
    }
  }

  console.log('Import complete!');
  process.exit(0);
}

const csvPath = process.argv[2] || 'attached_assets/Days_1-7_1769145922300.csv';
importContent(csvPath);
