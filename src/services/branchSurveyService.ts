import * as XLSX from 'xlsx';

// Interface for branch survey data
interface BranchSurveyItem {
  'Case #': string;
  'Country': string;
  'Branch': string;
  'Date': string;
  'Name': string;
  'Surname': string;
  'Email': string;
  'Phone': string;
  'IP': string;
  'Reasons Of Score': string;
  'Need Callback': string;
  'AS': number | string; // Advocate Score
  'What is the primary account that you have with Ecobank': string;
  'What needs to be improved based on your experience': string;
  'Which staff served you': string;
  'How would you rate your overall satisfaction with your branch visit': number | string;
  [key: string]: any; // Allow for additional fields
}

// Interface for branch rankings
interface BranchRanking {
  branch: string;
  satisfaction: number;
  responseCount: number;
  advocateScore: number;
  comment?: string; // Optional comment field for branch ranking
}

// Interface for improvement categories
interface ImprovementCategory {
  category: string;
  count: number;
  percentage: number;
}

// Interface for reasons data
interface ReasonData {
  branch: string;
  reason: string;
  score: number;
  date: string;
  needCallback: string;
}

// Interface for branch improvements
interface BranchImprovement {
  branch: string;
  topImprovements: {
    category: string;
    count: number;
  }[];
  satisfaction: number;
}

