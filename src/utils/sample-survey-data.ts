// Sample survey data for AI analysis testing
import { SurveyData } from '@/services/data-upload';

// Define a set of sample survey questions
export const sampleSurveyQuestions = {
  satisfaction: "How satisfied are you with our service? (1-5)",
  recommendation: "How likely are you to recommend our service to others? (0-10)",
  easeOfUse: "How easy was it to use our service? (1-5)",
  customerService: "How would you rate our customer service? (1-5)",
  valueForMoney: "How would you rate the value for money? (1-5)",
  verbatim: "Please share any additional feedback or suggestions for improvement."
};

// Generate a sample survey response
function generateSampleResponse(index: number): SurveyData {
  // Create some patterns in the data to make the AI analysis more interesting
  const satisfaction = Math.min(5, Math.max(1, Math.round(3 + (Math.random() * 2 - 1))));
  
  // Make recommendation somewhat correlated with satisfaction
  const recommendationBase = satisfaction * 2 - 1;
  const recommendation = Math.min(10, Math.max(0, Math.round(recommendationBase + (Math.random() * 2 - 1))));
  
  // Make ease of use somewhat correlated with satisfaction
  const easeOfUse = Math.min(5, Math.max(1, Math.round(satisfaction * 0.7 + (Math.random() * 2))));
  
  // Make customer service somewhat correlated with satisfaction
  const customerService = Math.min(5, Math.max(1, Math.round(satisfaction * 0.8 + (Math.random() * 1.5))));
  
  // Make value for money somewhat correlated with satisfaction but with more variation
  const valueForMoney = Math.min(5, Math.max(1, Math.round(satisfaction * 0.6 + (Math.random() * 2.5 - 1))));
  
  // Generate verbatim response based on satisfaction level
  let verbatim = "";
  if (satisfaction >= 4) {
    verbatim = getPositiveComment(easeOfUse, customerService, valueForMoney);
  } else if (satisfaction === 3) {
    verbatim = getNeutralComment(easeOfUse, customerService, valueForMoney);
  } else {
    verbatim = getNegativeComment(easeOfUse, customerService, valueForMoney);
  }
  
  return {
    "ResponseID": `R${1000 + index}`,
    "Timestamp": new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    "Satisfaction": satisfaction,
    "Recommendation": recommendation,
    "EaseOfUse": easeOfUse,
    "CustomerService": customerService,
    "ValueForMoney": valueForMoney,
    "Feedback": verbatim
  };
}

// Generate positive comments based on ratings
function getPositiveComment(easeOfUse: number, customerService: number, valueForMoney: number): string {
  const comments = [
    "I'm very satisfied with the service overall. The interface is intuitive and easy to navigate.",
    "Great experience! The customer service team was very helpful and responsive.",
    "Excellent value for money. I've been using this service for a while and it keeps getting better.",
    "The platform is well-designed and user-friendly. I especially like the new features added recently.",
    "Very impressed with how easy it was to get started. The onboarding process was smooth.",
    "The service exceeds my expectations. I particularly appreciate the attention to detail.",
    "I found the service to be reliable and consistent. Will definitely continue using it.",
    "The customer support team went above and beyond to help me resolve my issue.",
    "I love how intuitive the interface is. Makes my work so much easier.",
    "Great value compared to other services I've tried. Definitely worth the price."
  ];
  
  // If specific aspects rated highly, mention them
  if (easeOfUse >= 4 && customerService >= 4 && valueForMoney >= 4) {
    return "I'm extremely satisfied with everything - the platform is easy to use, customer service is excellent, and it's great value for money!";
  } else if (easeOfUse >= 4) {
    return "The platform is very user-friendly and intuitive. I was able to get started right away without any confusion.";
  } else if (customerService >= 4) {
    return "The customer service team is exceptional. They responded quickly and resolved my issue efficiently.";
  } else if (valueForMoney >= 4) {
    return "This service offers excellent value for money. The features you get for the price are unmatched by competitors.";
  }
  
  return comments[Math.floor(Math.random() * comments.length)];
}

// Generate neutral comments based on ratings
function getNeutralComment(easeOfUse: number, customerService: number, valueForMoney: number): string {
  const comments = [
    "The service is okay. Nothing exceptional but it gets the job done.",
    "It's a decent platform with room for improvement. Some features could be more intuitive.",
    "Average experience overall. Customer service was helpful but took some time to respond.",
    "The service is reasonably priced but I'm not sure if I'm getting the full value yet.",
    "It works as expected most of the time. Occasionally I encounter minor issues.",
    "The interface is somewhat confusing at first, but you get used to it after a while.",
    "Not bad, but not great either. There are some good features but also some limitations.",
    "It's adequate for basic needs but could use more advanced features.",
    "Customer service was polite but didn't fully resolve my issue.",
    "The price is fair but I wish there were more features included in the basic package."
  ];
  
  if (easeOfUse <= 2) {
    return "The platform could be more user-friendly. I found some aspects of the interface confusing and had to spend time figuring things out.";
  } else if (customerService <= 2) {
    return "Customer service could be improved. I had to follow up multiple times to get my issue resolved.";
  } else if (valueForMoney <= 2) {
    return "I'm not sure if I'm getting good value for money. The price seems a bit high for the features provided.";
  }
  
  return comments[Math.floor(Math.random() * comments.length)];
}

// Generate negative comments based on ratings
function getNegativeComment(easeOfUse: number, customerService: number, valueForMoney: number): string {
  const comments = [
    "I'm disappointed with the service. It doesn't meet my expectations and I've encountered several issues.",
    "The platform is difficult to navigate and I often get frustrated trying to find what I need.",
    "Customer service was unhelpful and took too long to respond to my inquiries.",
    "Not worth the price. There are better alternatives available for less.",
    "I've experienced multiple technical issues that have impacted my ability to use the service effectively.",
    "The interface is confusing and not intuitive at all. I waste a lot of time trying to figure things out.",
    "I regret subscribing to this service. It's been a disappointing experience from the start.",
    "Too many bugs and glitches. It feels like the product wasn't properly tested before release.",
    "Customer support is terrible. My issues remain unresolved after multiple attempts to get help.",
    "Overpriced for what you get. I don't see the value in continuing with this service."
  ];
  
  if (easeOfUse <= 2 && customerService <= 2 && valueForMoney <= 2) {
    return "I'm very dissatisfied with this service. The platform is difficult to use, customer service is poor, and it's definitely not worth the money.";
  } else if (easeOfUse <= 2) {
    return "The user interface is terrible. It's confusing, unintuitive, and I waste a lot of time just trying to navigate through the platform.";
  } else if (customerService <= 2) {
    return "The customer service is awful. They take forever to respond and when they do, they're not helpful at all.";
  } else if (valueForMoney <= 2) {
    return "This service is way overpriced for what you get. I don't think I'll be renewing my subscription.";
  }
  
  return comments[Math.floor(Math.random() * comments.length)];
}

// Generate a dataset with the specified number of responses
export function generateSampleSurveyData(count: number = 50): SurveyData[] {
  return Array.from({ length: count }, (_, index) => generateSampleResponse(index));
}

// Generate a small dataset for display purposes
export const sampleDisplayData = generateSampleSurveyData(5);

// Generate a larger dataset for analysis
export const sampleAnalysisData = generateSampleSurveyData(50);
