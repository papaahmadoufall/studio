// Sample KPI data generator for testing

export interface SampleKpiItem {
  id: string;
  date: string;
  department: string;
  region: string;
  nps: number;
  csat: number;
  ces: number;
  responseTime: number;
  resolutionRate: number;
  firstContactResolution: number;
  customerRetention: number;
  churnRate: number;
  averageHandleTime: number;
  costPerInteraction: number;
}

// Departments for KPI analysis
const departments = [
  'Sales',
  'Customer Service',
  'Technical Support',
  'Billing',
  'Returns',
  'Product Support',
  'Account Management',
  'Online Support',
  'In-Store Support',
  'VIP Support'
];

// Regions for KPI analysis
const regions = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Middle East',
  'Africa',
  'Australia/NZ',
  'UK & Ireland',
  'Nordic',
  'Central Europe'
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

// Generate a random number between min and max (inclusive)
function randomNumber(min: number, max: number, decimals: number = 0): number {
  const value = min + Math.random() * (max - min);
  return Number(value.toFixed(decimals));
}

// Generate a sample KPI item
function generateKpiItem(index: number): SampleKpiItem {
  const department = randomItem(departments);
  const region = randomItem(regions);
  
  // Generate realistic KPI values with some correlation
  // Better departments tend to have better scores across the board
  const departmentQuality = Math.random(); // 0 to 1, higher is better
  
  // NPS: -100 to 100
  const nps = Math.round((departmentQuality * 150) - 50);
  
  // CSAT: 1 to 5
  const csat = 1 + (departmentQuality * 4);
  
  // CES (Customer Effort Score): 1 to 7 (lower is better)
  const ces = 7 - (departmentQuality * 5);
  
  // Response Time in minutes: 1 to 60
  const responseTime = 60 - (departmentQuality * 55) + (Math.random() * 10);
  
  // Resolution Rate: 50% to 100%
  const resolutionRate = 50 + (departmentQuality * 45) + (Math.random() * 5);
  
  // First Contact Resolution: 40% to 95%
  const firstContactResolution = 40 + (departmentQuality * 50) + (Math.random() * 5);
  
  // Customer Retention: 60% to 95%
  const customerRetention = 60 + (departmentQuality * 30) + (Math.random() * 5);
  
  // Churn Rate: 2% to 20% (lower is better)
  const churnRate = 20 - (departmentQuality * 15) - (Math.random() * 3);
  
  // Average Handle Time in minutes: 3 to 30
  const averageHandleTime = 30 - (departmentQuality * 25) + (Math.random() * 5);
  
  // Cost Per Interaction: $5 to $50
  const costPerInteraction = 50 - (departmentQuality * 40) + (Math.random() * 10);
  
  return {
    id: `KPI-${index + 1000}`,
    date: randomDate(),
    department,
    region,
    nps: Math.round(nps),
    csat: Number(csat.toFixed(1)),
    ces: Number(ces.toFixed(1)),
    responseTime: Number(responseTime.toFixed(1)),
    resolutionRate: Number(resolutionRate.toFixed(1)),
    firstContactResolution: Number(firstContactResolution.toFixed(1)),
    customerRetention: Number(customerRetention.toFixed(1)),
    churnRate: Number(churnRate.toFixed(1)),
    averageHandleTime: Number(averageHandleTime.toFixed(1)),
    costPerInteraction: Number(costPerInteraction.toFixed(2))
  };
}

// Generate a sample dataset with the specified number of items
export function generateSampleKpiData(count: number = 75): SampleKpiItem[] {
  return Array.from({ length: count }, (_, index) => generateKpiItem(index));
}
