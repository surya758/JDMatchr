import { supabase } from './supabase';

export interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const submitContactForm = async (formData: ContactFormData): Promise<ContactFormResponse> => {
  // Client-side validation
  if (!formData.name.trim()) {
    return { success: false, message: 'Name is required', error: 'VALIDATION_ERROR' };
  }

  if (!formData.email.trim()) {
    return { success: false, message: 'Email is required', error: 'VALIDATION_ERROR' };
  }

  if (!formData.message.trim()) {
    return { success: false, message: 'Message is required', error: 'VALIDATION_ERROR' };
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    return { success: false, message: 'Please enter a valid email address', error: 'VALIDATION_ERROR' };
  }

  // Message length validation
  if (formData.message.trim().length < 10) {
    return { success: false, message: 'Message must be at least 10 characters long', error: 'VALIDATION_ERROR' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-contact-email', {
      body: {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject?.trim() || '',
        message: formData.message.trim(),
      },
    });

    console.log(data, error);

    if (error) {
      console.error('Supabase function error:', error);
      return { 
        success: false, 
        message: 'Failed to send message. Please try again.', 
        error: 'FUNCTION_ERROR' 
      };
    }

    return {
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
    };

  } catch (error) {
    console.error('Contact form submission error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again or contact us directly.',
      error: 'NETWORK_ERROR',
    };
  }
};

export const validateContactForm = (formData: ContactFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formData.name.trim()) {
    errors.push('Name is required');
  }

  if (!formData.email.trim()) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
  }

  if (!formData.message.trim()) {
    errors.push('Message is required');
  } else if (formData.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}; 