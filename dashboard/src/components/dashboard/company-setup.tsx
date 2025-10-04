'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building, Plus, Key } from 'lucide-react';
import { apiService } from '@/lib/api';

interface Company {
  _id: string;
  name: string;
  email: string;
  description?: string;
  contactPerson: string;
  isActive: boolean;
}

interface CreateCompanyData {
  name: string;
  email: string;
  description: string;
  contactPerson: string;
}

export function CompanySetup() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    email: '',
    description: '',
    contactPerson: ''
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCompanies();
      setCompanies(response.data || []);
      
      // Check if there's a company in localStorage
      const savedCompanyId = localStorage.getItem('company_id');
      if (savedCompanyId && response.data.find((c: Company) => c._id === savedCompanyId)) {
        setSelectedCompany(savedCompanyId);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.contactPerson) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      const newCompany = await apiService.createCompany(formData);
      
      // Save company ID to localStorage
      localStorage.setItem('company_id', newCompany.data._id);
      setSelectedCompany(newCompany.data._id);
      
      // Refresh companies list
      await fetchCompanies();
      
      // Close dialog and reset form
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', description: '', contactPerson: '' });
      
      alert('Company created successfully!');
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('Failed to create company. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectCompany = (companyId: string) => {
    localStorage.setItem('company_id', companyId);
    setSelectedCompany(companyId);
  };

  const handleInputChange = (field: keyof CreateCompanyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const proceedToApiKeys = () => {
    if (selectedCompany) {
      // Redirect to API keys page or notify parent component
      window.location.href = '/dashboard/api-keys';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Welcome to Kryos</h1>
        <p className="text-gray-600">
          {companies.length === 0 
            ? "Let's start by setting up your company profile"
            : "Select or create a company to manage API keys"
          }
        </p>
      </div>

      {companies.length === 0 ? (
        // No companies exist - show create form
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create Your Company</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Company Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="company@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="Enter contact person name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your company"
                  className="min-h-[80px]"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Company'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        // Companies exist - show selection
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Select Company</h2>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Card 
                key={company._id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCompany === company._id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : ''
                }`}
                onClick={() => handleSelectCompany(company._id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Building className="h-8 w-8 text-blue-500" />
                    {selectedCompany === company._id && (
                      <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                        Selected
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{company.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{company.email}</p>
                  <p className="text-gray-500 text-xs">Contact: {company.contactPerson}</p>
                  {company.description && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">
                      {company.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedCompany && (
            <div className="text-center">
              <Button 
                onClick={proceedToApiKeys}
                className="flex items-center gap-2"
                size="lg"
              >
                <Key className="h-4 w-4" />
                Continue to API Keys
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Company Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company to your account
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dialog-name">Company Name *</Label>
                <Input
                  id="dialog-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dialog-email">Company Email *</Label>
                <Input
                  id="dialog-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="company@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="dialog-contact">Contact Person *</Label>
              <Input
                id="dialog-contact"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder="Enter contact person name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="dialog-description">Description</Label>
              <Textarea
                id="dialog-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your company"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Company'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}