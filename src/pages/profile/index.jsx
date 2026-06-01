import React, { useState } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import ProfileTab from "./components/ProfileTab";
import ChangePassword from "./components/changePassword";

const Profile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: "User",
      description: "Personal information and preferences",
    },
    // {
    //   id: "password",
    //   label: "Password",
    //   icon: "Building2",
    //   description: "Make your password you first priority",
    // },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />;
      case "password":
        return <ChangePassword />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
       <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Settings" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Profile Settings</h1>
                <p className="text-muted-foreground">Update personal preferences</p>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Desktop Tabs */}
            <div className="hidden lg:block border-b border-border">
              <nav className="flex space-x-8 px-6">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-smooth
                      ${activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                      }
                    `}
                  >
                    <Icon name={tab?.icon} size={18} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile Tab Selector */}
            <div className="lg:hidden border-b border-border p-4">
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e?.target?.value)}
                  className="w-full appearance-none bg-background border border-border rounded-lg px-4 py-3 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {tabs?.map((tab) => (
                    <option key={tab?.id} value={tab?.id}>
                      {tab?.label} - {tab?.description}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Icon name="ChevronDown" size={20} className="text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 lg:p-8">
              {/* Tab Description - Desktop Only */}
              <div className="hidden lg:block mb-6">
                <div className="flex items-center space-x-3">
                  <Icon 
                    name={tabs?.find(tab => tab?.id === activeTab)?.icon || 'Settings'} 
                    size={20} 
                    className="text-primary" 
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">
                      {tabs?.find(tab => tab?.id === activeTab)?.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {tabs?.find(tab => tab?.id === activeTab)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Render Active Tab Content */}
              {renderTabContent()}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-muted rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon name="HelpCircle" size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you need assistance with any settings, check out our documentation or contact support.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-smooth">
                    <Icon name="Book" size={16} className="mr-2" />
                    View Documentation
                  </button>
                  <button className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-smooth">
                    <Icon name="MessageCircle" size={16} className="mr-2" />
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
