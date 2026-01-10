import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Send,
  User,
  Building2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  FileText
} from 'lucide-react';
import { leadsService, outreachService } from '../../services/leads.service';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant, getStatusLabel } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import type { LeadEmail, Business, Conversation, Message, EmailTemplate } from '../../types/leads.types';

export const ContactEmailsPage: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();

  // State
  const [contact, setContact] = useState<LeadEmail | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [_conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compose state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!contactId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await leadsService.getContactMessages(parseInt(contactId, 10));
      setContact(response.contact);
      setBusiness(response.business);
      setConversation(response.conversation);
      setMessages(response.messages);
      setTemplates(response.templates);

      // Auto-open compose if no messages and contact is NEW
      if (response.messages.length === 0 && response.contact.email_status === 'NEW') {
        setIsComposeOpen(true);
        // Pre-fill with template if available
        const newTemplate = response.templates.find(t => t.template_type === 'NEW');
        if (newTemplate) {
          setComposeSubject(newTemplate.subject);
          setComposeBody(newTemplate.body + (newTemplate.signature ? '\n\n' + newTemplate.signature : ''));
          setSelectedTemplateId(newTemplate.id);
        }
      } else if (response.messages.length > 0) {
        // ISSUE 3 FIX: Auto-populate subject for replies from first message in conversation
        // Get the first outbound message's subject (original thread subject)
        const firstOutboundMessage = response.messages.find(m => m.direction === 'outbound');
        if (firstOutboundMessage && firstOutboundMessage.subject) {
          // Add "Re: " prefix if not already there
          const originalSubject = firstOutboundMessage.subject;
          const replySubject = originalSubject.startsWith('Re: ') 
            ? originalSubject 
            : `Re: ${originalSubject}`;
          setComposeSubject(replySubject);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact emails');
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle template selection - Support unselecting template with reset
  const handleTemplateChange = (templateIdStr: string) => {
    // If empty string (custom email selected), clear template and reset fields
    if (!templateIdStr) {
      setSelectedTemplateId(null);
      setComposeSubject('');
      setComposeBody('');
      return;
    }

    const templateId = parseInt(templateIdStr, 10);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Replace tokens with actual values
      let subject = template.subject;
      let body = template.body;
      const signature = template.signature || '';

      // Replace tokens
      const contactName = contact?.contact_name || 'Valued Customer';
      const businessName = business?.business_name || 'Your Business';

      subject = subject.replace(/\{\{lead_email\.contactName\}\}/g, contactName);
      subject = subject.replace(/\{\{business\.businessName\}\}/g, businessName);

      body = body.replace(/\{\{lead_email\.contactName\}\}/g, contactName);
      body = body.replace(/\{\{business\.businessName\}\}/g, businessName);

      const fullSignature = signature
        .replace(/\{\{lead_email\.contactName\}\}/g, contactName)
        .replace(/\{\{business\.businessName\}\}/g, businessName);

      setComposeSubject(subject);
      setComposeBody(body + (fullSignature ? '\n\n' + fullSignature : ''));
      setSelectedTemplateId(templateId);
    }
  };

  // Handle send email
  const handleSendEmail = async () => {
    if (!contact || !composeSubject.trim() || !composeBody.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a subject and message body',
      });
      return;
    }

    setIsSending(true);

    try {
      await outreachService.sendEmail({
        lead_email_id: contact.id,
        subject: composeSubject,
        body: composeBody,
        template_id: selectedTemplateId || undefined,
      });

      addToast({
        type: 'success',
        title: 'Email Sent!',
        message: `Email sent to ${contact.email}`,
      });

      // Reset compose form
      setComposeSubject('');
      setComposeBody('');
      setSelectedTemplateId(null);
      setIsComposeOpen(false);

      // Refresh data
      await fetchData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to Send',
        message: err instanceof Error ? err.message : 'Failed to send email',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="contact-emails-page">
        <div className="contact-emails-loading">
          <Loader2 size={32} className="spinning" />
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !contact) {
    return (
      <div className="contact-emails-page">
        <div className="contact-emails-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
        <Alert type="error" message={error || 'Contact not found'} />
      </div>
    );
  }

  return (
    <div className="contact-emails-page">
      {/* Header */}
      <div className="contact-emails-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back to Leads</span>
        </button>

        <div className="contact-info-card">
          <div className="contact-avatar">
            <User size={24} />
          </div>
          <div className="contact-details">
            <div className="contact-name-row">
              <h1>{contact.contact_name || 'Unknown Contact'}</h1>
              <Badge variant={getStatusBadgeVariant(contact.email_status)}>
                {getStatusLabel(contact.email_status)}
              </Badge>
              {contact.email_status === 'IN_PROGRESS' && (
                <span className="needs-reply-tag">
                  <AlertCircle size={14} />
                  Needs Reply
                </span>
              )}
            </div>
            <div className="contact-meta">
              <span className="contact-email">
                <Mail size={14} />
                {contact.email}
              </span>
              {business && (
                <span className="contact-business">
                  <Building2 size={14} />
                  {business.business_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="contact-emails-content">
        {/* Messages Thread */}
        <div className="messages-thread">
          {messages.length === 0 ? (
            <div className="no-messages">
              <Mail size={48} />
              <h3>No messages yet</h3>
              <p>Start the conversation by sending an email below.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message-card ${message.direction}`}
              >
                <div className="message-header">
                  <div className="message-sender">
                    {message.direction === 'outbound' ? (
                      <>
                        <div className="sender-avatar outbound">
                          <Send size={14} />
                        </div>
                        <span>You</span>
                      </>
                    ) : (
                      <>
                        <div className="sender-avatar inbound">
                          <User size={14} />
                        </div>
                        <span>{message.contact_name || contact.contact_name || 'Contact'}</span>
                      </>
                    )}
                  </div>
                  <div className="message-time">
                    <Clock size={12} />
                    {formatDate(message.created_at)}
                  </div>
                </div>

                <div className="message-subject">
                  <strong>Subject:</strong> {message.subject || '(No subject)'}
                </div>

                <div className="message-body">
                  {message.body}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Compose Section */}
        <div className={`compose-section ${isComposeOpen ? 'open' : ''}`}>
          <button
            className="compose-toggle"
            onClick={() => setIsComposeOpen(!isComposeOpen)}
          >
            <Send size={18} />
            <span>{messages.length === 0 ? 'Compose Email' : 'Reply'}</span>
            <ChevronDown size={18} className={isComposeOpen ? 'rotated' : ''} />
          </button>

          {isComposeOpen && (
            <div className="compose-form">
              {/* Template Selector - ISSUE 2 FIX: Allow unselecting */}
              {templates.length > 0 && (
                <div className="template-selector">
                  <label>
                    <FileText size={14} />
                    Use Template:
                  </label>
                  <select
                    value={selectedTemplateId || ''}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                  >
                    <option value="">-- No template (custom email) --</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.template_type} - {template.subject.slice(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div className="compose-field">
                <label htmlFor="subject">Subject</label>
                <input
                  id="subject"
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>

              {/* Body */}
              <div className="compose-field">
                <label htmlFor="body">Message</label>
                <textarea
                  id="body"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Type your message..."
                  rows={8}
                />
              </div>

              {/* Actions */}
              <div className="compose-actions">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setIsComposeOpen(false);
                    setComposeSubject('');
                    setComposeBody('');
                    setSelectedTemplateId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendEmail}
                  disabled={isSending || !composeSubject.trim() || !composeBody.trim()}
                  isLoading={isSending}
                >
                  <Send size={16} />
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

