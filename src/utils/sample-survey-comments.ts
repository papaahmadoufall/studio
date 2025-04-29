// Sample survey comments for testing and demonstration

// Positive comments about service quality
export const positiveServiceComments = [
  "The staff was exceptionally helpful and went above and beyond to solve my issue. They took the time to explain everything clearly.",
  "I was impressed by how quickly the teller processed my transaction. Very efficient service with a smile!",
  "The branch manager personally assisted me with my loan application. This level of attention made me feel valued as a customer.",
  "Staff was knowledgeable about all products and helped me choose the right account for my needs. Very professional service.",
  "I appreciate how the staff remembered my name from my previous visit. Makes banking feel more personal.",
  "The customer service representative was patient and thorough in explaining the new digital banking features to me.",
  "Everyone at this branch is always friendly and welcoming. It's why I've stayed with this bank for over 10 years.",
  "The financial advisor provided excellent guidance for my retirement planning. Very knowledgeable and didn't push unnecessary products.",
  "I was pleasantly surprised by how smoothly my account transfer was handled. No complications at all.",
  "The staff member noticed a potential issue with my account and proactively helped me resolve it before it became a problem."
];

// Negative comments about service quality
export const negativeServiceComments = [
  "I had to wait over 30 minutes to speak with a teller. There were only two staff members serving during peak hours.",
  "The staff seemed disinterested and was having personal conversations while customers were waiting. Very unprofessional.",
  "I received conflicting information from two different employees about account fees. This created unnecessary confusion.",
  "The customer service representative was unable to answer basic questions about my account and had to keep asking others.",
  "I felt rushed during my consultation. The advisor was clearly trying to finish quickly rather than address all my concerns.",
  "The staff member was rude when I asked for clarification about a charge on my statement. Made me feel like I was bothering them.",
  "Nobody greeted me when I entered the branch. I had to figure out the queue system myself with no assistance.",
  "The bank representative tried to upsell me products I explicitly said I wasn't interested in. Felt very pushy and uncomfortable.",
  "I was transferred between three different departments on the phone before someone could help me with a simple issue.",
  "The staff seemed poorly trained and had to consult with managers for routine transactions, which extended my wait time significantly."
];

// Comments about branch environment
export const branchEnvironmentComments = [
  "The branch is always clean and well-maintained. The comfortable seating area makes waiting more pleasant.",
  "The branch layout is confusing. It's not clear where to go for different services.",
  "I appreciate the private consultation rooms for discussing sensitive financial matters.",
  "The branch is too small for the number of customers it serves. Always feels crowded and noisy.",
  "The digital check-in kiosks streamline the process and reduce waiting time significantly.",
  "The branch needs better climate control. It was uncomfortably hot during my last visit.",
  "I like the children's play area that keeps my kids occupied while I handle my banking.",
  "The branch lacks adequate parking, which makes quick visits difficult during busy hours.",
  "The accessibility features for disabled customers are excellent. Ramps, wide doorways, and priority service.",
  "The branch feels outdated compared to other banks. Could use modernization in both technology and decor."
];

// Comments about digital banking
export const digitalBankingComments = [
  "The mobile app is intuitive and makes managing my accounts so much easier than visiting the branch.",
  "The online banking system frequently crashes during bill payments. Very frustrating experience.",
  "I love the instant notification feature for all transactions. Helps me keep track of my spending in real-time.",
  "The authentication process for the mobile app is too complicated with too many steps.",
  "The ability to deposit checks through the mobile app has saved me countless trips to the branch.",
  "The website is not mobile-friendly and difficult to navigate on my phone when the app is down.",
  "The digital statements are well-organized and easy to download for my records.",
  "There's often a delay between when a transaction occurs and when it appears in online banking.",
  "The budgeting tools in the app have helped me manage my finances much better.",
  "I wish there were video tutorials for using the more complex features of online banking."
];

// Comments about ATM services
export const atmServiceComments = [
  "The ATMs are always well-maintained and rarely out of service, unlike other banks in the area.",
  "The ATM ran out of cash during a weekend, and there was no alternative nearby.",
  "I appreciate the advanced ATMs that accept cash deposits without envelopes.",
  "The ATM interface is confusing and has too many screens to navigate through for simple transactions.",
  "The 24/7 ATM lobby with card access makes night-time banking feel secure.",
  "The ATM card reader frequently malfunctions and requires multiple attempts to read my card.",
  "The option to choose bill denominations at the ATM is very convenient.",
  "The ATM is often surrounded by people loitering, which makes me feel unsafe when using it at night.",
  "The check deposit feature at the ATM works flawlessly and saves me time.",
  "The ATM screens are difficult to read in direct sunlight."
];

