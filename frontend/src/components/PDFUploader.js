import React, { useState, useEffect } from 'react';
import api from '../api'; // Use the configured Axios instance

const PDFUploader = ({ token, chatId }) => {
  const [files, setFiles] = useState([]); // Selected files to upload
  const [pdfList, setPdfList] = useState([]); // List of uploaded PDFs
  const [uploadStatus, setUploadStatus] = useState(''); // Status message
  const [loading, setLoading] = useState(false); // Loading state for uploads

  // Fetch the list of uploaded PDFs
  useEffect(() => {
    const fetchPDFs = async () => {
      if (!token) return;
      setLoading(true);
      setUploadStatus('');
      try {
        const res = await api.get('/api/pdf/list', {
          headers: { Authorization: `Bearer ${token}` },
          params: chatId ? { chatId } : {}, // Optionally filter by chatId
        });
        setPdfList(res.data);
      } catch (err) {
        console.error('Error fetching PDFs:', err);
        setUploadStatus('Failed to fetch PDFs. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPDFs();
  }, [token, chatId]);

  // Handle PDF upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('Please select at least one PDF file.');
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    for (let file of files) {
      if (file.size > maxSize) {
        setUploadStatus(`File ${file.name} is too large. Max size is 5MB.`);
        return;
      }
    }

    setLoading(true);
    setUploadStatus('Uploading...');

    try {
      // Upload each file using FormData
      for (let file of files) {
        const formData = new FormData();
        formData.append('pdf', file);
        if (chatId) {
          formData.append('chatId', chatId); // Associate with chatId if provided
        }

        await api.post('/api/pdf/upload', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Refresh the PDF list after upload
      const res = await api.get('/api/pdf/list', {
        headers: { Authorization: `Bearer ${token}` },
        params: chatId ? { chatId } : {},
      });
      setPdfList(res.data);
      setFiles([]);
      setUploadStatus('PDF(s) uploaded successfully!');
    } catch (err) {
      console.error('Error uploading PDF:', err);
      if (err.code === 'ECONNABORTED') {
        setUploadStatus('The server took too long to respond. Please try again.');
      } else if (err.response) {
        setUploadStatus(`Failed to upload PDF: ${err.response.data.msg || 'Server error'}`);
      } else if (err.request) {
        setUploadStatus('Unable to reach the server. Please check your internet connection.');
      } else {
        setUploadStatus('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
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
        disabled={loading}
      />
      <button
        onClick={handleUpload}
        className="bg-secondary text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {uploadStatus && (
        <p className={`mt-2 ${uploadStatus.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
          {uploadStatus}
        </p>
      )}
      <div className="mt-4 max-h-40 overflow-y-auto">
        {loading ? (
          <p>Loading PDFs...</p>
        ) : pdfList.length === 0 ? (
          <p>No PDFs uploaded yet.</p>
        ) : (
          pdfList.map((pdf) => (
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