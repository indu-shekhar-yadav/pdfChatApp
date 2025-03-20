// frontend/src/components/PDFUploader.js
import React, { useState, useEffect } from 'react';
import api from '../api';

const PDFUploader = ({ token, chatId }) => {
  const [files, setFiles] = useState([]);
  const [pdfList, setPdfList] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPDFs = async () => {
      if (!token) return;
      setLoading(true);
      setUploadStatus('');
      try {
        const res = await api.get('/api/pdf/list', {
          headers: { Authorization: `Bearer ${token}` },
          params: chatId ? { chatId } : {},
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

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('Please select at least one PDF file.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    for (let file of files) {
      if (file.size > maxSize) {
        setUploadStatus(`File ${file.name} is too large. Max size is 10MB.`);
        return;
      }
    }

    setLoading(true);
    setUploadStatus('Uploading...');

    try {
      for (let file of files) {
        const formData = new FormData();
        formData.append('pdf', file);
        if (chatId) {
          formData.append('chatId', chatId);
        }

        await api.post('/api/pdf/upload', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

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
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Upload PDFs</h2>
      <div className="flex items-center space-x-3 mb-3">
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={(e) => setFiles(Array.from(e.target.files))}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
          disabled={loading}
        />
        <button
          onClick={handleUpload}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Upload any number of PDFs (Size limit: 10MB each).
      </p>
      {uploadStatus && (
        <p
          className={`mb-3 text-sm ${
            uploadStatus.includes('successfully') ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {uploadStatus}
        </p>
      )}
      <div className="max-h-40 overflow-y-auto">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading PDFs...</p>
        ) : pdfList.length === 0 ? (
          <p className="text-gray-500 text-sm">No PDFs uploaded yet.</p>
        ) : (
          pdfList.map((pdf) => (
            <div
              key={pdf._id}
              className="p-2 bg-gray-50 rounded mb-2 text-sm text-gray-700"
            >
              {pdf.filename} - {new Date(pdf.uploadedAt).toLocaleDateString()}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PDFUploader;