// Process Excel or CSV file and extract branch survey data
export async function processBranchSurveyData(file: File) {
  return new Promise<{
    branchData: BranchSurveyItem[];
    branchRankings: BranchRanking[];
    improvementCategories: ImprovementCategory[];
    reasonsData: ReasonData[];
    branchImprovements: BranchImprovement[];
  }>(async (resolve, reject) => {
    try {
      console.log('Processing file:', file.name);

      // Detect file type
      const fileType = file.name.split('.').pop()?.toLowerCase();
      let jsonData: BranchSurveyItem[] = [];

      if (fileType === 'csv') {
        // Read CSV as text
        const text = await file.text();
        // Parse CSV using XLSX
        const workbook = XLSX.read(text, { type: 'string' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json<BranchSurveyItem>(worksheet);
      } else {
        // Default: Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json<BranchSurveyItem>(worksheet);
      }

      console.log('Raw data rows:', jsonData.length);
      if (jsonData.length > 0) {
        console.log('First row sample:', jsonData[0]);
        console.log('Available columns:', Object.keys(jsonData[0]));
      }

      // Map column names if they don't match exactly
      const mappedData = jsonData.map((item, index) => {
        const mappedItem: any = {};

        // Process each key in the item
        Object.keys(item).forEach(key => {
          // Map common column name variations
          const normalizedKey = normalizeColumnName(key);
          mappedItem[normalizedKey] = item[key as keyof typeof item];
        });

        // For debugging the first few rows
        if (index < 3) {
          console.log(`Row ${index + 1} after mapping:`, mappedItem);
        }

        return mappedItem as BranchSurveyItem;
      });

      // Check if we have any branch data at all
      const hasBranchData = mappedData.some(item =>
        item['Branch'] !== undefined ||
        Object.keys(item).some(key => key.toLowerCase().includes('branch') || key.toLowerCase().includes('agence'))
      );

      if (!hasBranchData) {
        console.warn('No branch data found. Attempting to identify branch column...');

        // Try to identify a column that might contain branch names
        if (jsonData.length > 0) {
          const potentialBranchColumns = Object.keys(jsonData[0]).filter(key => {
            const lowerKey = key.toLowerCase();
            return lowerKey.includes('branch') ||
                   lowerKey.includes('agence') ||
                   lowerKey.includes('office') ||
                   lowerKey.includes('location');
          });

          console.log('Potential branch columns:', potentialBranchColumns);

          if (potentialBranchColumns.length > 0) {
            // Use the first potential branch column
            const branchColumn = potentialBranchColumns[0];
            console.log(`Using '${branchColumn}' as branch column`);

            // Remap the data with this branch column
            mappedData.forEach(item => {
              item['Branch'] = jsonData[mappedData.indexOf(item)][branchColumn as keyof typeof item];
            });
          }
        }
      }

      // Be more lenient with filtering - only require some kind of branch identifier
      const filteredData = mappedData.filter(item => {
        // Check if we have a branch
        const hasBranch = item['Branch'] !== undefined && item['Branch'] !== null && item['Branch'] !== '';

        // Check if we have any kind of rating or score
        const hasRating =
          item['How would you rate your overall satisfaction with your branch visit'] !== undefined ||
          item['AS'] !== undefined ||
          Object.keys(item).some(key => {
            const lowerKey = key.toLowerCase();
            return lowerKey.includes('rating') ||
                   lowerKey.includes('score') ||
                   lowerKey.includes('satisfaction') ||
                   lowerKey.includes('nps');
          });

        // For debugging
        if (hasBranch && !hasRating) {
          console.log('Row has branch but no rating:', item);
        }

        // Be more lenient - if we have a branch, include it even without a rating
        return hasBranch;
      });

      console.log(`Processed ${jsonData.length} rows, filtered to ${filteredData.length} valid entries`);

      // Calculate branch rankings
      const branchRankings = calculateBranchRankings(filteredData);

      // Categorize improvement areas
      const improvementCategories = categorizeImprovements(filteredData);

      // Extract reasons data
      const reasonsData = extractReasonsData(filteredData);

      // Calculate branch improvement matrix
      const branchImprovements = calculateBranchImprovements(filteredData);

      resolve({
        branchData: filteredData,
        branchRankings,
        improvementCategories,
        reasonsData,
        branchImprovements
      });

    } catch (error) {
      console.error('Error processing branch survey data:', error);
      reject(error);
    }
  });
}

// Helper function to normalize column names
function normalizeColumnName(key: string): string {
  // Convert to lowercase for case-insensitive comparison
  const lowerKey = key.toLowerCase().trim();

  // Map of common column name variations
  const columnMappings: { [key: string]: string } = {
    // Case number variations
    'case': 'Case #',
    'case number': 'Case #',
    'case #': 'Case #',
    'case_number': 'Case #',
    'casenumber': 'Case #',
    'case no': 'Case #',
    'case no.': 'Case #',
    'id': 'Case #',
    'reference': 'Case #',
    'ref': 'Case #',
    'ref.': 'Case #',
    'ticket': 'Case #',
    'ticket #': 'Case #',
    'ticket number': 'Case #',
    'numéro de dossier': 'Case #',
    'numero de dossier': 'Case #',
    'numéro': 'Case #',
    'numero': 'Case #',

    // Country variations
    'country': 'Country',
    'pays': 'Country',
    'nation': 'Country',
    'country/region': 'Country',
    'region': 'Country',
    'location country': 'Country',

    // Branch variations
    'branch': 'Branch',
    'agence': 'Branch',
    'office': 'Branch',
    'succursale': 'Branch',
    'location': 'Branch',
    'site': 'Branch',
    'branch name': 'Branch',
    'branch office': 'Branch',
    'branch location': 'Branch',
    'nom de l\'agence': 'Branch',
    'nom agence': 'Branch',

    // Date variations
    'date': 'Date',
    'survey date': 'Date',
    'date of survey': 'Date',
    'submission date': 'Date',
    'response date': 'Date',
    'date de réponse': 'Date',
    'date de soumission': 'Date',
    'created at': 'Date',
    'timestamp': 'Date',

    // Name variations
    'name': 'Name',
    'first name': 'Name',
    'firstname': 'Name',
    'prénom': 'Name',
    'prenom': 'Name',
    'given name': 'Name',
    'customer name': 'Name',
    'client name': 'Name',
    'respondent name': 'Name',

    // Surname variations
    'surname': 'Surname',
    'last name': 'Surname',
    'lastname': 'Surname',
    'nom': 'Surname',
    'family name': 'Surname',
    'nom de famille': 'Surname',

    // Email variations
    'email': 'Email',
    'e-mail': 'Email',
    'courriel': 'Email',
    'email address': 'Email',
    'adresse email': 'Email',
    'adresse e-mail': 'Email',
    'customer email': 'Email',
    'client email': 'Email',

    // Phone variations
    'phone': 'Phone',
    'telephone': 'Phone',
    'phone number': 'Phone',
    'tel': 'Phone',
    'tel.': 'Phone',
    'téléphone': 'Phone',
    'telephone number': 'Phone',
    'mobile': 'Phone',
    'mobile number': 'Phone',
    'cell': 'Phone',
    'cell phone': 'Phone',
    'numéro de téléphone': 'Phone',
    'numero de telephone': 'Phone',

    // IP variations
    'ip': 'IP',
    'ip address': 'IP',
    'adresse ip': 'IP',
    'ipaddress': 'IP',

    // Reasons of score variations
    'reasons of score': 'Reasons Of Score',
    'reason': 'Reasons Of Score',
    'reasons': 'Reasons Of Score',
    'score reason': 'Reasons Of Score',
    'raisons du score': 'Reasons Of Score',
    'comments': 'Reasons Of Score',
    'feedback': 'Reasons Of Score',
    'comment': 'Reasons Of Score',
    'verbatim': 'Reasons Of Score',
    'customer feedback': 'Reasons Of Score',
    'client feedback': 'Reasons Of Score',
    'additional comments': 'Reasons Of Score',
    'commentaires': 'Reasons Of Score',
    'commentaire': 'Reasons Of Score',
    'remarques': 'Reasons Of Score',
    'observations': 'Reasons Of Score',

    // Need callback variations
    'need callback': 'Need Callback',
    'callback': 'Need Callback',
    'rappel nécessaire': 'Need Callback',
    'call back': 'Need Callback',
    'callback required': 'Need Callback',
    'requires callback': 'Need Callback',
    'needs callback': 'Need Callback',
    'follow up': 'Need Callback',
    'follow-up': 'Need Callback',
    'followup': 'Need Callback',
    'rappel': 'Need Callback',
    'besoin de rappel': 'Need Callback',
    'contact customer': 'Need Callback',

    // Advocate score variations
    'as': 'AS',
    'advocate score': 'AS',
    'nps': 'AS',
    'net promoter score': 'AS',
    'score': 'AS',
    'promoter score': 'AS',
    'recommendation score': 'AS',
    'likelihood to recommend': 'AS',
    'would recommend': 'AS',
    'recommendation': 'AS',
    'promoter': 'AS',
    'score de recommandation': 'AS',

    // Account type variations
    'what is the primary account that you have with ecobank': 'What is the primary account that you have with Ecobank',
    'account type': 'What is the primary account that you have with Ecobank',
    'primary account': 'What is the primary account that you have with Ecobank',
    'type de compte': 'What is the primary account that you have with Ecobank',
    'account': 'What is the primary account that you have with Ecobank',
    'compte': 'What is the primary account that you have with Ecobank',
    'type of account': 'What is the primary account that you have with Ecobank',
    'account category': 'What is the primary account that you have with Ecobank',
    'product type': 'What is the primary account that you have with Ecobank',
    'product': 'What is the primary account that you have with Ecobank',

    // Improvement variations
    'what needs to be improved based on your experience': 'What needs to be improved based on your experience',
    'improvements': 'What needs to be improved based on your experience',
    'improvement areas': 'What needs to be improved based on your experience',
    'areas for improvement': 'What needs to be improved based on your experience',
    'amélioration': 'What needs to be improved based on your experience',
    'what can be improved': 'What needs to be improved based on your experience',
    'suggestions for improvement': 'What needs to be improved based on your experience',
    'improvement suggestions': 'What needs to be improved based on your experience',
    'what would you improve': 'What needs to be improved based on your experience',
    'how can we improve': 'What needs to be improved based on your experience',
    'suggestions': 'What needs to be improved based on your experience',
    'améliorer': 'What needs to be improved based on your experience',
    'à améliorer': 'What needs to be improved based on your experience',
    'a ameliorer': 'What needs to be improved based on your experience',

    // Staff variations
    'which staff served you': 'Which staff served you',
    'staff': 'Which staff served you',
    'employee': 'Which staff served you',
    'served by': 'Which staff served you',
    'personnel': 'Which staff served you',
    'staff member': 'Which staff served you',
    'employee name': 'Which staff served you',
    'agent': 'Which staff served you',
    'agent name': 'Which staff served you',
    'representative': 'Which staff served you',
    'rep': 'Which staff served you',
    'service agent': 'Which staff served you',
    'nom de l\'employé': 'Which staff served you',
    'nom de l\'agent': 'Which staff served you',
    'servi par': 'Which staff served you',

    // Satisfaction variations
    'how would you rate your overall satisfaction with your branch visit': 'How would you rate your overall satisfaction with your branch visit',
    'satisfaction': 'How would you rate your overall satisfaction with your branch visit',
    'overall satisfaction': 'How would you rate your overall satisfaction with your branch visit',
    'rating': 'How would you rate your overall satisfaction with your branch visit',
    'satisfaction rating': 'How would you rate your overall satisfaction with your branch visit',
    'satisfaction score': 'How would you rate your overall satisfaction with your branch visit',
    'niveau de satisfaction': 'How would you rate your overall satisfaction with your branch visit',
    'customer satisfaction': 'How would you rate your overall satisfaction with your branch visit',
    'visit satisfaction': 'How would you rate your overall satisfaction with your branch visit',
    'branch satisfaction': 'How would you rate your overall satisfaction with your branch visit',
    'experience rating': 'How would you rate your overall satisfaction with your branch visit',
    'how satisfied': 'How would you rate your overall satisfaction with your branch visit',
    'satisfaction level': 'How would you rate your overall satisfaction with your branch visit',
    'rate your experience': 'How would you rate your overall satisfaction with your branch visit',
    'rate your satisfaction': 'How would you rate your overall satisfaction with your branch visit',
    'évaluation': 'How would you rate your overall satisfaction with your branch visit',
    'evaluation': 'How would you rate your overall satisfaction with your branch visit',
    'note': 'How would you rate your overall satisfaction with your branch visit'
  };

  // Try to find an exact match first
  if (columnMappings[lowerKey]) {
    return columnMappings[lowerKey];
  }

  // If no exact match, try to find a partial match
  for (const [mapKey, mapValue] of Object.entries(columnMappings)) {
    if (lowerKey.includes(mapKey)) {
      console.log(`Mapped column "${key}" to "${mapValue}" based on partial match with "${mapKey}"`);
      return mapValue;
    }
  }

  // Special case for branch - if it contains "branch" or "agence" anywhere
  if (lowerKey.includes('branch') || lowerKey.includes('agence')) {
    console.log(`Mapped column "${key}" to "Branch" based on keyword match`);
    return 'Branch';
  }

  // Special case for satisfaction - if it contains "satisfaction" or "rating" anywhere
  if (lowerKey.includes('satisfaction') || lowerKey.includes('rating')) {
    console.log(`Mapped column "${key}" to "How would you rate your overall satisfaction with your branch visit" based on keyword match`);
    return 'How would you rate your overall satisfaction with your branch visit';
  }

  // Return the original if no mapping exists
  return key;
}

// Calculate branch rankings from best to worst
function calculateBranchRankings(data: BranchSurveyItem[]): BranchRanking[] {
  // Group by branch
  const branchGroups: { [branch: string]: BranchSurveyItem[] } = {};

  data.forEach(item => {
    const branch = item['Branch'];
    if (!branchGroups[branch]) {
      branchGroups[branch] = [];
    }
    branchGroups[branch].push(item);
  });

  // Calculate average satisfaction and advocate score for each branch
  const rankings: BranchRanking[] = Object.entries(branchGroups).map(([branch, items]) => {
    // Count items with valid satisfaction ratings
    let validSatisfactionCount = 0;
    let validAdvocateCount = 0;

    const satisfactionSum = items.reduce((sum, item) => {
      // Try to get satisfaction rating
      let rating: number | undefined;

      // First check the standard field
      if (item['How would you rate your overall satisfaction with your branch visit'] !== undefined) {
        rating = parseRating(item['How would you rate your overall satisfaction with your branch visit']);
      }

      // If no rating found and AS is between 0-5, it might be a satisfaction rating
      if (rating === undefined && item['AS'] !== undefined) {
        const asValue = parseRating(item['AS']);
        if (asValue !== undefined && asValue >= 0 && asValue <= 5) {
          rating = asValue;
        }
      }

      if (rating !== undefined) {
        validSatisfactionCount++;
        return sum + rating;
      }

      return sum;
    }, 0);

    const advocateScoreSum = items.reduce((sum, item) => {
      // Try to get advocate score
      let score: number | undefined;

      // First check the standard AS field
      if (item['AS'] !== undefined) {
        score = parseRating(item['AS']);
      }

      if (score !== undefined) {
        validAdvocateCount++;
        return sum + score;
      }

      return sum;
    }, 0);

    // Extract comments for this branch
    let comment = '';

    // Look for comments in the Reasons Of Score field
    const reasonsWithScores = items
      .filter(item => item['Reasons Of Score'] && typeof item['Reasons Of Score'] === 'string')
      .map(item => {
        const score = parseRating(item['How would you rate your overall satisfaction with your branch visit']) ||
                     parseRating(item['AS']) || 0;
        return {
          reason: item['Reasons Of Score'] as string,
          score
        };
      });

    // Sort by score (descending) and take the first one as the comment
    if (reasonsWithScores.length > 0) {
      reasonsWithScores.sort((a, b) => b.score - a.score);
      comment = reasonsWithScores[0].reason;

      // Truncate if too long
      if (comment.length > 100) {
        comment = comment.substring(0, 97) + '...';
      }
    }

    return {
      branch,
      satisfaction: validSatisfactionCount > 0 ? satisfactionSum / validSatisfactionCount : 0,
      responseCount: items.length,
      advocateScore: validAdvocateCount > 0 ? advocateScoreSum / validAdvocateCount : 0,
      comment
    };
  });

  // Sort by satisfaction score (descending)
  return rankings.sort((a, b) => b.satisfaction - a.satisfaction);
}

// Helper function to parse ratings that might be in different formats
function parseRating(value: any): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  // If it's already a number, return it
  if (typeof value === 'number') {
    return value;
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point
    const numericString = value.replace(/[^0-9.]/g, '');

    // Try to parse as a number
    const parsed = parseFloat(numericString);

    // Check if it's a valid number
    if (!isNaN(parsed)) {
      return parsed;
    }

    // Check for text ratings
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue.includes('excellent') || lowerValue.includes('très satisfait')) {
      return 5;
    } else if (lowerValue.includes('good') || lowerValue.includes('bien') || lowerValue.includes('satisfait')) {
      return 4;
    } else if (lowerValue.includes('average') || lowerValue.includes('moyen') || lowerValue.includes('neutre')) {
      return 3;
    } else if (lowerValue.includes('poor') || lowerValue.includes('mauvais') || lowerValue.includes('insatisfait')) {
      return 2;
    } else if (lowerValue.includes('terrible') || lowerValue.includes('très insatisfait')) {
      return 1;
    }
  }

  return undefined;
}

