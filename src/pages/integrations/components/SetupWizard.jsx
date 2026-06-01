import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const SetupWizard = ({ integration, isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen || !integration) return null;

  const steps = [
    {
      title: "Authorization",
      description: "Grant CRMPro access to your account",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
            <Image 
              src={integration?.logo} 
              alt={`${integration?.name} service logo for authorization`}
              className="w-10 h-10 object-contain"
            />
          </div>
          <p className="text-muted-foreground">
            You'll be redirected to {integration?.name} to authorize the connection. 
            Make sure you're logged into your {integration?.name} account.
          </p>
        </div>
      )
    },
    {
      title: "Configuration",
      description: "Choose what data to sync",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            {integration?.features?.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon name="Check" size={16} className="text-success" />
                  <span className="text-sm text-card-foreground">{feature}</span>
                </div>
                <div className="w-8 h-4 bg-primary rounded-full relative">
                  <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Complete",
      description: "Integration setup successful",
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <Icon name="CheckCircle" size={32} className="text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground mb-2">
              {integration?.name} Connected Successfully!
            </h3>
            <p className="text-muted-foreground">
              Your {integration?.name} account is now connected and syncing with CRMPro.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = async () => {
    if (currentStep === 0) {
      setIsConnecting(true);
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsConnecting(false);
    }
    
    if (currentStep < steps?.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(integration?.id);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-elevation-2 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Connect {integration?.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps?.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close setup wizard"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps?.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-card-foreground mb-2">
              {steps?.[currentStep]?.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {steps?.[currentStep]?.description}
            </p>
            {steps?.[currentStep]?.content}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <Button
              variant="default"
              onClick={handleNext}
              loading={isConnecting}
              disabled={isConnecting}
            >
              {currentStep === steps?.length - 1 ? 'Complete' : 
               currentStep === 0 ? 'Authorize' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;