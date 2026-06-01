import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import EmailConnectionCard from './components/EmailConnectionCard';
import EmailThreadItem from './components/EmailThreadItem';
import EmailComposer from './components/EmailComposer';
import EmailSearchBar from './components/EmailSearchBar';
import EmailStats from './components/EmailStats';

const EmailsPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [connectedAccounts, setConnectedAccounts] = useState({
    gmail: false,
    outlook: false
  });

  // Mock email data
  const mockEmails = [
    {
      id: 1,
      sender: "Sarah Johnson",
      senderEmail: "sarah.johnson@techcorp.com",
      account: "TechCorp Solutions",
      subject: "Q4 Budget Review Meeting",
      preview: "Hi team, I'd like to schedule our quarterly budget review meeting for next week. Please let me know your availability for Tuesday or Wednesday afternoon.",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      hasAttachment: true,
      labels: ["Important", "Budget"],
      body: `Hi team,\n\nI'd like to schedule our quarterly budget review meeting for next week. Please let me know your availability for Tuesday or Wednesday afternoon.\n\nWe'll be covering:\n- Q4 spending analysis\n- 2025 budget planning\n- Resource allocation\n\nPlease come prepared with your department reports.\n\nBest regards,\nSarah`
    },
    {
      id: 2,
      sender: "Michael Chen",
      senderEmail: "m.chen@innovatetech.com",
      account: "InnovateTech Inc",
      subject: "Project Proposal - CRM Integration",
      preview: "Thank you for your interest in our CRM integration services. I\'ve attached a detailed proposal outlining our approach and timeline.",
      date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isRead: true,
      hasAttachment: true,
      labels: ["Proposal"],
      body: `Dear Team,\n\nThank you for your interest in our CRM integration services. I've attached a detailed proposal outlining our approach and timeline.\n\nKey highlights:\n- 6-week implementation timeline\n- Full data migration support\n- 24/7 technical support\n- Training for your team\n\nI'm available for a call this week to discuss any questions.\n\nBest regards,\nMichael Chen`
    },
    {
      id: 3,
      sender: "Emily Rodriguez",
      senderEmail: "emily.r@globalventures.com",
      account: "Global Ventures LLC",
      subject: "Follow-up: Partnership Discussion",
      preview: "It was great meeting you at the conference last week. I wanted to follow up on our discussion about potential partnership opportunities.",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isRead: false,
      hasAttachment: false,
      labels: ["Partnership"],
      body: `Hello,\n\nIt was great meeting you at the conference last week. I wanted to follow up on our discussion about potential partnership opportunities.\n\nI believe there's strong synergy between our companies, particularly in:\n- Market expansion\n- Technology integration\n- Customer acquisition\n\nWould you be available for a call next week to explore this further?\n\nBest regards,\nEmily Rodriguez`
    },
    {
      id: 4,
      sender: "David Park",
      senderEmail: "david.park@startupaccel.com",
      account: "Startup Accelerator",
      subject: "Demo Day Invitation - November 15th",
      preview: "You're invited to our upcoming Demo Day featuring 12 innovative startups. The event will be held on November 15th at our downtown location.",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isRead: true,
      hasAttachment: false,
      labels: ["Event"],
      body: `Dear Valued Partner,\n\nYou're invited to our upcoming Demo Day featuring 12 innovative startups. The event will be held on November 15th at our downtown location.\n\nEvent Details:\n- Date: November 15th, 2025\n- Time: 2:00 PM - 6:00 PM\n- Location: Innovation Hub, Downtown\n- Networking reception to follow\n\nRSVP by November 10th.\n\nLooking forward to seeing you there!\n\nDavid Park`
    },
    {
      id: 5,
      sender: "Lisa Thompson",senderEmail: "lisa.thompson@marketpro.com",account: "MarketPro Analytics",subject: "Monthly Analytics Report - October 2025",preview: "Please find attached your monthly analytics report for October 2025. This month shows significant improvement in key metrics.",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isRead: true,
      hasAttachment: true,
      labels: ["Report", "Analytics"],
      body: `Hi there,\n\nPlease find attached your monthly analytics report for October 2025. This month shows significant improvement in key metrics.\n\nKey Highlights:\n- 25% increase in website traffic\n- 18% improvement in conversion rate\n- 32% growth in lead generation\n- 15% increase in customer retention\n\nI'll be happy to discuss these results in detail during our monthly review call.\n\nBest regards,\nLisa Thompson`
    }
  ];

  // Mock email statistics
  const emailStats = {
    total: mockEmails?.length,
    unread: mockEmails?.filter(email => !email?.isRead)?.length,
    today: mockEmails?.filter(email => {
      const today = new Date();
      const emailDate = new Date(email.date);
      return emailDate?.toDateString() === today?.toDateString();
    })?.length,
    connectedAccounts: Object.values(connectedAccounts)?.filter(Boolean)?.length
  };

  // Filter emails based on search and filters
  const filteredEmails = mockEmails?.filter(email => {
    if (searchQuery) {
      const query = searchQuery?.toLowerCase();
      if (!email?.subject?.toLowerCase()?.includes(query) && 
          !email?.sender?.toLowerCase()?.includes(query) && 
          !email?.preview?.toLowerCase()?.includes(query)) {
        return false;
      }
    }

    if (filters?.sender && !email?.sender?.toLowerCase()?.includes(filters?.sender?.toLowerCase())) {
      return false;
    }

    if (filters?.account && !email?.account?.toLowerCase()?.includes(filters?.account?.toLowerCase())) {
      return false;
    }

    if (filters?.isRead === 'read' && !email?.isRead) {
      return false;
    }

    if (filters?.isRead === 'unread' && email?.isRead) {
      return false;
    }

    if (filters?.dateRange) {
      const now = new Date();
      const emailDate = new Date(email.date);
      
      switch (filters?.dateRange) {
        case 'today':
          if (emailDate?.toDateString() !== now?.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (emailDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (emailDate < monthAgo) return false;
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          if (emailDate < quarterAgo) return false;
          break;
      }
    }

    return true;
  });

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
  };

  const handleSendEmail = (emailData) => {
    console.log('Sending email:', emailData);
    // In a real app, this would send the email via API
  };

  const handleConnectProvider = (provider) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [provider]: true
    }));
    console.log(`Connecting to ${provider}...`);
    // In a real app, this would initiate OAuth flow
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, []);

  const hasConnectedAccounts = Object.values(connectedAccounts)?.some(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          {/* Page Header */}
          <div className="bg-background border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Emails</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your email communications and integrations
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/integrations')}
                >
                  <Icon name="Settings" size={16} className="mr-2" />
                  Manage Integrations
                </Button>
                
                <Button
                  variant="default"
                  onClick={() => setIsComposerOpen(true)}
                  disabled={!hasConnectedAccounts}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Compose Email
                </Button>
              </div>
            </div>
          </div>

          {!hasConnectedAccounts ? (
            /* Connection Setup View */
            (<div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-4xl w-full">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Mail" size={32} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Connect Your Email Accounts
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Integrate with Gmail or Outlook to manage all your customer communications in one place
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EmailConnectionCard
                    provider="Gmail"
                    icon="Mail"
                    description="Connect your Gmail account to sync emails, manage threads, and compose messages directly from CRMPro."
                    onConnect={() => handleConnectProvider('gmail')}
                    isConnected={connectedAccounts?.gmail}
                  />
                  
                  <EmailConnectionCard
                    provider="Outlook"
                    icon="Mail"
                    description="Integrate with Microsoft Outlook to access your emails, calendar, and contacts seamlessly."
                    onConnect={() => handleConnectProvider('outlook')}
                    isConnected={connectedAccounts?.outlook}
                  />
                </div>

                <div className="mt-8 p-6 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="Shield" size={16} className="text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Secure Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Your email data is encrypted and secure. We only access what's necessary to provide CRM functionality. 
                        You can disconnect at any time from the integrations settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>)
          ) : (
            /* Email Management View */
            (<div className="flex-1 flex flex-col overflow-hidden">
              <EmailStats stats={emailStats} />
              <EmailSearchBar onSearch={setSearchQuery} onFilterChange={setFilters} />
              <div className="flex-1 flex overflow-hidden">
                {/* Email List */}
                <div className="w-full lg:w-1/2 border-r border-border overflow-y-auto">
                  {filteredEmails?.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No emails found</h3>
                        <p className="text-muted-foreground">
                          {searchQuery || Object.keys(filters)?.length > 0
                            ? "Try adjusting your search or filters" :"Your emails will appear here once you connect an account"
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {filteredEmails?.map((email) => (
                        <EmailThreadItem
                          key={email?.id}
                          email={email}
                          onClick={handleEmailClick}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Email Detail View */}
                <div className="hidden lg:block lg:w-1/2 bg-muted/20">
                  {selectedEmail ? (
                    <div className="h-full flex flex-col">
                      {/* Email Header */}
                      <div className="p-6 border-b border-border bg-background">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-foreground">
                                {selectedEmail?.sender?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{selectedEmail?.sender}</h3>
                              <p className="text-sm text-muted-foreground">{selectedEmail?.senderEmail}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon">
                              <Icon name="Reply" size={16} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Icon name="Forward" size={16} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Icon name="Archive" size={16} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>
                        </div>
                        
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          {selectedEmail?.subject}
                        </h2>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>To: you</span>
                          <span>•</span>
                          <span>{selectedEmail?.date?.toLocaleString()}</span>
                          {selectedEmail?.hasAttachment && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Icon name="Paperclip" size={14} />
                                <span>Attachment</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {selectedEmail?.labels && selectedEmail?.labels?.length > 0 && (
                          <div className="flex items-center space-x-2 mt-3">
                            {selectedEmail?.labels?.map((label, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Email Body */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-foreground">
                            {selectedEmail?.body}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="p-4 border-t border-border bg-background">
                        <div className="flex items-center space-x-2">
                          <Button variant="default" size="sm">
                            <Icon name="Reply" size={14} className="mr-2" />
                            Reply
                          </Button>
                          <Button variant="outline" size="sm">
                            <Icon name="Forward" size={14} className="mr-2" />
                            Forward
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Icon name="Archive" size={14} className="mr-2" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Icon name="Mail" size={48} className="text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Select an email</h3>
                        <p className="text-muted-foreground">
                          Choose an email from the list to view its contents
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>)
          )}
        </div>

        {/* Floating Compose Button */}
        {hasConnectedAccounts && (
          <Button
            variant="default"
            size="lg"
            onClick={() => setIsComposerOpen(true)}
            className="fixed bottom-6 right-6 rounded-full shadow-elevation-2 z-40 lg:hidden"
          >
            <Icon name="Plus" size={20} />
          </Button>
        )}

        {/* Email Composer Modal */}
        <EmailComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          onSend={handleSendEmail}
        />
      </main>
    </div>
  );
};

export default EmailsPage;