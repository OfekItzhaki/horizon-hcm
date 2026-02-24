import { useState } from 'react';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateFilename = (baseName: string, format: string) => {
    const date = new Date().toISOString().split('T')[0];
    const buildingName = 'building'; // Could fetch from store if needed
    return `${baseName}_${buildingName}_${date}.${format}`;
  };

  const exportToExcel = async (data: any, filename: string) => {
    setIsExporting(true);
    setProgress(0);

    try {
      // Simulate progress
      setProgress(30);

      // In a real implementation, you would use a library like xlsx or SheetJS
      // For now, we'll create a simple CSV that Excel can open
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

      setProgress(70);
      downloadBlob(blob, generateFilename(filename, 'csv'));
      setProgress(100);
    } catch (error) {
      console.error('Export to Excel failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  const exportToPDF = async (elementId: string, _filename: string) => {
    setIsExporting(true);
    setProgress(0);

    try {
      setProgress(30);

      // In a real implementation, you would use a library like jsPDF or html2pdf
      // For now, we'll use the browser's print functionality
      const element = document.getElementById(elementId);
      if (element) {
        window.print();
      }

      setProgress(100);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  const exportToCSV = async (data: any[], filename: string) => {
    setIsExporting(true);
    setProgress(0);

    try {
      setProgress(30);

      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

      setProgress(70);
      downloadBlob(blob, generateFilename(filename, 'csv'));
      setProgress(100);
    } catch (error) {
      console.error('Export to CSV failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    isExporting,
    progress,
  };
};
