import React, { useEffect, useMemo, useState } from "react";
import Icon from "../../../components/AppIcon";
import Avatar from "react-avatar";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "components/ui/Select";
import { createContact, updateContact } from "services/contact.service";
import { fetchAccounts } from "services/account.service";
import { fetchUser } from "services/user.service";
import { fetchTeam } from "services/team.service";
import { contactActivitesById } from "services/contact.service"; // path check
import {
  createContactStream,
  fetchContactStreamById,
} from "services/contact.service";

const ContactDrawer = ({
  mode,
  contact,
  isOpen,
  onClose,
  onBulkUpdate,
  allLeads = [],
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [team, setTeam] = useState([]);

  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);

  const [streams, setStreams] = useState([]);
  const [streamLoading, setStreamLoading] = useState(false);
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [postingStream, setPostingStream] = useState(false);
  const [massFields, setMassFields] = useState({
    assignedUserId: false,
    teamId: false,
  });
  const isMassUpdate = mode === "mass-update";
  const toggleMassField = (field) => {
    setMassFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  useEffect(() => {
    if (isOpen) {
      fetchAccounts()
        .then((res) => setAccounts(res.list || []))
        .catch((err) => console.error("Account fetch failed", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (contact && mode === "edit") {
      setFormData({
        salutationName: contact.salutationName || "",
        firstName: contact.firstName || "",
        lastname: contact.lastName || "",
        phoneNumber: contact.phoneNumber || "",
        emailAddress: contact.emailAddress || "",
        description: contact.description || "",
        accountId: contact.accountId || "",
        addressStreet: contact.addressStreet || "",
        addressCity: contact.addressCity || "",
        addressState: contact.addressState || "",
        addressPostalCode: contact.addressPostalCode || "",
        addressCountry: contact.addressCountry || "",
        assignedUserId: contact.assignedUserId || "",
        teamId: contact.teamId || "",
      });
    }
  }, [contact, mode]);

  // if (!contact) return null;
  const [formData, setFormData] = useState({
    salutationName: "",
    firstName: "",
    lastname: "",
    phoneNumber: "",
    emailAddress: "",
    accountId: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressPostalCode: "",
    addressCountry: "",
    assignedUserId: "",
    teamId: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        salutationName: formData.salutationName,
        firstName: formData.firstName,
        lastName: formData.lastname,

        phoneNumber: formData.phoneNumber,
        emailAddress: formData.emailAddress,
        description: formData.description,
        accountId: formData.accountId,

        addressStreet: formData.addressStreet,
        addressCity: formData.addressCity,
        addressState: formData.addressState,
        addressPostalCode: formData.addressPostalCode,
        addressCountry: formData.addressCountry,
        assignedUserId: formData.assignedUserId,
        teamId: formData.teamId,
      };
      console.log(payload);
      if (mode === "edit") {
        await updateContact(contact.id, payload);
      } else {
        await createContact(payload);
      }
      console.log("created contact");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const userLeads = useMemo(() => {
    if (!contact?.id) return [];

    return allLeads.filter((lead) => lead.assignedUserId === contact.id);
  }, [allLeads, contact?.id]);
  const TYPE = ["Mr.", "Ms.", "Mrs.", "Dr."];
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, teamRes] = await Promise.all([
          fetchUser(),
          fetchTeam(),
        ]);

        setUsers(usersRes.list || []);
        setTeam(teamRes.list || []);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };

    loadData();
  }, []);

  const userOptions = users
    ?.filter((u) => u?.isActive) // ✅ only active users
    ?.map((u) => ({
      value: u.id,
      label: u.name || u.userName,
    }));
  const teamOptions = team?.map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getActivityIcon = (type) => {
    const icons = {
      call: "Phone",
      email: "Mail",
      meeting: "Calendar",
      task: "CheckSquare",
    };
    return icons?.[type] || "Circle";
  };
  // overview params
  const activeLeads = userLeads.filter(
    (l) => l.status !== "Closed" && l.status !== "Not Interested",
  ).length;

  const interestedLeads = userLeads.filter(
    (l) => l.status === "Interested",
  ).length;

  const notInterestedLeads = userLeads.filter(
    (l) => l.status === "Not Interested",
  ).length;

  const siteVisits = userLeads.filter(
    (l) => l.status === "Site Visit Done",
  ).length;
  const followUp = userLeads.filter((l) => l.status === "Follow Up").length;

  const closedDeals = userLeads.filter(
    (l) => l.status === "Deal Closed",
  ).length;
  const converted = userLeads.filter((l) => l.status === "Converted").length;
  const callNotPick = userLeads.filter(
    (l) => l.status === "Call Not Picked",
  ).length;
  const callLater = userLeads.filter((l) => l.status === "Call Later").length;
  const getActivityColor = (type) => {
    const colors = {
      call: "text-blue-500",
      email: "text-green-500",
      meeting: "text-purple-500",
      task: "text-orange-500",
    };
    return colors?.[type] || "text-muted-foreground";
  };

  const handleAddNote = () => {
    if (newNote?.trim()) {
      console.log("Adding note:", newNote);
      setNewNote("");
    }
  };

  useEffect(() => {
    if (!isOpen || !contact?.id || activeTab !== "activities") return;

    const loadActivities = async () => {
      try {
        setActivityLoading(true);
        const res = await contactActivitesById(contact.id);
        setActivities(res.list || []);
      } catch (err) {
        console.error("Failed to load contact activities", err);
      } finally {
        setActivityLoading(false);
      }
    };

    loadActivities();
  }, [isOpen, contact?.id, activeTab]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "User" },
    { id: "leads", label: "Leads", icon: "FileText" },
    // { id: "activities", label: "Activities", icon: "Clock" },
  ];
  const toggleActivity = (id) => {
    setExpandedActivityId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!isOpen || !contact?.id || activeTab !== "stream") return;

    const loadStream = async () => {
      try {
        setStreamLoading(true);
        const res = await fetchContactStreamById(contact.id);
        setStreams(res.list || []);
      } catch (err) {
        console.error("Failed to load contact stream", err);
      } finally {
        setStreamLoading(false);
      }
    };

    loadStream();
  }, [isOpen, contact?.id, activeTab]);
  const getStreamIcon = (type = "") => {
    switch (type) {
      case "Post":
        return "MessageSquare";
      case "Update":
        return "RefreshCcw";
      case "CreateRelated":
        return "Link";
      default:
        return "Activity";
    }
  };

  const getStreamIconColor = (type = "") => {
    switch (type) {
      case "Post":
        return "text-indigo-600";
      case "Update":
        return "text-blue-600";
      case "CreateRelated":
        return "text-purple-600";
      default:
        return "text-gray-500";
    }
  };

  const getStreamMessage = (item) => {
    if (item.type === "Post") return item.post;
    if (item.type === "Update" && item.data?.value)
      return `Status updated to ${item.data.value}`;
    if (item.type === "CreateRelated") return "Activity updated";
    return "Activity updated";
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    // EspoCRM datetimes are UTC; append Z so toLocaleString uses local tz.
    const safe =
      typeof value === "string" && value.length > 10
        ? `${value.replace(" ", "T")}Z`
        : value;
    const d = new Date(safe);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const handlePostStream = async (e) => {
    e.preventDefault();

    if (!streamText.trim()) return;

    try {
      setPostingStream(true);

      const payload = {
        post: streamText,
        parentId: contact.id,
        parentType: "Contact",
        type: "Post",
        isInternal: false,
        attachmentsIds: [],
      };

      const newStream = await createContactStream(payload);

      // 🔥 instant UI update
      setStreams((prev) => [newStream, ...prev]);
      setStreamText("");
      setShowStreamForm(false);
    } catch (err) {
      console.error("Failed to post stream", err);
      alert("Failed to post stream");
    } finally {
      setPostingStream(false);
    }
  };
  const handleBulkUpdate = (e) => {
    e.preventDefault();

    const payload = {};

    if (massFields.assignedUserId)
      payload.assignedUserId = formData.assignedUserId;
    if (massFields.teamId) payload.teamId = formData.teamId;

    if (!Object.keys(payload).length) {
      toast.error("Select at least one field");
      return;
    }

    onBulkUpdate(payload);
    onClose();
  };

  const STATUS_STYLES = {
    New: "bg-blue-100 text-blue-700",

    Dead: "bg-gray-200 text-gray-700",

    Interested: "bg-indigo-100 text-indigo-700",

    "Not Interested": "bg-red-100 text-red-700",

    "Follow up": "bg-amber-100 text-amber-700",

    "Site Visit Scheduled": "bg-cyan-100 text-cyan-700",

    "Site Visit Done": "bg-teal-100 text-teal-700",

    "Call Later": "bg-yellow-100 text-yellow-700",

    "Switch Off": "bg-gray-300 text-gray-800",

    "Invalid Number": "bg-rose-100 text-rose-700",

    Broker: "bg-purple-100 text-purple-700",

    "Call Not Picked": "bg-orange-100 text-orange-700",

    "Low Budget": "bg-orange-200 text-orange-800",

    "Low Interest": "bg-yellow-200 text-yellow-800",

    "Irrelevant Lead": "bg-slate-200 text-slate-700",

    "Call Not Connecting": "bg-stone-200 text-stone-700",

    "Fake Lead": "bg-pink-200 text-pink-700",

    Purchased: "bg-green-100 text-green-700",

    "Other Location": "bg-lime-100 text-lime-700",

    Converted: "bg-green-100 text-green-700",

    "Deal Closed": "bg-emerald-100 text-emerald-700",

    "Proposal Shared": "bg-violet-100 text-violet-700",
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex gap-2">
              <Icon name="Users" size={24} className="text-primary" />
              Sales Performance
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close contact details"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* CREATE CONTACT FORM */}
            {mode === "create" && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Salutation
                    </label>
                    <select
                      name="salutationName"
                      value={formData?.salutationName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select</option>
                      {TYPE.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name
                    </label>
                    <Input
                      name="firstName"
                      value={formData?.firstName}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last name
                    </label>
                    <Input
                      name="lastname"
                      type="text"
                      value={formData?.lastname}
                      onChange={handleInputChange}
                      placeholder="Developer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    name="emailAddress"
                    type="text"
                    value={formData?.emailAddress}
                    onChange={handleInputChange}
                    placeholder="example@gmail.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account Name
                    </label>
                    <select
                      name="accountId"
                      value={formData?.accountId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <Input
                      name="phoneNumber"
                      type="tel"
                      value={formData?.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+919807809876"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        name="addressStreet"
                        type="text"
                        value={formData?.addressStreet}
                        onChange={handleInputChange}
                        placeholder="Street"
                      />
                    </div>
                    <div>
                      <Input
                        name="addressCity"
                        type="text"
                        value={formData?.addressCity}
                        onChange={handleInputChange}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Input
                        name="addressState"
                        type="text"
                        value={formData?.addressState}
                        onChange={handleInputChange}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Input
                        name="addressPostalCode"
                        type="text"
                        value={formData?.addressPostalCode}
                        onChange={handleInputChange}
                        placeholder="Postal Code"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        name="addressCountry"
                        type="text"
                        value={formData?.addressCountry}
                        onChange={handleInputChange}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Assigned User
                      </label>

                      <Select
                        name="assignedUserId"
                        value={formData.assignedUserId || ""}
                        options={userOptions} // 👉 later API se users
                        onChange={(value) =>
                          handleSelectChange("assignedUserId", value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Teams
                      </label>
                      <Select
                        name="teamId"
                        value={formData.teamId || ""}
                        options={teamOptions}
                        onChange={(value) =>
                          handleSelectChange("teamId", value)
                        }
                        placeholder="Select Team"
                      />
                    </div>
                  </div>
                </div>

                <textarea
                  name="description"
                  value={formData?.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the company..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Account"}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isMassUpdate && (
              <form className="p-6 space-y-6" onSubmit={handleBulkUpdate}>
                <h3 className="text-lg font-semibold">Mass Update Contacts</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assigned User */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.assignedUserId}
                      onChange={() => toggleMassField("assignedUserId")}
                    />
                    <Select
                      placeholder="Assigned User"
                      value={formData.assignedUserId}
                      options={userOptions}
                      disabled={!massFields.assignedUserId}
                      onChange={(v) => handleSelectChange("assignedUserId", v)}
                    />
                  </div>

                  {/* Team */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={massFields.teamId}
                      onChange={() => toggleMassField("teamId")}
                    />
                    <Select
                      placeholder="Team"
                      value={formData.teamId}
                      options={teamOptions}
                      disabled={!massFields.teamId}
                      onChange={(v) => handleSelectChange("teamId", v)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Contacts</Button>
                </div>
              </form>
            )}

            {/* VIEW CONTACT */}
            {mode === "view" && contact && (
              <>
                {/* Tabs */}
                <div className="border-b border-border">
                  <nav className="flex space-x-1 px-6">
                    {tabs?.map((tab) => (
                      <button
                        key={tab?.id}
                        onClick={() => setActiveTab(tab?.id)}
                        className={`
                    flex items-center space-x-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === tab?.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }
                  `}
                      >
                        <Icon name={tab?.icon} size={16} />
                        <span>{tab?.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {activeTab === "overview" && (
                    <div className="p-6 space-y-6">
                      {/* PERFORMANCE SUMMARY */}
                      <div className="border border-border rounded-xl p-6">
                        <h4 className="font-medium text-foreground mb-4">
                          Sales Performance
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {/* 🔵 PIPELINE */}

                          <div className="bg-blue-50 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-blue-600">
                              Active Leads
                            </p>
                            <p className="text-xl font-semibold text-blue-700">
                              {activeLeads}
                            </p>
                          </div>

                          <div className="bg-indigo-50 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-indigo-600">
                              Interested
                            </p>
                            <p className="text-xl font-semibold text-indigo-700">
                              {interestedLeads}
                            </p>
                          </div>

                          <div className="bg-purple-50 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-purple-600">Follow Up</p>
                            <p className="text-xl font-semibold text-purple-700">
                              {followUp}
                            </p>
                          </div>

                          <div className="bg-amber-50 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-amber-600">
                              Site Visits
                            </p>
                            <p className="text-xl font-semibold text-amber-700">
                              {siteVisits}
                            </p>
                          </div>

                          {/* 🟢 SUCCESS */}

                          <div className="bg-green-50 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-green-600">
                              Deals Closed
                            </p>
                            <p className="text-xl font-semibold text-green-700">
                              {closedDeals}
                            </p>
                          </div>

                          <div className="bg-emerald-50 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-emerald-600">
                              Converted
                            </p>
                            <p className="text-xl font-semibold text-emerald-700">
                              {converted}
                            </p>
                          </div>

                          {/* 🔴 NEGATIVE / LOST */}

                          <div className="bg-red-50 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-red-600">
                              Not Interested
                            </p>
                            <p className="text-xl font-semibold text-red-700">
                              {notInterestedLeads}
                            </p>
                          </div>

                          <div className="bg-gray-100 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-gray-600">
                              Call Not Picked
                            </p>
                            <p className="text-xl font-semibold text-gray-700">
                              {callNotPick}
                            </p>
                          </div>

                          <div className="bg-orange-50 p-4 rounded-lg hover:shadow-md transition">
                            <p className="text-sm text-orange-600">
                              Call Later
                            </p>
                            <p className="text-xl font-semibold text-orange-700">
                              {callLater}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "leads" && (
                    <div className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Assigned Leads ({userLeads.length})
                      </h3>

                      {userLeads.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <img
                            src="/assets/images/no-content.png"
                            alt="No Activities"
                            className="w-40 opacity-80"
                          />
                          <p className="mt-3 text-sm text-muted-foreground">
                            No leads are currently assigned to this user.
                          </p>
                        </div>
                      )}

                      {userLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="border border-border rounded-lg p-4 hover:bg-muted/30 transition"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-foreground">
                                Name: {lead.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Project:{" "}
                                {lead.cProjectName
                                  ? lead.cProjectName
                                  : lead.cProject}
                              </p>
                            </div>

                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                STATUS_STYLES[lead.status] ||
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {lead.status}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {lead.createdAt}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* for edit */}
            {mode === "edit" && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Salutation
                    </label>
                    <select
                      name="salutationName"
                      value={formData?.salutationName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select</option>
                      {TYPE.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name
                    </label>
                    <Input
                      name="firstName"
                      value={formData?.firstName}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last name
                    </label>
                    <Input
                      name="lastname"
                      type="text"
                      value={formData?.lastname}
                      onChange={handleInputChange}
                      placeholder="Developer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    name="emailAddress"
                    type="text"
                    value={formData?.emailAddress}
                    onChange={handleInputChange}
                    placeholder="example@gmail.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account Name
                    </label>
                    <select
                      name="accountId"
                      value={formData?.accountId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <Input
                      name="phoneNumber"
                      type="tel"
                      value={formData?.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+919807809876"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        name="addressStreet"
                        type="text"
                        value={formData?.addressStreet}
                        onChange={handleInputChange}
                        placeholder="Street"
                      />
                    </div>
                    <div>
                      <Input
                        name="addressCity"
                        type="text"
                        value={formData?.addressCity}
                        onChange={handleInputChange}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Input
                        name="addressState"
                        type="text"
                        value={formData?.addressState}
                        onChange={handleInputChange}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Input
                        name="addressPostalCode"
                        type="text"
                        value={formData?.addressPostalCode}
                        onChange={handleInputChange}
                        placeholder="Postal Code"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        name="addressCountry"
                        type="text"
                        value={formData?.addressCountry}
                        onChange={handleInputChange}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Assigned User
                      </label>

                      <Select
                        name="assignedUserId"
                        value={formData.assignedUserId || ""}
                        options={userOptions} // 👉 later API se users
                        onChange={(value) =>
                          handleSelectChange("assignedUserId", value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Teams
                      </label>
                      <Select
                        name="teamId"
                        value={formData.teamId || ""}
                        options={teamOptions}
                        onChange={(value) =>
                          handleSelectChange("teamId", value)
                        }
                        placeholder="Select Team"
                      />
                    </div>
                  </div>
                </div>

                <textarea
                  name="description"
                  value={formData?.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the company..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating..." : "Update Contact"}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactDrawer;