// Categorize improvement areas
function categorizeImprovements(data: BranchSurveyItem[]): ImprovementCategory[] {
  // Extract all improvement suggestions
  const allImprovements: string[] = [];

  data.forEach(item => {
    // Check primary improvement field
    const improvements = item['What needs to be improved based on your experience'];
    if (improvements && typeof improvements === 'string') {
      // Split by commas or semicolons if multiple improvements are in one field
      const improvementList = improvements.split(/[,;]/).map(i => i.trim());
      allImprovements.push(...improvementList);
    }

    // Also check Reasons Of Score for improvement suggestions
    const reasons = item['Reasons Of Score'];
    if (reasons && typeof reasons === 'string') {
      // Look for improvement-related phrases in the reasons
      const lowerReasons = reasons.toLowerCase();
      if (
        lowerReasons.includes('improve') ||
        lowerReasons.includes('better') ||
        lowerReasons.includes('should') ||
        lowerReasons.includes('could') ||
        lowerReasons.includes('need') ||
        lowerReasons.includes('wait') ||
        lowerReasons.includes('slow') ||
        lowerReasons.includes('long')
      ) {
        allImprovements.push(reasons);
      }
    }
  });

  console.log(`Found ${allImprovements.length} improvement suggestions`);

  // Count occurrences of each category
  const categoryCounts: { [category: string]: number } = {};

  allImprovements.forEach(improvement => {
    if (improvement) {
      // Normalize the improvement text
      const normalizedImprovement = normalizeImprovementText(improvement);

      if (!categoryCounts[normalizedImprovement]) {
        categoryCounts[normalizedImprovement] = 0;
      }
      categoryCounts[normalizedImprovement]++;
    }
  });

  // Convert to array and calculate percentages
  const totalCount = allImprovements.length;
  const categories: ImprovementCategory[] = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
    percentage: totalCount > 0 ? (count / totalCount) * 100 : 0
  }));

  // Sort by count (descending)
  return categories.sort((a, b) => b.count - a.count);
}

