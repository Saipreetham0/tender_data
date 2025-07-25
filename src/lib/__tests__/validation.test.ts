// src/lib/__tests__/validation.test.ts
import {
  emailSchema,
  passwordSchema,
  userRegistrationSchema,
  userLoginSchema,
  paymentOrderSchema,
  paymentVerificationSchema,
  tenderSchema,
  validateAndSanitize,
  ValidationError,
  validatePasswordStrength,
  sanitizeString,
  sanitizeHTML,
} from '../validation';

describe('Email Schema', () => {
  it('should validate correct email', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
    ];

    validEmails.forEach(email => {
      expect(emailSchema.parse(email)).toBe(email.toLowerCase());
    });
  });

  it('should reject invalid email', () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test.example.com',
      '',
    ];

    invalidEmails.forEach(email => {
      expect(() => emailSchema.parse(email)).toThrow();
    });
  });

  it('should convert email to lowercase', () => {
    const email = 'TEST@EXAMPLE.COM';
    expect(emailSchema.parse(email)).toBe('test@example.com');
  });
});

describe('Password Schema', () => {
  it('should validate password with minimum length', () => {
    const validPasswords = [
      'password123',
      'mySecretPassword',
      'veryLongPasswordThatIsValid',
    ];

    validPasswords.forEach(password => {
      expect(passwordSchema.parse(password)).toBe(password);
    });
  });

  it('should reject short passwords', () => {
    const invalidPasswords = [
      'short',
      '1234567',
      '',
      'pass',
    ];

    invalidPasswords.forEach(password => {
      expect(() => passwordSchema.parse(password)).toThrow();
    });
  });
});

describe('User Registration Schema', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'validPassword123',
    fullName: 'John Doe',
    organization: 'Test Corp',
    phone: '+1234567890',
  };

  it('should validate complete user registration data', () => {
    const result = userRegistrationSchema.parse(validUserData);
    expect(result).toEqual({
      ...validUserData,
      email: validUserData.email.toLowerCase(),
    });
  });

  it('should validate minimal user registration data', () => {
    const minimalData = {
      email: 'test@example.com',
      password: 'validPassword123',
      fullName: 'John Doe',
    };

    const result = userRegistrationSchema.parse(minimalData);
    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('validPassword123');
    expect(result.fullName).toBe('John Doe');
  });

  it('should reject invalid email in registration', () => {
    const invalidData = {
      ...validUserData,
      email: 'invalid-email',
    };

    expect(() => userRegistrationSchema.parse(invalidData)).toThrow();
  });

  it('should reject short full name', () => {
    const invalidData = {
      ...validUserData,
      fullName: 'A',
    };

    expect(() => userRegistrationSchema.parse(invalidData)).toThrow();
  });
});

describe('Payment Order Schema', () => {
  const validOrderData = {
    planId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'monthly' as const,
    userEmail: 'test@example.com',
    amount: 999,
    currency: 'INR',
  };

  it('should validate valid payment order data', () => {
    const result = paymentOrderSchema.parse(validOrderData);
    expect(result).toEqual({
      ...validOrderData,
      userEmail: validOrderData.userEmail.toLowerCase(),
    });
  });

  it('should use default currency if not provided', () => {
    const dataWithoutCurrency = {
      ...validOrderData,
      currency: undefined,
    };
    delete dataWithoutCurrency.currency;

    const result = paymentOrderSchema.parse(dataWithoutCurrency);
    expect(result.currency).toBe('INR');
  });

  it('should reject invalid UUID for planId', () => {
    const invalidData = {
      ...validOrderData,
      planId: 'invalid-uuid',
    };

    expect(() => paymentOrderSchema.parse(invalidData)).toThrow();
  });

  it('should reject invalid payment type', () => {
    const invalidData = {
      ...validOrderData,
      type: 'invalid-type',
    };

    expect(() => paymentOrderSchema.parse(invalidData)).toThrow();
  });

  it('should reject zero or negative amount', () => {
    const invalidData = {
      ...validOrderData,
      amount: 0,
    };

    expect(() => paymentOrderSchema.parse(invalidData)).toThrow();
  });
});

