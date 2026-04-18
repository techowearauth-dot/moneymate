/**
 * Sample Data for UI Development
 */

export const MOCK_USER = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+91 98765 43210',
  upiId: 'john.doe@okaxis',
  photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  memberSince: 'January 2024',
};

export const MOCK_STATS = { 
  scanned: 127, 
  frauds: 3, 
  safe: 124, 
  amountSent: 24500,
  monthlySpending: 12450.00,
  weeklyProgress: 0.65, // 65% of budget
};

export const MOCK_ACCOUNTS = [
  { id: '1', type: 'UPI', bank: 'HDFC Bank', accountNo: '**** 4821', isDefault: true, color: ['#6366F1', '#818CF8'] },
  { id: '2', type: 'CARD', bank: 'ICICI Credit', accountNo: '**** 9012', isDefault: false, color: ['#EC4899', '#F472B6'] },
  { id: '3', type: 'BANK', bank: 'SBI Savings', accountNo: '**** 0056', isDefault: false, color: ['#10B981', '#34D399'] },
];

export const MOCK_CONTACTS = [
  { id: '1', name: 'Sarah', upiId: 'sarah@okicici', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: '2', name: 'Rahul', upiId: 'rahul@paytm', img: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
  { id: '3', name: 'Priya', upiId: 'priya@gpay', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { id: '4', name: 'Amit', upiId: 'amit@axl', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { id: '5', name: 'Sneha', upiId: 'sneha@ybl', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
];

export const MOCK_REWARDS = {
  cashback: 154.00,
  pendingScratchCards: 2,
};

export const MOCK_ALERTS = [
  { id: 1, message: "Security Alert: New login from Delhi", type: "warning", time: "2m ago" },
  { id: 2, message: "Cashback of ₹50 added successfully", type: "success", time: "15m ago" },
];

export const MOCK_TRANSACTIONS = [
  { id: 1, name: "Rahul Kumar",  upiId: "rahul@paytm", amount: -500,  type: "sent", method: 'UPI', date: "Today, 2:30 PM",     status: "success" },
  { id: 2, name: "Priya Sharma", upiId: "priya@gpay",  amount: 1200,  type: "received", method: 'BANK', date: "Today, 11:00 AM",    status: "success" },
  { id: 3, name: "Amazon Pay",   upiId: "amazon@upi",  amount: -899,  type: "sent", method: 'CARD', date: "Yesterday, 6:45 PM", status: "success" },
  { id: 4, name: "Unknown UPI",  upiId: "win@upi",     amount: -1,    type: "sent", method: 'UPI', date: "Yesterday, 3:00 PM", status: "failed" },
];

export const MOCK_BILLS = [
  { id: 1, name: 'Recharge', icon: 'phone-portrait-outline' },
  { id: 2, name: 'Electricity', icon: 'flash-outline' },
  { id: 3, name: 'DTH', icon: 'tv-outline' },
  { id: 4, name: 'Broadband', icon: 'wifi-outline' },
  { id: 5, name: 'More', icon: 'grid-outline' },
];
