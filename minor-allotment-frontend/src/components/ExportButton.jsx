import React, { useState } from 'react';

const ExportButton = () => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Updated URL to match your backend route
      const response = await fetch('http://localhost:5000/export/docx-template', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Get error details from response
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      // Check if response is JSON (multiple files) or binary (single file)
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Multiple files generated - show list
        const result = await response.json();
        console.log('Generated files:', result);
        alert(`✅ Generated ${result.files.length} files:\n${result.files.map(f => f.filename).join('\n')}`);
      } else {
        // Single file - download it
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from Content-Disposition header or use default
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'allotment_list.docx';
        if (disposition && disposition.includes('filename=')) {
          filename = disposition.split('filename=')[1].replace(/['"]/g, '');
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        alert('✅ File downloaded successfully!');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert(`❌ Download failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <button 
        onClick={handleDownload} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          marginBottom : '3rem',
          
        }}
      >
        {loading ? '⏳ Generating...' : '📥 Download Allotment List (.docx)'}
      </button>
    </div>
  );
};

export default ExportButton;