describe('Payment Verification Schema', () => {
  const validVerificationData = {
    razorpay_order_id: 'order_123456789',
    razorpay_payment_id: 'pay_123456789',
    razorpay_signature: 'valid_signature_string',
    userEmail: 'test@example.com',
  };

  it('should validate valid payment verification data', () => {
    const result = paymentVerificationSchema.parse(validVerificationData);
    expect(result).toEqual({
      ...validVerificationData,
      userEmail: validVerificationData.userEmail.toLowerCase(),
    });
  });

  it('should reject empty required fields', () => {
    const requiredFields = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'];
    
    requiredFields.forEach(field => {
      const invalidData = {
        ...validVerificationData,
        [field]: '',
      };

      expect(() => paymentVerificationSchema.parse(invalidData)).toThrow();
    });
  });
});

describe('Tender Schema', () => {
  const validTenderData = {
    name: 'Test Tender',
    postedDate: new Date().toISOString(),
    closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    downloadLinks: [
      {
        text: 'Download PDF',
        url: 'https://example.com/tender.pdf',
      },
    ],
    source: 'test-source',
  };

  it('should validate valid tender data', () => {
    const result = tenderSchema.parse(validTenderData);
    expect(result).toEqual(validTenderData);
  });

  it('should reject empty tender name', () => {
    const invalidData = {
      ...validTenderData,
      name: '',
    };

    expect(() => tenderSchema.parse(invalidData)).toThrow();
  });

  it('should reject tender with no download links', () => {
    const invalidData = {
      ...validTenderData,
      downloadLinks: [],
    };

    expect(() => tenderSchema.parse(invalidData)).toThrow();
  });

  it('should reject invalid URL in download links', () => {
    const invalidData = {
      ...validTenderData,
      downloadLinks: [
        {
          text: 'Invalid Link',
          url: 'not-a-valid-url',
        },
      ],
    };

    expect(() => tenderSchema.parse(invalidData)).toThrow();
  });
});

describe('validateAndSanitize', () => {
  it('should validate and return data for valid input', () => {
    const data = { email: 'test@example.com' };
    const result = validateAndSanitize(emailSchema, data.email);
    expect(result).toBe('test@example.com');
  });

  it('should throw ValidationError for invalid input', () => {
    expect(() => validateAndSanitize(emailSchema, 'invalid-email')).toThrow(ValidationError);
  });

  it('should include field information in ValidationError', () => {
    try {
      validateAndSanitize(userRegistrationSchema, {
        email: 'invalid-email',
        password: 'short',
        fullName: 'John Doe',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Invalid email format');
    }
  });
});

describe('Password Strength Validation', () => {
  it('should validate strong password', () => {
    const strongPassword = 'StrongP@ssw0rd';
    const result = validatePasswordStrength(strongPassword);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject weak passwords', () => {
    const weakPasswords = [
      'short',
      'onlylowercase',
      'ONLYUPPERCASE',
      'NoNumbers!',
      'NoSpecialChars123',
    ];

    weakPasswords.forEach(password => {
      const result = validatePasswordStrength(password);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  it('should provide specific error messages', () => {
    const result = validatePasswordStrength('weak');
    
    expect(result.errors).toContain('Password must be at least 8 characters long');
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
    expect(result.errors).toContain('Password must contain at least one number');
    expect(result.errors).toContain('Password must contain at least one special character');
  });
});

describe('Sanitization Functions', () => {
  describe('sanitizeString', () => {
    it('should remove dangerous characters and trim', () => {
      const input = '  <script>alert("xss")</script>  ';
      const result = sanitizeString(input);
      expect(result).toBe('script>alert("xss")/script');
    });

    it('should preserve normal text', () => {
      const input = 'Normal text input';
      const result = sanitizeString(input);
      expect(result).toBe('Normal text input');
    });
  });

  describe('sanitizeHTML', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape all dangerous characters', () => {
      const input = '<>"\'&/';
      const result = sanitizeHTML(input);
      expect(result).toBe('&lt;&gt;&quot;&#x27;&amp;&#x2F;');
    });
  });
});