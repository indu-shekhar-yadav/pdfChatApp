import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PDFUploader = ({ token }) => {
  const [files, setFiles] = useState([]);
  const [pdfList, setPdfList] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/pdf/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPdfList(res.data);
      } catch (err) {
        console.error('Error fetching PDFs:', err.response?.data || err.message);
      }
    };
    if (token) fetchPDFs();
  }, [token]);

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('Please select at least one PDF file.');
      return;
    }

    // Check file size (e.g., max 5MB before base64 encoding)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    for (let file of files) {
      if (file.size > maxSize) {
        setUploadStatus(`File ${file.name} is too large. Max size is 5MB.`);
        return;
      }
    }

    setUploadStatus('Uploading...');
    try {
      for (let file of files) {
        const reader = new FileReader();
        const base64Data = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await axios.post('http://localhost:5000/api/pdf/upload', {
          filename: file.name,
          data: base64Data,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const res = await axios.get('http://localhost:5000/api/pdf/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPdfList(res.data);
      setFiles([]);
      setUploadStatus('PDF(s) uploaded successfully!');
    } catch (err) {
      console.error('Error uploading PDF:', err.response?.data || err.message);
      setUploadStatus('Failed to upload PDF: ' + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full">
      <h2 className="text-xl font-semibold text-primary mb-4">Upload PDFs</h2>
      <input
        type="file"
        multiple
        accept=".pdf"
        onChange={(e) => setFiles(Array.from(e.target.files))}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-secondary text-white px-4 py-2 rounded hover:bg-emerald-700"
      >
        Upload
      </button>
      {uploadStatus && (
        <p className={`mt-2 ${uploadStatus.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
          {uploadStatus}
        </p>
      )}
      <div className="mt-4 max-h-40 overflow-y-auto">
        {pdfList.length === 0 ? (
          <p>No PDFs uploaded yet.</p>
        ) : (
          pdfList.map(pdf => (
            <div key={pdf._id} className="p-2 bg-gray-100 rounded mb-2">
              {pdf.filename} - {new Date(pdf.uploadedAt).toLocaleDateString()}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PDFUploader;