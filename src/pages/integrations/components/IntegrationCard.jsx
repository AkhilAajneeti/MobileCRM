import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const IntegrationCard = ({ integration, onConnect, onDisconnect, onConfigure }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpanded = () => {
    if (integration?.isConnected) {
      setIsExpanded(!isExpanded);
    }
  };

  const getStatusColor = () => {
    switch (integration?.status) {
      case 'connected':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'syncing':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (integration?.status) {
      case 'connected':
        return 'CheckCircle';
      case 'error':
        return 'AlertCircle';
      case 'syncing':
        return 'RefreshCw';
      default:
        return 'Circle';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-elevation-1 transition-smooth">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            <Image 
              src={integration?.logo} 
              alt={`${integration?.name} service logo`}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{integration?.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Icon 
                name={getStatusIcon()} 
                size={14} 
                className={getStatusColor()}
              />
              <span className={`text-sm ${getStatusColor()}`}>
                {integration?.statusText}
              </span>
            </div>
          </div>
        </div>
        
        {integration?.isPopular && (
          <span className="px-2 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full">
            Popular
          </span>
        )}
      </div>
      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">
        {integration?.description}
      </p>
      {/* Features */}
      <div className="space-y-2 mb-4">
        {integration?.features?.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Icon name="Check" size={14} className="text-success" />
            <span className="text-sm text-card-foreground">{feature}</span>
          </div>
        ))}
      </div>
      {/* Last Sync Info */}
      {integration?.isConnected && integration?.lastSync && (
        <div className="flex items-center space-x-2 mb-4 p-3 bg-muted rounded-lg">
          <Icon name="Clock" size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Last synced: {integration?.lastSync}
          </span>
        </div>
      )}
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {!integration?.isConnected ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => onConnect(integration?.id)}
              iconName="Plus"
              iconPosition="left"
            >
              Connect
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(integration?.id)}
                iconName="Unlink"
                iconPosition="left"
              >
                Disconnect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onConfigure(integration?.id)}
                iconName="Settings"
                iconPosition="left"
              >
                Configure
              </Button>
            </>
          )}
        </div>

        {integration?.isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleExpanded}
            iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
            iconPosition="right"
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        )}
      </div>
      {/* Expanded Configuration */}
      {isExpanded && integration?.isConnected && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <div>
            <h4 className="font-medium text-card-foreground mb-2">Sync Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sync Frequency</span>
                <span className="text-sm text-card-foreground">{integration?.syncFrequency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Auto Sync</span>
                <div className="w-8 h-4 bg-primary rounded-full relative">
                  <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {integration?.notifications && (
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Notifications</h4>
              <div className="space-y-2">
                {integration?.notifications?.map((notification, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{notification?.label}</span>
                    <div className={`w-8 h-4 rounded-full relative ${notification?.enabled ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${notification?.enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegrationCard;