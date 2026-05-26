// Form Validation Helpers

export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return '';
  },

  email: (value) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  },

  phone: (value) => {
    if (!value) return '';
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid 10-digit phone number';
    }
    return '';
  },

  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/\d/.test(value)) {
      return 'Password must contain at least one number';
    }
    return '';
  },

  passwordMatch: (password, confirmPassword) => {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  },

  postalCode: (value) => {
    if (!value) return '';
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(value)) {
      return 'Please enter a valid 6-digit PIN code';
    }
    return '';
  },

  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return '';
  },

  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Must be less than ${max} characters`;
    }
    return '';
  },

  number: (value) => {
    if (value && isNaN(value)) {
      return 'Please enter a valid number';
    }
    return '';
  },

  positiveNumber: (value) => {
    if (value && (isNaN(value) || parseFloat(value) <= 0)) {
      return 'Please enter a positive number';
    }
    return '';
  },

  url: (value) => {
    if (!value) return '';
    try {
      new URL(value);
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  },

  cardNumber: (value) => {
    if (!value) return 'Card number is required';
    const cleaned = value.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleaned)) {
      return 'Please enter a valid 16-digit card number';
    }
    return '';
  },

  cardExpiry: (value) => {
    if (!value) return 'Expiry date is required';
    const [month, year] = value.split('/');
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return 'Use MM/YY format';
    }
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (parseInt(month) < 1 || parseInt(month) > 12) {
      return 'Invalid month';
    }
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return 'Card has expired';
    }
    return '';
  },

  cardCvv: (value) => {
    if (!value) return 'CVV is required';
    if (!/^\d{3,4}$/.test(value)) {
      return 'Please enter a valid CVV';
    }
    return '';
  },
};

/**
 * Validate a single field
 */
export const validateField = (name, value, rules = []) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return '';
};

/**
 * Validate a form object
 */
export const validateForm = (values, validationRules) => {
  const errors = {};
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const error = validateField(field, values[field], rules);
    if (error) {
      errors[field] = error;
    }
  });
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};