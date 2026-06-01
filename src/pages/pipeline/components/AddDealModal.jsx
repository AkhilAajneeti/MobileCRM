import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AddDealModal = ({ isOpen, onClose, onSave, initialStage = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    accountName: '',
    value: '',
    owner: '',
    closeDate: '',
    priority: 'Medium',
    probability: '50',
    stage: initialStage || 'new',
    description: '',
    tags: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stageOptions = [
    { value: 'new', label: 'New' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' }
  ];

  const ownerOptions = [
    { value: 'john-doe', label: 'John Doe' },
    { value: 'sarah-wilson', label: 'Sarah Wilson' },
    { value: 'mike-johnson', label: 'Mike Johnson' },
    { value: 'emily-davis', label: 'Emily Davis' },
    { value: 'alex-chen', label: 'Alex Chen' }
  ];

  const priorityOptions = [
    { value: 'High', label: 'High Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'Low', label: 'Low Priority' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.title?.trim()) {
      newErrors.title = 'Deal title is required';
    }

    if (!formData?.accountName?.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    if (!formData?.value || parseFloat(formData?.value) <= 0) {
      newErrors.value = 'Deal value must be greater than 0';
    }

    if (!formData?.owner) {
      newErrors.owner = 'Deal owner is required';
    }

    if (!formData?.closeDate) {
      newErrors.closeDate = 'Close date is required';
    } else {
      const closeDate = new Date(formData.closeDate);
      const today = new Date();
      today?.setHours(0, 0, 0, 0);
      
      if (closeDate < today) {
        newErrors.closeDate = 'Close date cannot be in the past';
      }
    }

    const probability = parseFloat(formData?.probability);
    if (isNaN(probability) || probability < 0 || probability > 100) {
      newErrors.probability = 'Probability must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newDeal = {
        id: `deal-${Date.now()}`,
        title: formData?.title?.trim(),
        accountName: formData?.accountName?.trim(),
        value: parseFloat(formData?.value),
        owner: {
          id: formData?.owner,
          name: ownerOptions?.find(o => o?.value === formData?.owner)?.label || '',
          avatar: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50)}.jpg`,
          avatarAlt: `Professional headshot of ${ownerOptions?.find(o => o?.value === formData?.owner)?.label || 'team member'}`
        },
        closeDate: formData?.closeDate,
        priority: formData?.priority,
        probability: parseFloat(formData?.probability),
        stage: formData?.stage,
        description: formData?.description?.trim(),
        tags: formData?.tags ? formData?.tags?.split(',')?.map(tag => tag?.trim())?.filter(Boolean) : [],
        createdAt: new Date()?.toISOString(),
        updatedAt: new Date()?.toISOString()
      };

      onSave(newDeal);
      handleClose();
    } catch (error) {
      console.error('Error creating deal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      accountName: '',
      value: '',
      owner: '',
      closeDate: '',
      priority: 'Medium',
      probability: '50',
      stage: initialStage || 'new',
      description: '',
      tags: ''
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background border border-border rounded-xl shadow-elevation-2 w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Plus" size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Add New Deal</h2>
                <p className="text-sm text-muted-foreground">Create a new sales opportunity</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close modal"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Deal Title"
                  type="text"
                  placeholder="Enter deal title"
                  value={formData?.title}
                  onChange={(e) => handleInputChange('title', e?.target?.value)}
                  error={errors?.title}
                  required
                />
                
                <Input
                  label="Account Name"
                  type="text"
                  placeholder="Enter account name"
                  value={formData?.accountName}
                  onChange={(e) => handleInputChange('accountName', e?.target?.value)}
                  error={errors?.accountName}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Deal Value"
                  type="number"
                  placeholder="0"
                  value={formData?.value}
                  onChange={(e) => handleInputChange('value', e?.target?.value)}
                  error={errors?.value}
                  min="0"
                  step="1000"
                  required
                />
                
                <Select
                  label="Deal Owner"
                  placeholder="Select owner"
                  options={ownerOptions}
                  value={formData?.owner}
                  onChange={(value) => handleInputChange('owner', value)}
                  error={errors?.owner}
                  required
                />
              </div>
            </div>

            {/* Deal Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Deal Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Close Date"
                  type="date"
                  value={formData?.closeDate}
                  onChange={(e) => handleInputChange('closeDate', e?.target?.value)}
                  error={errors?.closeDate}
                  required
                />
                
                <Select
                  label="Priority"
                  options={priorityOptions}
                  value={formData?.priority}
                  onChange={(value) => handleInputChange('priority', value)}
                />
                
                <Input
                  label="Probability (%)"
                  type="number"
                  placeholder="50"
                  value={formData?.probability}
                  onChange={(e) => handleInputChange('probability', e?.target?.value)}
                  error={errors?.probability}
                  min="0"
                  max="100"
                />
              </div>

              <Select
                label="Pipeline Stage"
                options={stageOptions}
                value={formData?.stage}
                onChange={(value) => handleInputChange('stage', value)}
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Additional Information</h3>
              
              <Input
                label="Description"
                type="text"
                placeholder="Enter deal description (optional)"
                value={formData?.description}
                onChange={(e) => handleInputChange('description', e?.target?.value)}
              />
              
              <Input
                label="Tags"
                type="text"
                placeholder="Enter tags separated by commas"
                description="e.g., enterprise, urgent, renewal"
                value={formData?.tags}
                onChange={(e) => handleInputChange('tags', e?.target?.value)}
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/30">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              loading={isSubmitting}
              iconName="Plus"
              iconPosition="left"
              iconSize={16}
            >
              {isSubmitting ? 'Creating Deal...' : 'Create Deal'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddDealModal;