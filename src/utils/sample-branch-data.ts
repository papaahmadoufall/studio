// Sample branch data generator for testing
import { generateCommentBasedOnScore } from './sample-survey-comments';

export interface SampleBranchSurveyItem {
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
  'AS': number; // Advocate Score
  'What is the primary account that you have with Ecobank': string;
  'What needs to be improved based on your experience': string;
  'Which staff served you': string;
  'How would you rate your overall satisfaction with your branch visit': number;
  'Comments': string; // Additional detailed comments
}

// Generate random branch names
const branchNames = [
  'Main Branch',
  'Downtown',
  'Westside',
  'Eastside',
  'North Hills',
  'South Valley',
  'Central Plaza',
  'Business District',
  'University',
  'Shopping Mall'
];

// Generate random improvement suggestions
const improvementSuggestions = [
  'Waiting Time',
  'Staff Attitude',
  'Service Speed',
  'ATM Services',
  'Digital Banking',
  'Branch Environment',
  'Fees and Charges',
  'Communication',
  'Process Efficiency'
];

// Generate random reasons for scores
const reasonsForScores = [
  'Excellent service and friendly staff',
  'Quick service, no waiting time',
  'Staff was knowledgeable and helpful',
  'Long waiting time, need more tellers',
  'Staff was not friendly',
  'Branch was clean and comfortable',
  'Digital services were down',
  'ATM was out of service',
  'Process was efficient and quick',
  'Need better communication about services'
];

// Generate random staff names
const staffNames = [
  'John Smith',
  'Mary Johnson',
  'David Williams',
  'Sarah Brown',
  'Michael Davis',
  'Jennifer Miller',
  'Robert Wilson',
  'Lisa Moore',
  'James Taylor',
  'Patricia Anderson'
];

// Generate random account types
const accountTypes = [
  'Savings Account',
  'Checking Account',
  'Business Account',
  'Premium Account',
  'Student Account',
  'Joint Account',
  'Retirement Account',
  'Investment Account'
];

// Generate a random date within the last year
function randomDate(): string {
  const now = new Date();
  const pastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const randomTime = pastYear.getTime() + Math.random() * (now.getTime() - pastYear.getTime());
  const date = new Date(randomTime);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Generate a random score between min and max (inclusive)
function randomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random item from an array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate a random boolean as "Yes" or "No"
function randomYesNo(): string {
  return Math.random() > 0.8 ? 'Yes' : 'No';
}

// Generate a random email
function randomEmail(name: string, surname: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
  return `${name.toLowerCase()}.${surname.toLowerCase()}@${randomItem(domains)}`;
}

// Generate a random phone number
function randomPhone(): string {
  return `+${randomScore(1, 9)}${randomScore(100000000, 999999999)}`;
}

// Generate a random IP address
function randomIP(): string {
  return `${randomScore(1, 255)}.${randomScore(0, 255)}.${randomScore(0, 255)}.${randomScore(0, 255)}`;
}

// Generate a sample branch survey item
function generateSampleItem(index: number): SampleBranchSurveyItem {
  const name = randomItem(['John', 'Mary', 'David', 'Sarah', 'Michael', 'Jennifer', 'Robert', 'Lisa', 'James', 'Patricia']);
  const surname = randomItem(['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson']);

  const branch = randomItem(branchNames);
  const satisfaction = randomScore(1, 5);
  const advocateScore = randomScore(0, 10);

  // Get improvement category
  const improvementCategory = randomItem(improvementSuggestions);

  // Generate detailed comment based on satisfaction score and improvement category
  const detailedComment = generateCommentBasedOnScore(satisfaction, improvementCategory.toLowerCase());

  // Use a shorter version for the Reasons Of Score field
  const reasonOfScore = satisfaction >= 4
    ? `Satisfied with ${randomItem(['service', 'staff', 'experience', 'facilities'])}: ${detailedComment.substring(0, 50)}...`
    : `Dissatisfied with ${randomItem(['wait time', 'service', 'staff attitude', 'fees'])}: ${detailedComment.substring(0, 50)}...`;

  return {
    'Case #': `CASE-${index + 1000}`,
    'Country': 'United States',
    'Branch': branch,
    'Date': randomDate(),
    'Name': name,
    'Surname': surname,
    'Email': randomEmail(name, surname),
    'Phone': randomPhone(),
    'IP': randomIP(),
    'Reasons Of Score': reasonOfScore,
    'Need Callback': satisfaction < 3 ? 'Yes' : randomYesNo(), // More likely to need callback if dissatisfied
    'AS': advocateScore,
    'What is the primary account that you have with Ecobank': randomItem(accountTypes),
    'What needs to be improved based on your experience': improvementCategory,
    'Which staff served you': randomItem(staffNames),
    'How would you rate your overall satisfaction with your branch visit': satisfaction,
    'Comments': detailedComment
  };
}

// Generate a sample dataset with the specified number of items
export function generateSampleBranchData(count: number = 50): SampleBranchSurveyItem[] {
  return Array.from({ length: count }, (_, index) => generateSampleItem(index));
}
