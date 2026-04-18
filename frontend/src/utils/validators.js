/**
 * UPI ID Validator - Checks if valid UPI format
 */
export const validateUPI = (upiId) => {
  if (!upiId) return 'UPI ID is required';
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId) ? null : 'Invalid UPI ID format';
};

/**
 * Phone Number Validator - Checks if valid 10-digit phone
 */
export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone) ? null : 'Enter a valid 10-digit phone number';
};

/**
 * Amount Validator - Checks if valid positive number
 */
export const validateAmount = (amount) => {
  if (!amount) return 'Amount is required';
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return 'Enter a valid amount';
  if (num > 100000) return 'Amount exceeds daily limit';
  return null;
};

/**
 * Email Validator
 */
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : 'Invalid email address';
};

/**
 * Password Validator
 */
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
    return 'Must include uppercase, lowercase, and a number';
  }
  return null;
};
