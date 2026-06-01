import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmailConnectionCard = ({ provider, icon, description, onConnect, isConnected = false }) => {
  return (
    <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-xl text-primary-foreground">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Icon name={icon} size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{provider}</h3>
            <p className="text-sm text-primary-foreground/80">Email Integration</p>
          </div>
        </div>
        {isConnected && (
          <div className="flex items-center space-x-1 bg-success/20 px-2 py-1 rounded-full">
            <Icon name="Check" size={14} />
            <span className="text-xs font-medium">Connected</span>
          </div>
        )}
      </div>
      
      <p className="text-sm text-primary-foreground/90 mb-4">
        {description}
      </p>
      
      <Button
        variant="secondary"
        onClick={onConnect}
        disabled={isConnected}
        className="w-full bg-white/20 hover:bg-white/30 text-primary-foreground border-white/30"
      >
        <Icon name={isConnected ? "Check" : "Plus"} size={16} className="mr-2" />
        {isConnected ? "Connected" : `Connect ${provider}`}
      </Button>
    </div>
  );
};

export default EmailConnectionCard;