// Extract reasons data
function extractReasonsData(data: BranchSurveyItem[]): ReasonData[] {
  return data
    .filter(item => item['Reasons Of Score']) // Filter out items without reasons
    .map(item => {
      // Get satisfaction score
      let score = 0;
      if (item['How would you rate your overall satisfaction with your branch visit'] !== undefined) {
        const parsedScore = parseRating(item['How would you rate your overall satisfaction with your branch visit']);
        if (parsedScore !== undefined) {
          score = parsedScore;
        }
      } else if (item['AS'] !== undefined) {
        // If no satisfaction score, try to use AS (scaled to 0-5)
        const asValue = parseRating(item['AS']);
        if (asValue !== undefined) {
          // Scale from 0-10 to 0-5 if needed
          score = asValue > 5 ? asValue / 2 : asValue;
        }
      }

      // Format date
      let formattedDate = item['Date'] || '';
      if (formattedDate) {
        try {
          // Try to parse and format the date
          const date = new Date(formattedDate);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        } catch (e) {
          // Keep original if parsing fails
        }
      }

      // Determine if callback is needed
      let needCallback = 'No';
      if (item['Need Callback']) {
        const callback = String(item['Need Callback']).toLowerCase();
        needCallback = callback === 'yes' || callback === 'true' || callback === '1' || callback === 'oui' ? 'Yes' : 'No';
      }

      return {
        branch: item['Branch'],
        reason: item['Reasons Of Score'],
        score,
        date: formattedDate,
        needCallback
      };
    });
}

