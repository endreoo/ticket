import { useState, useEffect } from 'react';
import { Mail, Paperclip, Calendar, User, Building, ChevronDown, ChevronUp } from 'lucide-react';
import DOMPurify from 'dompurify';

interface EmailViewProps {
  id: number;
  subject: string;
  fromEmail: string;
  message: string;
  htmlContent?: string;
  hasAttachments?: boolean;
  createdAt: string;
  hotelName?: string;
  onOpenTicket?: () => void;
  forceExpanded?: boolean;
  hideExpand?: boolean;
}

export function EmailView({ 
  id,
  subject, 
  fromEmail, 
  message, 
  htmlContent, 
  hasAttachments, 
  createdAt,
  hotelName,
  onOpenTicket,
  forceExpanded,
  hideExpand
}: EmailViewProps) {
  const [viewMode, setViewMode] = useState<'html' | 'text' | 'raw'>(htmlContent ? 'html' : 'text');
  const [isExpanded, setIsExpanded] = useState(forceExpanded || false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (forceExpanded) {
      setIsExpanded(true);
      setShowContent(true);
    }
  }, [forceExpanded]);

  useEffect(() => {
    // Update view mode when htmlContent changes
    if (htmlContent && viewMode === 'text') {
      setViewMode('html');
    } else if (!htmlContent && viewMode === 'html') {
      setViewMode('text');
    }
  }, [htmlContent]);

  const formattedMessage = message
    ? message
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : 'No content available';

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded) {
      setShowContent(true);
    }
  };
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
        !hideExpand ? 'cursor-pointer hover:border-blue-300' : ''
      } transition-all duration-200`}
      onClick={() => !hideExpand && onOpenTicket?.()}
    >
      {/* Email Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">#{id}</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              {subject}
              {hasAttachments && (
                <Paperclip className="h-4 w-4 text-gray-400" />
              )}
            </h1>
          </div>
          {!hideExpand && (
            <button 
              onClick={handleExpand}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        
        {/* Metadata */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>From: {fromEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{new Date(createdAt).toLocaleString()}</span>
          </div>
          {hotelName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              <span>Hotel: {hotelName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Email Body */}
      {(isExpanded || forceExpanded) && showContent && (
        <div className="p-6 border-t border-gray-100">
          <div className="mb-4 flex justify-end space-x-2">
            {htmlContent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('html');
                }}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'html' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                HTML
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('text');
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'text' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Plain Text
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('raw');
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'raw' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Raw
            </button>
          </div>
          
          <div className="prose prose-sm max-w-none">
            {viewMode === 'html' && htmlContent ? (
              <div 
                className="text-gray-800 email-content [&_a]:text-blue-600 [&_a]:underline [&_p]:my-2 
                [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4 
                [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2
                [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-4
                [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-3
                [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-2
                [&_pre]:bg-gray-50 [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:my-2
                [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:italic
                [&_.email-section]:mb-4 [&_.email-section]:border-b [&_.email-section]:border-gray-100 [&_.email-section]:pb-4
                whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(
                    htmlContent.replace(/\n{2,}/g, '</div><div class="email-section">')
                      .replace(/\n/g, '<br>')
                      .replace(/^/, '<div class="email-section">')
                      .replace(/$/, '</div>')
                  )
                }} 
              />
            ) : viewMode === 'raw' ? (
              <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-4 rounded-md overflow-x-auto">
                {message}
              </pre>
            ) : (
              <div className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
                {formattedMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 