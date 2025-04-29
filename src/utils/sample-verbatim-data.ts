// Sample verbatim data generator for testing
import { getRandomComment } from './sample-survey-comments';

export interface SampleVerbatimItem {
  id: string;
  date: string;
  category: string;
  verbatim: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  customerType: string;
  productCategory?: string;
  age?: string;
  gender?: string;
}

// Categories for verbatim analysis
const verbatimCategories = [
  'Customer Service',
  'Product Quality',
  'Website Experience',
  'Mobile App',
  'Pricing',
  'Delivery',
  'Returns Process',
  'Product Selection',
  'Store Experience',
  'Checkout Process'
];

// Sources of feedback
const feedbackSources = [
  'Online Survey',
  'Email Feedback',
  'Call Center',
  'Social Media',
  'App Review',
  'In-Store Feedback',
  'Focus Group',
  'Live Chat',
  'Website Feedback Form',
  'Customer Interview'
];

// Customer types
const customerTypes = [
  'New Customer',
  'Returning Customer',
  'Loyal Customer',
  'One-time Buyer',
  'Premium Member',
  'Business Account',
  'Student',
  'Senior',
  'International'
];

// Product categories
const productCategories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Books & Media',
  'Food & Grocery',
  'Toys & Games',
  'Health & Wellness',
  'Automotive'
];

// Age groups
const ageGroups = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+'
];

// Gender options
const genderOptions = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say'
];

// Generate a random date within the last year
function randomDate(): string {
  const now = new Date();
  const pastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const randomTime = pastYear.getTime() + Math.random() * (now.getTime() - pastYear.getTime());
  const date = new Date(randomTime);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Generate a random item from an array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate a random sentiment
function randomSentiment(): 'positive' | 'negative' | 'neutral' {
  const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
  return randomItem(sentiments);
}

// Generate a sample verbatim item
function generateVerbatimItem(index: number): SampleVerbatimItem {
  const category = randomItem(verbatimCategories);
  const sentiment = randomSentiment();
  const verbatim = getRandomComment(category.toLowerCase(), sentiment);
  
  // Determine if we should include demographic data (70% chance)
  const includeDemographics = Math.random() < 0.7;
  
  return {
    id: `VRB-${index + 1000}`,
    date: randomDate(),
    category,
    verbatim,
    sentiment,
    source: randomItem(feedbackSources),
    customerType: randomItem(customerTypes),
    ...(includeDemographics && {
      productCategory: randomItem(productCategories),
      age: randomItem(ageGroups),
      gender: randomItem(genderOptions)
    })
  };
}

// Generate a sample dataset with the specified number of items
export function generateSampleVerbatimData(count: number = 100): SampleVerbatimItem[] {
  return Array.from({ length: count }, (_, index) => generateVerbatimItem(index));
}
