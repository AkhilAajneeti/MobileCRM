import React from 'react';
import Icon from '../../../components/AppIcon';

const EmailThreadItem = ({ email, onClick }) => {
  const formatDate = (date) => {
    const now = new Date();
    const emailDate = new Date(date);
    const diffInHours = (now - emailDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return emailDate?.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return emailDate?.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return emailDate?.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div 
      onClick={() => onClick(email)}
      className={`
        p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-smooth
        ${!email?.isRead ? 'bg-accent/10' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-primary-foreground">
              {email?.sender?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`text-sm truncate ${!email?.isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                {email?.sender}
              </span>
              {!email?.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {email?.account}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {email?.hasAttachment && (
            <Icon name="Paperclip" size={14} className="text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {formatDate(email?.date)}
          </span>
        </div>
      </div>
      <div className="ml-11">
        <h4 className={`text-sm mb-1 truncate ${!email?.isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
          {email?.subject}
        </h4>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {email?.preview}
        </p>
        
        {email?.labels && email?.labels?.length > 0 && (
          <div className="flex items-center space-x-1 mt-2">
            {email?.labels?.map((label, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailThreadItem;