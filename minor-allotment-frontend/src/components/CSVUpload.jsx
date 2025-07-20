import React, { useState } from 'react';
import { uploadCSV, runAllotment } from '../api';

const CSVUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return alert('Please select a CSV file');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadCSV(formData);
      setMessage('✅ CSV uploaded successfully!');
    } catch (err) {
      console.error(err);
      setMessage('❌ Upload failed');
    }
  };

  const handleAllotment = async () => {
    try {
      await runAllotment();
      setMessage('✅ Allotment process completed!');
    } catch (err) {
      console.error(err);
      setMessage('❌ Allotment failed');
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>📤 Upload CSV</h2>
      <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={handleAllotment} style={{ marginLeft: '1rem' }}>Run Allotment</button>
      <p>{message}</p>
    </div>
  );
};

export default CSVUpload;