// Comments about fees and charges
export const feesAndChargesComments = [
  "The transparent fee structure is one reason I chose this bank. No hidden charges ever.",
  "I was charged a maintenance fee without any prior notification. Very disappointing.",
  "The free checking account with no minimum balance requirement is perfect for my needs.",
  "The international transfer fees are much higher than competing banks.",
  "I appreciate that the bank refunded an accidental overdraft fee. Great customer service.",
  "The ATM fees for using other banks' machines are excessive.",
  "The tiered interest rates on savings accounts reward customers with higher balances fairly.",
  "I was surprised by the paper statement fee that wasn't clearly disclosed when I opened my account.",
  "The lack of fees for online bill payments makes managing monthly expenses easier.",
  "The early account closure fee seems designed to trap customers rather than serve them."
];

// Comments about loan and mortgage services
export const loanServiceComments = [
  "The mortgage application process was streamlined and much faster than I expected.",
  "The interest rates offered were higher than advertised when I actually applied for the loan.",
  "The loan officer was extremely helpful in explaining all the terms and finding the best option for my situation.",
  "There were unexpected processing fees added at the last minute during my loan closing.",
  "The online loan payment system makes it easy to make extra payments toward principal.",
  "The documentation requirements for my small business loan were excessive and time-consuming.",
  "I appreciate the flexible repayment options on my personal loan during financial hardship.",
  "The home equity line of credit approval took much longer than promised.",
  "The auto loan rate matching policy saved me money when I brought in a competitor's offer.",
  "The prepayment penalty on my loan wasn't clearly explained when I signed the paperwork."
];

// General improvement suggestions
export const improvementSuggestions = [
  "Extended hours on weekdays would be helpful for those who work traditional 9-5 jobs.",
  "More staff during peak lunch hours would reduce wait times significantly.",
  "A dedicated business banking window would streamline services for small business owners.",
  "Better integration between the mobile app and website would provide a more consistent experience.",
  "More detailed transaction descriptions on statements would help with budgeting and record-keeping.",
  "A callback option instead of waiting on hold would respect customers' time better.",
  "Educational workshops on financial planning would be a valuable service for customers.",
  "More drive-through lanes would improve efficiency during busy periods.",
  "A customer loyalty program that rewards long-term customers would show appreciation.",
  "Simplified paperwork for routine services would reduce processing time and improve efficiency."
];

// Function to get a random comment based on category and sentiment
export function getRandomComment(category: string, sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'): string {
  let commentPool: string[] = [];
  
  switch (category.toLowerCase()) {
    case 'service':
    case 'staff attitude':
    case 'service speed':
      commentPool = sentiment === 'positive' ? positiveServiceComments : 
                    sentiment === 'negative' ? negativeServiceComments :
                    [...positiveServiceComments, ...negativeServiceComments];
      break;
      
    case 'branch environment':
    case 'ambience':
    case 'facilities':
      commentPool = branchEnvironmentComments;
      break;
      
    case 'digital banking':
    case 'online services':
    case 'mobile app':
      commentPool = digitalBankingComments;
      break;
      
    case 'atm services':
    case 'atm':
      commentPool = atmServiceComments;
      break;
      
    case 'fees and charges':
    case 'pricing':
    case 'costs':
      commentPool = feesAndChargesComments;
      break;
      
    case 'loans':
    case 'mortgages':
    case 'credit':
      commentPool = loanServiceComments;
      break;
      
    case 'improvements':
    case 'suggestions':
      commentPool = improvementSuggestions;
      break;
      
    default:
      // Mix all comments for general or unrecognized categories
      commentPool = [
        ...positiveServiceComments, 
        ...negativeServiceComments,
        ...branchEnvironmentComments,
        ...digitalBankingComments,
        ...atmServiceComments,
        ...feesAndChargesComments,
        ...loanServiceComments,
        ...improvementSuggestions
      ];
  }
  
  // Return a random comment from the selected pool
  return commentPool[Math.floor(Math.random() * commentPool.length)];
}

// Function to generate a detailed comment based on satisfaction score
export function generateCommentBasedOnScore(score: number, category?: string): string {
  // Determine sentiment based on score
  let sentiment: 'positive' | 'negative' | 'neutral';
  
  if (score >= 4) {
    sentiment = 'positive';
  } else if (score <= 2) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }
  
  // If category is provided, get a comment for that category
  if (category) {
    return getRandomComment(category, sentiment);
  }
  
  // Otherwise, select a random category based on score
  let categories: string[];
  
  if (sentiment === 'positive') {
    categories = ['service', 'branch environment', 'digital banking', 'atm services'];
  } else if (sentiment === 'negative') {
    categories = ['service', 'fees and charges', 'atm services', 'digital banking'];
  } else {
    categories = ['improvements', 'branch environment', 'digital banking'];
  }
  
  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
  return getRandomComment(selectedCategory, sentiment);
}
