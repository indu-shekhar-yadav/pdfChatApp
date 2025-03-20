// // frontend/src/components/Chat.js
// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';

// const Chat = ({ token, currentChat, setCurrentChat, setChats, chats }) => {
//   const [message, setMessage] = useState('');
//   const [files, setFiles] = useState([]);
//   const [pdfList, setPdfList] = useState([]);
//   const [uploadStatus, setUploadStatus] = useState('');
//   const [loading, setLoading] = useState(false); // New state for loading indicator
//   const fileInputRef = useRef(null);

//   useEffect(() => {
//     setFiles([]);
//     setPdfList([]);
//     setUploadStatus('');
//     setMessage('');
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }

//     const fetchPDFs = async () => {
//       if (!currentChat) return;
//       try {
//         const res = await axios.get('http://localhost:5000/api/pdf/list', {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { chatId: currentChat._id },
//         });
//         setPdfList(res.data);
//       } catch (err) {
//         console.error('Error fetching PDFs:', err.response?.data || err.message);
//       }
//     };
//     fetchPDFs();
//   }, [currentChat, token]);

//   const handleUpload = async () => {
//     if (!currentChat) return;
//     if (files.length === 0) {
//       setUploadStatus('Please select at least one PDF file.');
//       return;
//     }

//     const maxSize = 5 * 1024 * 1024; // 5MB
//     for (let file of files) {
//       if (file.size > maxSize) {
//         setUploadStatus(`File ${file.name} is too large. Max size is 5MB.`);
//         return;
//       }
//     }

//     setUploadStatus('Uploading...');
//     try {
//       for (let file of files) {
//         const reader = new FileReader();
//         const base64Data = await new Promise((resolve, reject) => {
//           reader.onload = () => resolve(reader.result.split(',')[1]);
//           reader.onerror = reject;
//           reader.readAsDataURL(file);
//         });

//         await axios.post('http://localhost:5000/api/pdf/upload', {
//           filename: file.name,
//           data: base64Data,
//           chatId: currentChat._id,
//         }, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       const res = await axios.get('http://localhost:5000/api/pdf/list', {
//         headers: { Authorization: `Bearer ${token}` },
//         params: { chatId: currentChat._id },
//       });
//       setPdfList(res.data);
//       setFiles([]);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       setUploadStatus('PDF(s) uploaded successfully!');
//     } catch (err) {
//       console.error('Error uploading PDF:', err.response?.data || err.message);
//       setUploadStatus('Failed to upload PDF: ' + (err.response?.data?.msg || err.message));
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!currentChat || !message || loading) return; // Prevent sending if already loading
//     setLoading(true); // Show loading indicator
//     try {
//       const res = await axios.post('http://localhost:5000/api/chat/message', {
//         chatId: currentChat._id,
//         message,
//       }, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCurrentChat(res.data);
//       setChats(chats.map(chat => (chat._id === res.data._id ? res.data : chat)));
//       setMessage('');
//     } catch (err) {
//       console.error('Error sending message:', err.response?.data || err.message);
//     } finally {
//       setLoading(false); // Hide loading indicator
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, allow new line with Shift + Enter
//       e.preventDefault(); // Prevent default Enter behavior (e.g., adding a new line)
//       handleSendMessage();
//     }
//   };

//   return (
//     <div className="flex-1 flex flex-col gap-4">
//       {!currentChat ? (
//         <div className="flex-1 flex items-center justify-center">
//           <p className="text-gray-500">Start a new chat to begin!</p>
//         </div>
//       ) : (
//         <>
//           {/* PDF Uploader */}
//           <div className="bg-white p-4 rounded-lg shadow-lg">
//             <h2 className="text-lg font-semibold text-primary mb-2">Upload PDFs for this Chat</h2>
//             <input
//               type="file"
//               multiple
//               accept=".pdf"
//               ref={fileInputRef}
//               onChange={(e) => setFiles(Array.from(e.target.files))}
//               className="mb-2"
//             />
//             <button
//               onClick={handleUpload}
//               className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
//             >
//               Upload
//             </button>
//             {uploadStatus && (
//               <p className={`mt-2 ${uploadStatus.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
//                 {uploadStatus}
//               </p>
//             )}
//             <div className="mt-2 max-h-32 overflow-y-auto">
//               {pdfList.length === 0 ? (
//                 <p>No PDFs uploaded for this chat.</p>
//               ) : (
//                 pdfList.map(pdf => (
//                   <div key={pdf._id} className="p-1 bg-gray-100 rounded mb-1">
//                     {pdf.filename}
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Chat Area */}
//           <div className="flex-1 bg-white p-4 rounded-lg shadow-lg flex flex-col">
//             <div className="flex-1 overflow-y-auto mb-4">
//               {currentChat.messages.map((msg, idx) => (
//                 <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
//                   <div className={`inline-block p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
//                     {msg.role === 'assistant' ? (
//                       <ul className="list-disc list-inside space-y-1">
//                         {msg.content.split('\n').map((line, index) => {
//                           const cleanLine = line.replace(/^- /, '').trim();
//                           return cleanLine ? <li key={index}>{cleanLine}</li> : null;
//                         })}
//                       </ul>
//                     ) : (
//                       <p>{msg.content}</p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 onKeyDown={handleKeyDown} // Add keydown handler for Enter key
//                 placeholder="Ask a question about the PDFs..."
//                 className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <button
//                 onClick={handleSendMessage}
//                 className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
//                 disabled={loading} // Disable button while loading
//               >
//                 {loading ? (
//                   <svg
//                     className="animate-spin h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                 ) : (
//                   'Send'
//                 )}
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Chat;