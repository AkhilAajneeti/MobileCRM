import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExportControls = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  const handleExport = async (type) => {
    setIsExporting(true);
    setExportType(type);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create and download mock file
    const timestamp = new Date()?.toISOString()?.split('T')?.[0];
    const filename = `crm-reports-${timestamp}.${type}`;
    
    if (type === 'csv') {
      const csvContent = `Report Type,Value,Date\nConversion Rate,13.2%,${timestamp}\nWin Rate,72.4%,${timestamp}\nRevenue,1680000,${timestamp}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL?.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a?.click();
      window.URL?.revokeObjectURL(url);
    } else if (type === 'png') {
      // For PNG export, we would typically use html2canvas or similar
      // This is a mock implementation
      console.log('PNG export would capture charts as images');
    }
    
    setIsExporting(false);
    setExportType(null);
  };

  const exportOptions = [
    {
      type: 'csv',
      label: 'Export CSV',
      description: 'Download data as spreadsheet',
      icon: 'FileSpreadsheet',
      color: 'text-success'
    },
    {
      type: 'png',
      label: 'Export PNG',
      description: 'Download charts as images',
      icon: 'Image',
      color: 'text-primary'
    },
    {
      type: 'pdf',
      label: 'Export PDF',
      description: 'Generate full report',
      icon: 'FileText',
      color: 'text-error'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
          <Icon name="Download" size={20} className="text-accent-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Export Reports</h3>
          <p className="text-sm text-muted-foreground">Download your analytics data</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {exportOptions?.map((option) => (
          <motion.div
            key={option?.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              onClick={() => handleExport(option?.type)}
              loading={isExporting && exportType === option?.type}
              disabled={isExporting}
              className="w-full h-auto p-4 flex-col space-y-2"
            >
              <Icon 
                name={option?.icon} 
                size={24} 
                className={option?.color}
              />
              <div className="text-center">
                <p className="font-medium text-foreground">{option?.label}</p>
                <p className="text-xs text-muted-foreground">{option?.description}</p>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={16} className="text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-1">
              <strong>CSV:</strong> Raw data for further analysis in Excel or Google Sheets
            </p>
            <p className="mb-1">
              <strong>PNG:</strong> High-resolution chart images for presentations
            </p>
            <p>
              <strong>PDF:</strong> Complete formatted report with all visualizations
            </p>
          </div>
        </div>
      </div>
      {isExporting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-muted rounded-lg flex items-center space-x-3"
        >
          <div className="animate-spin">
            <Icon name="Loader2" size={16} className="text-primary" />
          </div>
          <span className="text-sm text-foreground">
            Preparing your {exportType?.toUpperCase()} export...
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ExportControls;