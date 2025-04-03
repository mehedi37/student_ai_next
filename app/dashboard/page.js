'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/context/AuthContext';
import { SessionProvider } from '@/components/context/SessionContext';
import ChatInterface from '@/components/ChatInterface';
import SessionList from '@/components/SessionList';
import AlertMessage from '@/components/AlertMessage';
import Link from 'next/link';
import {
  FileText, Upload, BookOpen, Clock,
  MessageSquare, AlertCircle, X
} from 'lucide-react';
import { api } from '@/utils/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Alert states
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Load documents when the user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      loadDocuments();
    }
  }, [user, isLoading]);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await api.uploads.documents();

      if (response && Array.isArray(response)) {
        setDocuments(response);
      } else if (response && Array.isArray(response.documents)) {
        setDocuments(response.documents);
      } else {
        console.warn('Unexpected document response format:', response);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleSessionSelect = (session) => {
    setActiveSession(session);
  };

  const createNewSession = () => {
    setActiveSession(null);
  };

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    // Auto-hide after 5 seconds
    setTimeout(() => setShowAlert(false), 5000);
  };

  const showConfirmDialog = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirm(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirm(false);
  };

  // Loading state for the whole page
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <div className="mb-6">
          <div className="skeleton h-10 w-1/4 mb-2"></div>
          <div className="skeleton h-4 w-2/3"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card bg-base-200">
              <div className="card-body p-4">
                <div className="skeleton h-8 w-3/4 mb-2"></div>
                <div className="skeleton h-4 w-full"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card bg-base-200 flex-1">
              <div className="card-body p-4">
                <div className="skeleton h-[600px] w-full"></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="skeleton h-8 w-2/3 mb-4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-12 w-full"></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="skeleton h-8 w-2/3 mb-4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-12 w-full"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="container mx-auto p-4 lg:p-6">
        {/* Alert Component */}
        <AlertMessage
          message={alertMessage}
          show={showAlert}
          onClose={() => setShowAlert(false)}
        />

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="font-bold text-lg mb-4">Confirm Action</h3>
                <p>{confirmMessage}</p>
                <div className="modal-action mt-6">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={handleConfirmAction}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard header */}
        <div className="mb-6">
          <p className="text-base-content/70">
            Hi from <span className="text-3xl text-primary"> 👋 "হাট্টিমাটিম_Team"</span>
          </p>
        </div>

        {/* Quick actions section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          <Link href="/upload" className="card bg-base-100 shadow hover:shadow-lg">
            <div className="card-body p-4">
              <h2 className="card-title text-lg">
                <Upload className="h-5 w-5 text-primary" />
                Upload Document
              </h2>
              <p className="text-sm">Add study materials to enhance your learning</p>
            </div>
          </Link>

          <Link href="/quizzes" className="card bg-base-100 shadow hover:shadow-lg">
            <div className="card-body p-4">
              <h2 className="card-title text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                Take a Quiz
              </h2>
              <p className="text-sm">Test your knowledge with interactive quizzes</p>
            </div>
          </Link>

          <button
            onClick={createNewSession}
            className="card bg-base-100 shadow hover:shadow-lg"
          >
            <div className="card-body p-4">
              <h2 className="card-title text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                New Chat
              </h2>
              <p className="text-sm">Start a new learning conversation</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Chat interface */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl flex-1">
              <div className="card-body p-4 flex flex-col h-[600px] overflow-hidden">
                <ChatInterface user={user} session={activeSession} />
              </div>
            </div>
          </div>

          {/* Right column: Sessions and documents */}
          <div className="space-y-6">
            {/* Sessions */}
            <SessionList onSessionSelect={handleSessionSelect} />

            {/* Documents */}
            <div className="collapse collapse-arrow bg-base-100 shadow-xl">
              <input type="checkbox" defaultChecked={true} />
              <div className="collapse-title flex items-center p-4">
                <h2 className="text-lg font-semibold">Recent Documents</h2>
              </div>
              <div className="collapse-content px-4 pb-4">
                <div className="flex justify-end mb-2">
                  <Link href="/upload" className="btn btn-primary btn-sm btn-outline">
                    Upload
                  </Link>
                </div>

                {isLoadingDocs ? (
                  <div className="space-y-2 py-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="skeleton h-10 w-full"></div>
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm">No documents uploaded yet</p>
                    <Link href="/upload" className="btn btn-primary btn-sm mt-3">
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Documents
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {documents.slice(0, 5).map((doc) => {
                      const docId = doc.document_id;
                      if (!docId) return null;

                      const docType = doc.source_type || 'file';
                      const docIcon =
                        docType.toLowerCase() === 'youtube' ? (
                          <BookOpen className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        );

                      return (
                        <li
                          key={docId}
                          className="p-2 bg-base-200 rounded-lg flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            {docIcon}
                            <span className="truncate max-w-[150px]">
                              {doc.title || `Document ${docId.substring(0, 8)}`}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs flex items-center opacity-70">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(doc.created_at || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {documents.length > 5 && (
                  <div className="card-actions justify-center mt-3">
                    <Link href="/documents" className="btn btn-ghost btn-sm">
                      View All Documents
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}