/**
 * Represents data from a CSV or Excel file.
 */
export interface SurveyData {
  [key: string]: string | number | boolean | null;
}

/**
 * Asynchronously processes survey data from a file.
 *
 * @param file The file containing the survey data.
 * @returns A promise that resolves to an array of SurveyData objects.
 */
export async function processSurveyData(file: File): Promise<SurveyData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const fileType = file.name.split('.').pop()?.toLowerCase();

        let data: SurveyData[];

        if (fileType === 'csv') {
          try {
            data = parseCSV(content);
          } catch (csvError: any) {
            console.error("Error parsing as CSV:", csvError);
            reject(new Error(`Failed to parse CSV file: ${csvError.message}`));
            return;
          }
        } else if (fileType === 'json') {
          try {
            data = JSON.parse(content);
            if (!Array.isArray(data)) {
              data = [data]; // Wrap single JSON object in an array for consistency
            }
          } catch (jsonError: any) {
            console.warn("Error parsing as JSON, attempting CSV parse:", jsonError);
             try {
                data = parseCSV(content);
              } catch (csvError: any) {
                console.error("Error parsing as CSV:", csvError);
                reject(new Error(`Failed to parse CSV file: ${csvError.message}`));
                return;
              }
          }
        } else if (fileType === 'xlsx' || fileType === 'xls') {
             reject(new Error("Excel files are not supported. Please upload a CSV or JSON file."));
             return;
          }
         else {
          reject(new Error("Unsupported file type. Please upload a CSV or JSON file."));
          return;
        }

        if (!Array.isArray(data)) {
           reject(new Error("The file must contain an array of survey responses."));
           return;
        }

        resolve(data);

      } catch (e: any) {
        console.error("Error processing file content:", e);
        reject(new Error(`Error processing file content: ${e.message}`));
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      reject(new Error("Error reading file."));
    };
    reader.readAsText(file);
  });
}

/**
 * Parses CSV content into an array of SurveyData objects.
 *
 * @param csvText The CSV content as a string.
 * @returns An array of SurveyData objects.
 */
function parseCSV(csvText: string): SurveyData[] {
  // Handle different line endings
  const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must have a header and at least one data row.');
  }

  // Detect if the CSV is tab-delimited or comma-delimited
  const delimiter = lines[0].includes('\t') ? '\t' : ',';

  // Parse headers, handling quoted values
  const headers = parseCSVLine(lines[0], delimiter).map(header => header.trim());
  const data: SurveyData[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim().length === 0) continue;

    const values = parseCSVLine(lines[i], delimiter);

    if (values.length !== headers.length) {
      // Try to handle misaligned data by padding or truncating
      if (values.length < headers.length) {
        // Pad with empty values
        while (values.length < headers.length) {
          values.push('');
        }
      } else {
        // Truncate extra values
        values.length = headers.length;
      }
      console.warn(`Row ${i + 1} had ${values.length} columns, expected ${headers.length}. Adjusted.`);
    }

    const row: SurveyData = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j] || `column${j}`; // Fallback for empty headers
      const value = values[j] ? values[j].trim() : '';

      // Attempt to convert to number or boolean
      if (value === '') {
        row[header] = null;
      } else if (!isNaN(Number(value)) && value !== '') {
        row[header] = Number(value);
      } else if (value.toLowerCase() === 'true') {
        row[header] = true;
      } else if (value.toLowerCase() === 'false') {
        row[header] = false;
      } else {
        row[header] = value;
      }
    }
    data.push(row);
  }

  return data;
}

/**
 * Parses a CSV line, handling quoted values correctly
 */
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle quotes
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Double quotes inside quotes - add a single quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      // Normal character
      current += char;
    }
  }

  // Add the last field
  result.push(current);
  return result;
}



