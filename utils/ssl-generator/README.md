# SSL Generator Utility

A Node.js utility for generating SSL (Student Service Learning) PDFs from CSV data using a PDF template. This tool is part of the CAPSA Tutoring App and helps automate the process of creating SSL forms for students.

## Features

- Batch processing of SSL records from CSV data
- Automated PDF form filling using templates
- Support for custom PDF form fields
- Output directory management
- Error handling and logging

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Required Dependencies

```json
{
  "pdf-lib": "^1.17.1",
  "csv-parse": "^5.0.0"
}
```

## File Structure

```
ssl-generator/
├── index.ts        # Main generator script
├── ssl.pdf        # PDF template file
├── ssl.csv        # Input CSV data
└── output/        # Generated PDFs directory
```

## Input Files

### PDF Template (ssl.pdf)

- A PDF form with fillable fields
- Field names should match the CSV column headers
- Required fields: name, group, ssl

### CSV Data File (ssl.csv)

The CSV file should contain the following columns:

```csv
name,group,ssl
"Doe, John","CAPSA-MC, Group A","10"
```

## Usage

1. Place your PDF template as `ssl.pdf` in the utility directory
2. Prepare your CSV data file as `ssl.csv`
3. Run the generator:

```bash
npm run generate-ssl
```

The utility will:
1. Create an output directory if it doesn't exist
2. Read and validate the input files
3. Process each record from the CSV
4. Generate individual PDFs in the output directory

## Output

Generated PDFs will be saved in the `output/` directory with filenames in the format:
```
{sanitized_name}_{group}_ssl.pdf
```

## Error Handling

The utility includes error handling for:
- Missing input files
- Invalid PDF template
- CSV parsing errors
- PDF generation failures

Errors are logged to the console with descriptive messages.

## Integration

This utility is integrated with the CAPSA Tutoring App's API endpoints:
- `/api/ssl/bucket` - For template management
- `/api/ssl/generate` - For individual PDF generation
- `/api/users/export` - For exporting SSL data

## Contributing

When contributing to this utility:
1. Maintain the existing error handling patterns
2. Follow the TypeScript type definitions
3. Test with various PDF templates and CSV data formats

## License

This utility is part of the CAPSA Tutoring App and follows its licensing terms.