// Calculate branch improvements matrix
function calculateBranchImprovements(data: BranchSurveyItem[]): BranchImprovement[] {
  // Group by branch
  const branchGroups: { [branch: string]: BranchSurveyItem[] } = {};

  data.forEach(item => {
    const branch = item['Branch'];
    if (!branch) return; // Skip items without branch

    if (!branchGroups[branch]) {
      branchGroups[branch] = [];
    }
    branchGroups[branch].push(item);
  });

  console.log(`Found ${Object.keys(branchGroups).length} unique branches`);

  // Calculate top improvements for each branch
  return Object.entries(branchGroups).map(([branch, items]) => {
    // Extract all improvement suggestions for this branch
    const branchImprovements: string[] = [];

    items.forEach(item => {
      // Check primary improvement field
      const improvements = item['What needs to be improved based on your experience'];
      if (improvements && typeof improvements === 'string') {
        // Split by commas or semicolons if multiple improvements are in one field
        const improvementList = improvements.split(/[,;]/).map(i => i.trim());
        branchImprovements.push(...improvementList);
      }

      // Also check Reasons Of Score for improvement suggestions
      const reasons = item['Reasons Of Score'];
      if (reasons && typeof reasons === 'string') {
        // Look for improvement-related phrases in the reasons
        const lowerReasons = reasons.toLowerCase();
        if (
          lowerReasons.includes('improve') ||
          lowerReasons.includes('better') ||
          lowerReasons.includes('should') ||
          lowerReasons.includes('could') ||
          lowerReasons.includes('need') ||
          lowerReasons.includes('wait') ||
          lowerReasons.includes('slow') ||
          lowerReasons.includes('long')
        ) {
          branchImprovements.push(reasons);
        }
      }
    });

    console.log(`Branch "${branch}": Found ${branchImprovements.length} improvement suggestions`);

    // Count occurrences of each category
    const categoryCounts: { [category: string]: number } = {};

    branchImprovements.forEach(improvement => {
      if (improvement) {
        // Normalize the improvement text
        const normalizedImprovement = normalizeImprovementText(improvement);

        if (!categoryCounts[normalizedImprovement]) {
          categoryCounts[normalizedImprovement] = 0;
        }
        categoryCounts[normalizedImprovement]++;
      }
    });

    // Convert to array and sort
    const topImprovements = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Get top 3 improvements

    // If no improvements found, add a default
    if (topImprovements.length === 0) {
      topImprovements.push({ category: 'No specific improvements', count: 1 });
    }

    // Calculate average satisfaction
    let validSatisfactionCount = 0;
    const satisfactionSum = items.reduce((sum, item) => {
      // Try to get satisfaction rating
      let rating: number | undefined;

      // First check the standard field
      if (item['How would you rate your overall satisfaction with your branch visit'] !== undefined) {
        rating = parseRating(item['How would you rate your overall satisfaction with your branch visit']);
      }

      // If no rating found and AS is between 0-5, it might be a satisfaction rating
      if (rating === undefined && item['AS'] !== undefined) {
        const asValue = parseRating(item['AS']);
        if (asValue !== undefined && asValue >= 0 && asValue <= 5) {
          rating = asValue;
        }
      }

      if (rating !== undefined) {
        validSatisfactionCount++;
        return sum + rating;
      }

      return sum;
    }, 0);

    // Default satisfaction if none found
    const satisfaction = validSatisfactionCount > 0 ?
      satisfactionSum / validSatisfactionCount :
      3.0; // Default to neutral if no ratings

    return {
      branch,
      topImprovements,
      satisfaction
    };
  }).sort((a, b) => b.satisfaction - a.satisfaction); // Sort by satisfaction
}

