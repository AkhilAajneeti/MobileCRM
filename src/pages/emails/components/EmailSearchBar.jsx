import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EmailSearchBar = ({ onSearch, onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: '',
    sender: '',
    account: '',
    hasAttachment: false,
    isRead: ''
  });

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  const readStatusOptions = [
    { value: '', label: 'All Emails' },
    { value: 'read', label: 'Read Only' },
    { value: 'unread', label: 'Unread Only' }
  ];

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateRange: '',
      sender: '',
      account: '',
      hasAttachment: false,
      isRead: ''
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    onSearch('');
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters)?.some(value => 
    value !== '' && value !== false
  ) || searchQuery;

  return (
    <div className="bg-background border-b border-border p-4 space-y-4">
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Icon name="Search" size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search emails by subject, sender, or content..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e?.target?.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex-shrink-0"
        >
          <Icon name="Filter" size={16} className="mr-2" />
          Filters
          {showAdvancedFilters && (
            <Icon name="ChevronUp" size={16} className="ml-2" />
          )}
          {!showAdvancedFilters && (
            <Icon name="ChevronDown" size={16} className="ml-2" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="flex-shrink-0 text-muted-foreground"
          >
            <Icon name="X" size={16} className="mr-2" />
            Clear
          </Button>
        )}
      </div>
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          <Select
            label="Date Range"
            options={dateRangeOptions}
            value={filters?.dateRange}
            onChange={(value) => handleFilterChange('dateRange', value)}
            placeholder="Select date range"
          />

          <Input
            label="Sender"
            type="text"
            placeholder="Filter by sender"
            value={filters?.sender}
            onChange={(e) => handleFilterChange('sender', e?.target?.value)}
          />

          <Input
            label="Account"
            type="text"
            placeholder="Filter by account"
            value={filters?.account}
            onChange={(e) => handleFilterChange('account', e?.target?.value)}
          />

          <Select
            label="Read Status"
            options={readStatusOptions}
            value={filters?.isRead}
            onChange={(value) => handleFilterChange('isRead', value)}
            placeholder="All emails"
          />
        </div>
      )}
      {/* Filter Tags */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              Search: "{searchQuery}"
              <button
                onClick={() => handleSearchChange('')}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}

          {filters?.dateRange && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full">
              {dateRangeOptions?.find(opt => opt?.value === filters?.dateRange)?.label}
              <button
                onClick={() => handleFilterChange('dateRange', '')}
                className="ml-1 hover:bg-accent/30 rounded-full p-0.5"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}

          {filters?.sender && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground rounded-full">
              Sender: {filters?.sender}
              <button
                onClick={() => handleFilterChange('sender', '')}
                className="ml-1 hover:bg-secondary/30 rounded-full p-0.5"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}

          {filters?.account && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-success/20 text-success-foreground rounded-full">
              Account: {filters?.account}
              <button
                onClick={() => handleFilterChange('account', '')}
                className="ml-1 hover:bg-success/30 rounded-full p-0.5"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}

          {filters?.isRead && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-warning/20 text-warning-foreground rounded-full">
              {readStatusOptions?.find(opt => opt?.value === filters?.isRead)?.label}
              <button
                onClick={() => handleFilterChange('isRead', '')}
                className="ml-1 hover:bg-warning/30 rounded-full p-0.5"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailSearchBar;