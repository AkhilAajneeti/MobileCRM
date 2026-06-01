import React from 'react';
import Icon from '../../../components/AppIcon';

const EmailStats = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Emails',
      value: stats?.total,
      icon: 'Mail',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Unread',
      value: stats?.unread,
      icon: 'MailOpen',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'Today',
      value: stats?.today,
      icon: 'Calendar',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Connected Accounts',
      value: stats?.connectedAccounts,
      icon: 'Link',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    }
  ];

  return (
    <div className="bg-background border-b border-border p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems?.map((item, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
            <div className={`w-10 h-10 ${item?.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon name={item?.icon} size={20} className={item?.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{item?.value}</p>
              <p className="text-sm text-muted-foreground">{item?.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailStats;