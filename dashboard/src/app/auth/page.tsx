'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import type { Company as ApiCompany } from '@/lib/api';
import { AlertCircle, Shield, Activity, Users, Key, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OtpVerification } from '@/components/auth/otp-verification';
import { apiService } from '@/lib/api';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState('');
  const router = useRouter();
  const { register, isAuthenticated, setCompanyFromOtp } = useAuth();

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      await apiService.sendOtp(email);
      setEmailForOtp(email);
      setShowOtpVerification(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSuccess = (companyData: ApiCompany) => {
    // Persist to context so protected pages see authenticated state immediately
    setCompanyFromOtp(companyData);
    router.push('/dashboard');
  };

  const handleBackToEmail = () => {
    setShowOtpVerification(false);
    setEmailForOtp('');
    setError('');
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  // Show OTP verification if needed
  if (showOtpVerification) {
    return (
      <OtpVerification 
        email={emailForOtp}
        onVerificationSuccess={handleOtpSuccess}
        onBack={handleBackToEmail}
      />
    );
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const companyData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      contactPerson: formData.get('contactPerson') as string,
      description: formData.get('description') as string,
      website: formData.get('website') as string,
      phone: formData.get('phone') as string,
    };

    try {
      await register(companyData);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-white space-y-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-12 w-12 text-purple-400" />
            <h1 className="text-4xl font-bold">Kryos</h1>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold">
              Advanced Security Monitoring for Modern Applications
            </h2>
            <p className="text-lg text-slate-300">
              Monitor your applications in real-time, detect threats, and secure your infrastructure with our comprehensive dashboard.
            </p>

            <div className="grid gap-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-green-400" />
                <span>Real-time traffic monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-blue-400" />
                <span>User behavior analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <Key className="h-6 w-6 text-yellow-400" />
                <span>API key management</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-purple-400" />
                <span>Security threat detection</span>
              </div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-orange-400" />
                <span>Advanced analytics & reports</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-xl font-semibold mb-3">Why Choose Kryos?</h3>
            <ul className="space-y-2 text-slate-300">
              <li>• Easy SDK integration for any backend</li>
              <li>• Real-time threat detection with AI/ML</li>
              <li>• Comprehensive security event logging</li>
              <li>• Customizable alerts and notifications</li>
              <li>• Enterprise-grade security standards</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <Card className="w-full max-w-md mx-auto bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Welcome to Kryos</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your account or register your company
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white">Company Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="company@example.com"
                      required
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                    {isLoading ? 'Sending OTP...' : 'Send Login Code'}
                  </Button>
                  <p className="text-center text-sm text-slate-400 mt-2">
                    We&apos;ll send a 6-digit code to your email
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Company Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Acme Corp"
                        required
                        disabled={isLoading}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson" className="text-white">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        placeholder="John Doe"
                        required
                        disabled={isLoading}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="contact@acme.com"
                      required
                      disabled={isLoading}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        disabled={isLoading}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-white">Website (Optional)</Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        placeholder="https://acme.com"
                        disabled={isLoading}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Brief description of your company..."
                      disabled={isLoading}
                      rows={3}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}