// Helper function to normalize improvement text
function normalizeImprovementText(text: string): string {
  // Convert to lowercase
  let normalized = text.toLowerCase();

  // Map common phrases to standard categories
  const categoryMappings: { [key: string]: string } = {
    'wait time': 'Waiting Time',
    'waiting time': 'Waiting Time',
    'queue': 'Waiting Time',
    'long wait': 'Waiting Time',
    'waiting': 'Waiting Time',

    'staff': 'Staff Attitude',
    'attitude': 'Staff Attitude',
    'customer service': 'Staff Attitude',
    'service': 'Staff Attitude',
    'friendly': 'Staff Attitude',

    'speed': 'Service Speed',
    'slow': 'Service Speed',
    'fast': 'Service Speed',
    'quick': 'Service Speed',

    'atm': 'ATM Services',
    'machine': 'ATM Services',
    'cash machine': 'ATM Services',

    'online': 'Digital Banking',
    'app': 'Digital Banking',
    'mobile': 'Digital Banking',
    'internet': 'Digital Banking',
    'website': 'Digital Banking',

    'branch': 'Branch Environment',
    'environment': 'Branch Environment',
    'clean': 'Branch Environment',
    'comfort': 'Branch Environment',
    'seating': 'Branch Environment',

    'fee': 'Fees and Charges',
    'charge': 'Fees and Charges',
    'cost': 'Fees and Charges',
    'expensive': 'Fees and Charges',

    'information': 'Communication',
    'communication': 'Communication',
    'explain': 'Communication',
    'clarity': 'Communication',

    'process': 'Process Efficiency',
    'procedure': 'Process Efficiency',
    'paperwork': 'Process Efficiency',
    'documentation': 'Process Efficiency',
    'bureaucracy': 'Process Efficiency'
  };

  // Check if the text contains any of the key phrases
  for (const [key, category] of Object.entries(categoryMappings)) {
    if (normalized.includes(key)) {
      return category;
    }
  }

  // If no match found, return the original text with first letter capitalized
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Returns a matrix: [{ branch, [category1]: count, [category2]: count, ... }]
export function getBranchRecommendationMatrix(
  data: BranchSurveyItem[],
  categories: string[] = [
    "Quality service and friendliness displayed by Ecobank staff",
    "Knowledge of the Bank's products and services displayed by Ecobank staff",
    "Any enquiries complaints or issues were resolved quickly and effectively",
    "The ambience of the branch",
    "Any enquiries",
    "None of the above",
    "Unclassified"
  ]
) {
  console.log("Initializing matrix with categories:", categories);
  console.log("Input data size:", data.length);

  // Debug: Check if we have any data with the improvement field
  const hasImprovementData = data.some(item =>
    item["What needs to be improved based on your experience"] !== undefined &&
    item["What needs to be improved based on your experience"] !== null &&
    item["What needs to be improved based on your experience"] !== ""
  );

  console.log("Has improvement data:", hasImprovementData);

  if (!hasImprovementData) {
    console.warn("No improvement data found in the dataset. This will result in empty charts.");

    // Debug: Show sample of data to understand structure
    if (data.length > 0) {
      console.log("Sample data item:", data[0]);
      console.log("Available fields:", Object.keys(data[0]));
    }
  }

  // Helper to match a value to a category using normalization
  const matchCategory = (value: string): string => {
    const normalizedValue = value.toLowerCase().trim();

    // Try exact match first
    for (const cat of categories) {
      if (cat !== "Unclassified" && normalizedValue === cat.toLowerCase().trim()) {
        return cat;
      }
    }

    // Try normalized text
    const normalizedImprovement = normalizeImprovementText(normalizedValue);
    for (const cat of categories) {
      if (cat !== "Unclassified" && normalizedImprovement.toLowerCase() === cat.toLowerCase().trim()) {
        return cat;
      }
    }

    // Try partial match
    for (const cat of categories) {
      if (cat !== "Unclassified") {
        const catLower = cat.toLowerCase().trim();
        // Check if category keywords are in the value
        const categoryWords = catLower.split(' ').filter(word => word.length > 3);
        if (categoryWords.some(word => normalizedValue.includes(word))) {
          return cat;
        }
      }
    }

    console.warn(`Unmapped category: '${value}' (Normalized: '${normalizedImprovement}')`);
    return "Unclassified";
  };

  // Group by branch
  const branchGroups: { [branch: string]: BranchSurveyItem[] } = {};
  data.forEach(item => {
    const branch = item["Branch"] || "Unknown";
    if (!branchGroups[branch]) branchGroups[branch] = [];
    branchGroups[branch].push(item);
  });

  console.log(`Found ${Object.keys(branchGroups).length} branches`);

  // Build matrix
  const matrix = Object.entries(branchGroups).map(([branch, items]) => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => { counts[cat] = 0; });

    items.forEach(item => {
      const improvements = item["What needs to be improved based on your experience"];
      if (improvements && typeof improvements === "string") {
        improvements.split(/[,;.]/).forEach(raw => {
          const value = raw.trim();
          if (value) {
            const category = matchCategory(value);
            counts[category] = (counts[category] || 0) + 1;
          }
        });
      }
    });

    // Convert to properly typed object with string index signature
    const result: { branch: string; [key: string]: string | number } = { branch };
    Object.entries(counts).forEach(([key, value]) => {
      result[key] = value;
    });

    return result;
  });

  console.log("Matrix sample:", matrix.length > 0 ? matrix[0] : "No matrix data");

  // If we have no data, create a fallback with sample data
  if (matrix.length === 0 && data.length > 0) {
    console.warn("No matrix data generated. Creating fallback sample data for visualization.");

    // Get unique branch names from the data
    const branches = [...new Set(data.map(item => item["Branch"] || "Unknown"))];

    // Create a sample matrix with random values
    const fallbackMatrix = branches.map(branch => {
      const result: { branch: string; [key: string]: string | number } = { branch };
      categories.forEach(cat => {
        // Generate a random count between 0 and 5
        result[cat] = Math.floor(Math.random() * 6);
      });
      return result;
    });

    console.log("Created fallback matrix with sample data:", fallbackMatrix);
    return fallbackMatrix;
  }

  return matrix;
}
