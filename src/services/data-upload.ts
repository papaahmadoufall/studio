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
            console.error("Error parsing as JSON:", jsonError);
            reject(new Error(`Failed to parse JSON file: ${jsonError.message}`));
            return;
          }
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
  const lines = csvText.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have a header and at least one data row.');
  }

  const headers = lines[0].split(',').map(header => header.trim());
  const data: SurveyData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim());
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i + 1} due to inconsistent number of columns.`);
      continue;
    }

    const row: SurveyData = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = values[j];

      // Attempt to convert to number or boolean
      if (!isNaN(Number(value))) {
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
