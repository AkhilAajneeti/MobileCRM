import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const CompanyTab = () => {
  const [companyData, setCompanyData] = useState({
    name: "Acme Corporation",
    website: "https://www.acme-corp.com",
    industry: "Technology",
    size: "50-200",
    phone: "+1 (555) 987-6543",
    address: "123 Business Ave",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    country: "US",
    timezone: "America/Los_Angeles",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    logo: "https://images.unsplash.com/photo-1657046121071-6ccc2499ea89"
  });

  const [isLoading, setIsLoading] = useState(false);

  const industryOptions = [
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Finance", label: "Financial Services" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Retail", label: "Retail & E-commerce" },
  { value: "Education", label: "Education" },
  { value: "Real Estate", label: "Real Estate" },
  { value: "Consulting", label: "Consulting" },
  { value: "Marketing", label: "Marketing & Advertising" },
  { value: "Other", label: "Other" }];


  const sizeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "50-200", label: "50-200 employees" },
  { value: "200-1000", label: "200-1000 employees" },
  { value: "1000+", label: "1000+ employees" }];


  const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" }];


  const currencyOptions = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "JPY", label: "Japanese Yen (¥)" }];


  const dateFormatOptions = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY (German)" }];


  const countryOptions = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "AU", label: "Australia" },
  { value: "JP", label: "Japan" }];


  const handleCompanyChange = (field, value) => {
    setCompanyData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = () => {
    // Mock logo upload functionality
    console.log('Logo upload clicked');
  };

  const handleSaveCompany = async () => {
    setIsLoading(true);
    // Mock save functionality
    setTimeout(() => {
      setIsLoading(false);
      console.log('Company settings saved successfully');
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Company Information */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Icon name="Building2" size={24} className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Company Information</h3>
            <p className="text-sm text-muted-foreground">Update your organization details and branding</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border">
                <Image
                  src={companyData?.logo}
                  alt="Acme Corporation company logo with modern geometric design"
                  className="w-full h-full object-cover" />

              </div>
              <button
                onClick={handleLogoUpload}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-smooth"
                aria-label="Upload new company logo">

                <Icon name="Camera" size={16} />
              </button>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground">Company Logo</h4>
              <p className="text-sm text-muted-foreground mb-2">PNG or SVG. Recommended size 200x200px.</p>
              <Button variant="outline" size="sm" onClick={handleLogoUpload}>
                <Icon name="Upload" size={16} className="mr-2" />
                Upload New Logo
              </Button>
            </div>
          </div>

          {/* Basic Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              type="text"
              value={companyData?.name}
              onChange={(e) => handleCompanyChange('name', e?.target?.value)}
              required />

            <Input
              label="Website"
              type="url"
              value={companyData?.website}
              onChange={(e) => handleCompanyChange('website', e?.target?.value)}
              placeholder="https://www.example.com" />

            <Select
              label="Industry"
              options={industryOptions}
              value={companyData?.industry}
              onChange={(value) => handleCompanyChange('industry', value)}
              searchable />

            <Select
              label="Company Size"
              options={sizeOptions}
              value={companyData?.size}
              onChange={(value) => handleCompanyChange('size', value)} />

            <Input
              label="Phone Number"
              type="tel"
              value={companyData?.phone}
              onChange={(e) => handleCompanyChange('phone', e?.target?.value)} />

          </div>
        </div>
      </div>
      {/* Address Information */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Icon name="MapPin" size={24} className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Business Address</h3>
            <p className="text-sm text-muted-foreground">Your company's primary business location</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              type="text"
              value={companyData?.address}
              onChange={(e) => handleCompanyChange('address', e?.target?.value)} />

          </div>
          <Input
            label="City"
            type="text"
            value={companyData?.city}
            onChange={(e) => handleCompanyChange('city', e?.target?.value)} />

          <Input
            label="State/Province"
            type="text"
            value={companyData?.state}
            onChange={(e) => handleCompanyChange('state', e?.target?.value)} />

          <Input
            label="ZIP/Postal Code"
            type="text"
            value={companyData?.zipCode}
            onChange={(e) => handleCompanyChange('zipCode', e?.target?.value)} />

          <Select
            label="Country"
            options={countryOptions}
            value={companyData?.country}
            onChange={(value) => handleCompanyChange('country', value)}
            searchable />

        </div>
      </div>
      {/* Regional Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Icon name="Globe" size={24} className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Regional Settings</h3>
            <p className="text-sm text-muted-foreground">Configure timezone, currency, and date formats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Default Timezone"
            options={timezoneOptions}
            value={companyData?.timezone}
            onChange={(value) => handleCompanyChange('timezone', value)}
            searchable />

          <Select
            label="Default Currency"
            options={currencyOptions}
            value={companyData?.currency}
            onChange={(value) => handleCompanyChange('currency', value)}
            searchable />

          <Select
            label="Date Format"
            options={dateFormatOptions}
            value={companyData?.dateFormat}
            onChange={(value) => handleCompanyChange('dateFormat', value)} />

        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-card-foreground mb-2">Preview</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Date: {new Date()?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: companyData?.timezone
              })}</p>
            <p>Currency: {companyData?.currency === 'USD' ? '$1,234.56' :
              companyData?.currency === 'EUR' ? '€1.234,56' :
              companyData?.currency === 'GBP' ? '£1,234.56' : '¥123,456'}</p>
            <p>Timezone: {timezoneOptions?.find((tz) => tz?.value === companyData?.timezone)?.label}</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant="default"
            onClick={handleSaveCompany}
            loading={isLoading}
            iconName="Save"
            iconPosition="left">

            Save Company Settings
          </Button>
        </div>
      </div>
    </div>);

};

export default CompanyTab;