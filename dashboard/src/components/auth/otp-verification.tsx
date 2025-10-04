'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, RefreshCw } from 'lucide-react';
import { apiService, Company as ApiCompany } from '@/lib/api';

type Company = ApiCompany;

interface OtpVerificationProps {
  email: string;
  onVerificationSuccess: (companyData: Company) => void;
  onBack: () => void;
}

export function OtpVerification({ email, onVerificationSuccess, onBack }: OtpVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && !isVerifying) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await apiService.verifyOtp(email, otpToVerify);
      
      if (response.success) {
        // Store authentication data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('company_id', response.data.company._id);
          localStorage.setItem('company_data', JSON.stringify(response.data.company));
        }
        
        onVerificationSuccess(response.data.company);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid OTP. Please try again.';
      setError(errorMessage);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError('');

    try {
      await apiService.sendOtp(email);
      setTimeLeft(600); // Reset timer
      setOtp(['', '', '', '', '', '']); // Clear current OTP
      inputRefs.current[0]?.focus();
      alert('New OTP sent successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle className="text-white">Verify Your Email</CardTitle>
          <CardDescription className="text-slate-400">
            We&apos;ve sent a 6-digit code to<br />
            <span className="font-medium text-white">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-bold bg-slate-700 border-slate-600 text-white focus:border-purple-500"
                disabled={isVerifying}
              />
            ))}
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded p-2">
              {error}
            </div>
          )}

          {/* Timer */}
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : 'Code expired'}
            </span>
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerifyOtp()}
            disabled={isVerifying || otp.some(digit => digit === '')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </Button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-2">Didn&apos;t receive the code?</p>
            <Button
              variant="ghost"
              onClick={handleResendOtp}
              disabled={isResending || timeLeft > 0}
              className="text-purple-400 hover:text-purple-300 hover:bg-slate-700"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : timeLeft > 0 ? (
                `Resend in ${formatTime(timeLeft)}`
              ) : (
                'Resend Code'
              )}
            </Button>
          </div>

          {/* Back Button */}
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Back to Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}