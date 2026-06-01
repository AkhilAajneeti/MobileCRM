import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EmailComposer = ({ isOpen, onClose, onSend }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    template: '',
    signature: 'default',
    priority: 'normal',
    sendLater: false,
    scheduledDate: ''
  });

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const templateOptions = [
    { value: '', label: 'No Template' },
    { value: 'follow-up', label: 'Follow-up Email' },
    { value: 'introduction', label: 'Introduction Email' },
    { value: 'proposal', label: 'Proposal Email' },
    { value: 'meeting-request', label: 'Meeting Request' }
  ];

  const signatureOptions = [
    { value: 'default', label: 'Default Signature' },
    { value: 'professional', label: 'Professional Signature' },
    { value: 'none', label: 'No Signature' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSend = () => {
    if (emailData?.to && emailData?.subject && emailData?.body) {
      onSend(emailData);
      setEmailData({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        template: '',
        signature: 'default',
        priority: 'normal',
        sendLater: false,
        scheduledDate: ''
      });
      onClose();
    }
  };

  const handleTemplateSelect = (templateValue) => {
    const templates = {
      'follow-up': {
        subject: 'Following up on our conversation',
        body: `Hi there,\n\nI wanted to follow up on our recent conversation about [topic]. \n\nI'd love to continue our discussion and see how we can move forward.\n\nBest regards,`
      },
      'introduction': {
        subject: 'Introduction - [Your Name]',body: `Hello,\n\nI hope this email finds you well. I'm reaching out to introduce myself and explore potential opportunities for collaboration.\n\nI'd love to schedule a brief call to discuss how we might work together.\n\nBest regards,`
      },
      'proposal': {
        subject: 'Proposal for [Project Name]',
        body: `Dear [Name],\n\nThank you for your interest in our services. Please find attached our proposal for [project details].\n\nI'm happy to discuss any questions you might have.\n\nBest regards,`
      },
      'meeting-request': {
        subject: 'Meeting Request - [Topic]',
        body: `Hi [Name],\n\nI'd like to schedule a meeting to discuss [topic]. \n\nWould you be available for a 30-minute call this week? I'm flexible with timing.\n\nBest regards,`
      }
    };

    if (templates?.[templateValue]) {
      handleInputChange('subject', templates?.[templateValue]?.subject);
      handleInputChange('body', templates?.[templateValue]?.body);
    }
    handleInputChange('template', templateValue);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl shadow-elevation-2 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Mail" size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Compose Email</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="Minimize2" size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Email Template"
              options={templateOptions}
              value={emailData?.template}
              onChange={(value) => handleTemplateSelect(value)}
              placeholder="Choose a template"
            />
            <Select
              label="Priority"
              options={priorityOptions}
              value={emailData?.priority}
              onChange={(value) => handleInputChange('priority', value)}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Input
              label="To"
              type="email"
              placeholder="Enter recipient email addresses"
              value={emailData?.to}
              onChange={(e) => handleInputChange('to', e?.target?.value)}
              required
            />
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(!showCc)}
                className="text-muted-foreground"
              >
                Cc
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(!showBcc)}
                className="text-muted-foreground"
              >
                Bcc
              </Button>
            </div>

            {showCc && (
              <Input
                label="Cc"
                type="email"
                placeholder="Carbon copy recipients"
                value={emailData?.cc}
                onChange={(e) => handleInputChange('cc', e?.target?.value)}
              />
            )}

            {showBcc && (
              <Input
                label="Bcc"
                type="email"
                placeholder="Blind carbon copy recipients"
                value={emailData?.bcc}
                onChange={(e) => handleInputChange('bcc', e?.target?.value)}
              />
            )}
          </div>

          {/* Subject */}
          <Input
            label="Subject"
            type="text"
            placeholder="Email subject"
            value={emailData?.subject}
            onChange={(e) => handleInputChange('subject', e?.target?.value)}
            required
          />

          {/* Body */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Message</label>
            <div className="border border-border rounded-lg">
              {/* Toolbar */}
              <div className="flex items-center space-x-1 p-2 border-b border-border bg-muted/30">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon name="Bold" size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon name="Italic" size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon name="Underline" size={14} />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon name="List" size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon name="Link" size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon name="Paperclip" size={14} />
                </Button>
              </div>
              
              {/* Text Area */}
              <textarea
                className="w-full h-64 p-3 resize-none border-0 focus:outline-none focus:ring-0 bg-transparent"
                placeholder="Type your message here..."
                value={emailData?.body}
                onChange={(e) => handleInputChange('body', e?.target?.value)}
                required
              />
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Signature"
              options={signatureOptions}
              value={emailData?.signature}
              onChange={(value) => handleInputChange('signature', value)}
            />
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={emailData?.sendLater}
                  onChange={(e) => handleInputChange('sendLater', e?.target?.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">Schedule for later</span>
              </label>
              
              {emailData?.sendLater && (
                <Input
                  type="datetime-local"
                  value={emailData?.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e?.target?.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Icon name="Paperclip" size={16} className="mr-2" />
              Attach Files
            </Button>
            <Button variant="ghost" size="sm">
              <Icon name="Save" size={16} className="mr-2" />
              Save Draft
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSend}
              disabled={!emailData?.to || !emailData?.subject || !emailData?.body}
            >
              <Icon name="Send" size={16} className="mr-2" />
              {emailData?.sendLater ? 'Schedule Send' : 'Send Email'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;