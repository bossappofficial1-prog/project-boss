'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import BackNavigationConfirmModal from '@/components/modals/BackNavigationConfirmModal';
import { PasswordInput } from '@/components/ui/password-input';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { apiClient } from '@/lib/apis/base';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Personal Info, 2: Account Details, 3: Verification
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    name: '',
    phone: '',

    // Step 2: Account Details
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Persist registration state in sessionStorage
  const saveRegistrationState = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('registration_state', JSON.stringify({
        step,
        formData,
        verificationCode,
        timestamp: Date.now()
      }));
    }
  };

  const loadRegistrationState = () => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('registration_state');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          // Only restore if saved within last 30 minutes
          if (Date.now() - data.timestamp < 30 * 60 * 1000) {
            setStep(data.step);
            setFormData(data.formData);
            setVerificationCode(data.verificationCode || '');
            return true;
          } else {
            // Clear expired state
            sessionStorage.removeItem('registration_state');
          }
        } catch (e) {
          sessionStorage.removeItem('registration_state');
        }
      }
    }
    return false;
  };

  const clearRegistrationState = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('registration_state');
    }
  };

  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [restoredFromSession, setRestoredFromSession] = useState(false);

  // Load state on component mount
  useEffect(() => {
    const wasRestored = loadRegistrationState();
    setRestoredFromSession(wasRestored);
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    saveRegistrationState();
  }, [step, formData, verificationCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = () => {
    setError('');

    if (step === 1) {
      // Validate step 1
      if (!formData.name.trim() || !formData.phone.trim()) {
        setError('Please fill in all required fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate step 2
      if (!formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Submit registration
      handleRegister();
    }
  };

  const handlePrevStep = () => {
    setError('');
    if (step > 1) {
      if (step === 3) {
        // Show confirmation dialog when trying to go back from verification step
        setShowBackConfirmation(true);
      } else {
        setStep(step - 1);
      }
    }
  };

  const confirmBackNavigation = () => {
    setShowBackConfirmation(false);
    // Reset to step 1 and clear all data since user confirmed they want to start over
    setStep(1);
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setVerificationCode('');
    setError('');
    setSuccess('');
    clearRegistrationState();
  };

  const cancelBackNavigation = () => {
    setShowBackConfirmation(false);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      setSuccess('Registration successful! Please check your email for verification code.');
      setStep(3);
      // Don't clear state here - user needs it for verification
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/verify', {
        email: formData.email,
        code: verificationCode,
      });

      setSuccess('Email verified successfully! You can now sign in.');
      clearRegistrationState(); // Clear state after successful verification
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      await apiClient.post('/auth/resend-verification', {
        email: formData.email,
      });

      setResendMessage('Kode verifikasi baru telah dikirim ke email Anda.');
      setTimeout(() => setResendMessage(''), 5000);
    } catch (err: any) {
      setResendMessage(err.message || 'Gagal mengirim ulang kode verifikasi.');
      setTimeout(() => setResendMessage(''), 5000);
    } finally {
      setResendLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Personal Information';
      case 2:
        return 'Account Setup';
      case 3:
        return 'Email Verification';
      default:
        return 'Create Account';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return 'Tell us about yourself';
      case 2:
        return 'Create your login credentials';
      case 3:
        return 'Verify your email address';
      default:
        return 'Join BOSS Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <Image
              src="/Logo Boss.png"
              alt="BOSS Logo"
              width={200}
              height={200}
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-poppins">
            {getStepTitle()}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-poppins">
            {getStepDescription()}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold font-poppins ${i <= step
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
              >
                {i < step ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  i
                )}
              </div>
              {i < 3 && (
                <div
                  className={`w-12 h-0.5 ml-2 ${i < step ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Restoration Notification */}
        {restoredFromSession && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl text-sm font-poppins">
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Progress restored from previous session</span>
              <button
                onClick={() => {
                  clearRegistrationState();
                  setStep(1);
                  setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                  });
                  setVerificationCode('');
                  setRestoredFromSession(false);
                  setError('');
                  setSuccess('');
                }}
                className="ml-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-xs"
              >
                Start fresh
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-red-100 dark:border-gray-700">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-poppins">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-poppins">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl font-poppins"
              >
                Continue
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Password <span className="text-red-500">*</span>
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a secure password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 font-poppins"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="flex-1 flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-poppins"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </div>
                  ) : (
                    <>
                      Create Account
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Email Verification */}
          {step === 3 && (
            <form className="space-y-6" onSubmit={handleVerify}>
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-poppins">
                  We've sent a verification code to<br />
                  <strong>{formData.email}</strong>
                </p>
              </div>

              <div className='flex flex-col items-center justify-center'>
                <label htmlFor="verificationCode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Verification Code
                </label>
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={(value) => setVerificationCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-poppins">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* Resend Verification Message */}
              {resendMessage && (
                <div className={`text-center text-sm font-poppins p-3 rounded-lg ${resendMessage.includes('berhasil')
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}>
                  {resendMessage}
                </div>
              )}

              {/* Resend Verification Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
                >
                  {resendLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    "Didn't receive the code? Resend"
                  )}
                </button>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 font-poppins"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-poppins"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verify Email
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Sign in link - Only show on step 1 */}
          {step === 1 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors duration-200">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Back Navigation Confirmation Modal */}
        <BackNavigationConfirmModal
          open={showBackConfirmation}
          onOpenChange={setShowBackConfirmation}
          onConfirm={confirmBackNavigation}
          onCancel={cancelBackNavigation}
        />
      </div>
    </div>
  );
}
