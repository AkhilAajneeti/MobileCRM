import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityBadges = () => {
  const securityFeatures = [
    {
      icon: 'Shield',
      text: 'SSL Encrypted',
      description: '256-bit encryption'
    },
    {
      icon: 'Lock',
      text: 'SOC 2 Compliant',
      description: 'Enterprise security'
    },
    {
      icon: 'CheckCircle',
      text: 'GDPR Ready',
      description: 'Privacy protected'
    }
  ];

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center justify-center space-x-6">
        {securityFeatures?.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2 text-muted-foreground">
            <Icon 
              name={feature?.icon} 
              size={16} 
              className="text-success" 
            />
            <div className="text-center">
              <div className="text-xs font-medium">{feature?.text}</div>
              <div className="text-xs opacity-75">{feature?.description}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Your data is protected with enterprise-grade security
        </p>
      </div>
    </div>
  );
};

export default SecurityBadges;