import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActions = ({ selectedCount, onExport, onBulkEmail, onBulkTag, onBulkDelete,onMassUpdate }) => {
  const [showActions, setShowActions] = useState(false);

  if (selectedCount === 0) return null;

  const tagOptions = [
    { value: 'hot-lead', label: 'Hot Lead' },
    { value: 'decision-maker', label: 'Decision Maker' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'high-value', label: 'High Value' },
    { value: 'follow-up', label: 'Follow Up' },
    { value: 'qualified', label: 'Qualified' }
  ];

  const handleBulkTag = (tagValue) => {
    const selectedTag = tagOptions?.find(tag => tag?.value === tagValue);
    if (selectedTag) {
      onBulkTag(selectedTag?.label);
    }
  };

  return (
    <div className="bg-primary text-primary-foreground px-6 py-4 rounded-xl mb-6 shadow-elevation-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <Icon name="CheckSquare" size={16} className="text-primary-foreground" />
          </div>
          <span className="font-medium">
            {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-primary-foreground/30"
          >
            <Icon name="Download" size={16} className="mr-2" />
            Export
          </Button>

          {/* Bulk Email */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkEmail}
            className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-primary-foreground/30"
          >
            <Icon name="Mail" size={16} className="mr-2" />
            Send Email
          </Button>

          {/* More Actions */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-primary-foreground/30"
            >
              More
              <Icon name="ChevronDown" size={14} className="ml-1" />
            </Button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-elevation-2 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                         onMassUpdate();
                        setShowActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                    >
                      <Icon name="UserPlus" size={16} className="mr-3" />
                      Mass Update
                    </button>
                    
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => {
                        onBulkDelete();
                        setShowActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-smooth"
                    >
                      <Icon name="Trash2" size={16} className="mr-3" />
                      Delete Contacts
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;