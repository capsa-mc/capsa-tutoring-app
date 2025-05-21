import { PDFDocument, PDFTextField } from 'pdf-lib'
import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SSLRecord {
  name: string;
  group: string;
  ssl: string;
}

async function generateSSLPDFs() {
  // Check if required files exist
  const templatePath = join(__dirname, 'ssl.pdf');
  const csvPath = join(__dirname, 'ssl.csv');
  const outputDir = join(__dirname, 'output');

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir);
    console.log('Created output directory');
  }

  if (!existsSync(templatePath)) {
    console.error('Error: ssl.pdf template file not found');
    return;
  }

  if (!existsSync(csvPath)) {
    console.error('Error: ssl.csv file not found');
    return;
  }

  // Read and parse CSV file
  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  }) as SSLRecord[];

  // Read the PDF template
  const templateBytes = readFileSync(templatePath);
  
  for (const record of records) {
    try {
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();

      // Get all form fields
      const fields = form.getFields();

      // Get all column headers
      const columnHeaders = Object.keys(records[0]);

      fields.forEach(field => {
        if (field instanceof PDFTextField) {
          try {
            const key = field.getText() || ''
            
            // key is not null and columnHeaders includes key
            if (key && columnHeaders.includes(key)) {
              const value = record[key as keyof SSLRecord]
              if (value) {
                field.setText(String(value))
                field.enableReadOnly()
              }
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            console.warn(`Error processing field ${field.getName()}:`, error)
          }
        }
      })

      // Generate output filename
      const sanitizedName = record.name.replace(/\s+/g, '_');
      const outputFilename = `${record.group}_${sanitizedName}.pdf`;
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const outputPath = join(outputDir, outputFilename);
      writeFileSync(outputPath, pdfBytes);
      
      console.log(`Generated: ${outputPath}`);
    } catch (error) {
      console.error(`Error processing record for ${record.name}:`, error);
    }
  }

  console.log('PDF generation completed!');
}

// Run the script
generateSSLPDFs().catch(console.error);