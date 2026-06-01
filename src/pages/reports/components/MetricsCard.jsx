import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, change, changeType, icon, iconColor, description }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return 'TrendingUp';
    if (changeType === 'negative') return 'TrendingDown';
    return 'Minus';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-elevation-2 transition-smooth"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
              <Icon name={icon} size={24} color="white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
            </div>
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          )}
          
          {/* {change && (
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 ${getChangeColor()}`}>
                <Icon name={getChangeIcon()} size={16} />
                <span className="text-sm font-medium">{change}</span>
              </div>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          )} */}
        </div>
      </div>
    </motion.div>
  );
};

export default MetricsCard;