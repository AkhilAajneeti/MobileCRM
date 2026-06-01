import React, { useEffect, useState } from "react";
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
  contactDetail,
  onBulkUpdate,
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
    { id: "stream", label: "Stream", icon: "FileText" },
    { id: "activities", label: "Activities", icon: "Clock" },
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
              {mode === "create"
                ? "Add Contact"
                : mode === "edit"
                  ? "Edit Contact"
                  : "Contact Details"}
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
                      {/* CONTACT INFORMATION */}
                      <div className="border border-border rounded-xl p-6">
                        {/* Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Name
                            </p>
                            <p className="text-foreground font-medium">
                              {contact?.name || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Email
                            </p>
                            <a
                              href={`mailto:${contact?.emailAddress}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {contact?.emailAddress || "—"}
                            </a>
                          </div>
                          {/* Phone */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Phone
                            </p>
                            <span className="text-sm text-foreground">
                              {contact?.phoneNumber || "—"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Account Name
                            </p>
                            <span className="text-sm text-primary hover:underline cursor-pointer">
                              <div className="flex flex-wrap gap-1">
                                {Object.values(
                                  contactDetail?.accountsNames || {},
                                ).length ? (
                                  Object.values(
                                    contactDetail.accountsNames,
                                  ).map((name) => (
                                    <span
                                      key={name}
                                      className="text-sm text-primary hover:underline cursor-pointer"
                                    >
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </div>
                            </span>
                          </div>
                        </div>
                        {/* Address */}
                        <div className="pt-5">
                          <p className="text-sm text-muted-foreground">
                            Address
                          </p>
                          <span className="text-sm text-foreground leading-relaxed">
                            {contact?.addressStreet && (
                              <>
                                {contact.addressStreet}, <br />
                              </>
                            )}
                            {contact?.addressCity}, {contact?.addressState}{" "}
                            {contact?.addressPostalCode} <br />
                            {contact?.addressCountry}
                          </span>
                        </div>
                      </div>

                      {/* RELATIONSHIP / META */}
                      <div className="border border-border rounded-xl p-6">
                        <h4 className="font-medium text-foreground mb-3">
                          Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Assigned User */}
                          <div>
                            <p className=" text-muted-foreground ">
                              Assigned User{" "}
                            </p>
                            <span className="text-sm text-foreground text-primary">
                              {contact?.assignedUserName || "—"}
                            </span>
                          </div>
                          {/* Assigned team */}
                          <div>
                            <p className=" text-muted-foreground ">Team </p>
                            <span className="text-sm text-foreground text-primary">
                              {contactDetail?.teamsNames
                                ? Object.values(contactDetail.teamsNames).join(
                                    ", ",
                                  )
                                : "—"}
                            </span>
                          </div>

                          {/* Created */}
                          <div className="">
                            <p className=" text-muted-foreground text-primary">
                              Created{" "}
                            </p>
                            <span className="text-sm text-foreground">
                              {formatDateTime(contact?.createdAt)}
                              <span className="text-muted-foreground">
                                <br />
                                {contact?.createdByName}
                              </span>
                            </span>
                          </div>

                          {/* Modified */}
                          <div className="">
                            <p className=" text-muted-foreground text-primary">
                              Modified{" "}
                            </p>
                            <span className="text-sm text-foreground">
                              {contact?.modifiedAt
                                ? new Date(
                                    `${contact.modifiedAt.replace(" ", "T")}Z`,
                                  ).toLocaleString()
                                : "—"}
                              <span className="text-muted-foreground">
                                <br /> {contact?.modifiedByName}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* DESCRIPTION */}
                      <div>
                        <h4 className="font-medium text-foreground mb-3">
                          Description
                        </h4>
                        <p className="text-sm text-foreground">
                          {contact?.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "stream" && (
                    <div className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-foreground">
                          Recent Stream
                        </h3>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowStreamForm(true)}
                        >
                          <Icon name="Plus" size={16} className="mr-1" />
                          Add Stream
                        </Button>
                      </div>

                      {/* FORM */}
                      {showStreamForm && (
                        <form onSubmit={handlePostStream} className="space-y-2">
                          <textarea
                            className="w-full px-3 py-2 border border-border rounded-lg"
                            rows={4}
                            placeholder="Write your comment..."
                            value={streamText}
                            onChange={(e) => setStreamText(e.target.value)}
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowStreamForm(false);
                                setStreamText("");
                              }}
                            >
                              Cancel
                            </Button>

                            <Button
                              type="submit"
                              size="sm"
                              disabled={postingStream}
                            >
                              {postingStream ? "Posting..." : "Post"}
                            </Button>
                          </div>
                        </form>
                      )}

                      {/* Loader */}
                      {streamLoading && (
                        <p className="text-sm text-muted-foreground">
                          Loading stream…
                        </p>
                      )}

                      {/* Stream List */}
                      {!streamLoading &&
                        streams.map((item) => (
                          <div
                            key={item.id}
                            className="flex space-x-3 p-4 bg-muted/30 rounded-lg group"
                          >
                            <Avatar
                              name={item.createdByName || "System"}
                              size="36"
                              round
                              textSizeRatio={2}
                            />

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-foreground">
                                    {item.createdByName || "System"}
                                  </h4>

                                  <Icon
                                    name={getStreamIcon(item.type)}
                                    size={14}
                                    className={getStreamIconColor(item.type)}
                                  />

                                  <span className="text-xs text-muted-foreground">
                                    {item.type}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDateTime(item.createdAt)}
                                  </span>

                                  <div className="opacity-0 group-hover:opacity-100 transition">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Icon name="Edit" size={14} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                    >
                                      <Icon name="Trash2" size={14} />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground mt-1">
                                {getStreamMessage(item)}
                              </p>

                              {item.data?.value && (
                                <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                                  {item.data.value}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}

                      {!streamLoading && streams.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No stream activity yet.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === "activities" && (
                    <div className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">
                          Recent Activities
                        </h4>

                        <Button variant="outline" size="sm">
                          <Icon name="Plus" size={16} className="mr-2" />
                          Log Activity
                        </Button>
                      </div>

                      {activityLoading && (
                        <p className="text-sm text-muted-foreground">
                          Loading activities...
                        </p>
                      )}

                      {!activityLoading &&
                        activities.map((activity) => {
                          const isOpen = expandedActivityId === activity.id;

                          return (
                            <div
                              key={activity.id}
                              onClick={() => toggleActivity(activity.id)}
                              className="cursor-pointer rounded-lg bg-muted/30 p-4 transition hover:bg-muted/40"
                            >
                              {/* ===== COLLAPSED (LEAD STYLE) ===== */}
                              <div className="flex gap-3">
                                <Avatar
                                  name={activity.assignedUserName || "A"}
                                  size="36"
                                  round
                                  textSizeRatio={2}
                                />

                                <div className="flex-1">
                                  {/* Top row */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-foreground">
                                      {activity.assignedUserName || "User"}
                                    </span>

                                    <span className="text-sm text-muted-foreground">
                                      {activity.type}
                                    </span>

                                    {activity.status && (
                                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                                        {activity.status}
                                      </span>
                                    )}
                                  </div>

                                  {/* Meta row */}
                                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    {activity.dateStart && (
                                      <span className="flex items-center gap-1">
                                        <Icon name="Clock" size={12} />
                                        {new Date(
                                          `${activity.dateStart.replace(" ", "T")}Z`,
                                        ).toLocaleDateString()}
                                      </span>
                                    )}

                                    {activity.duration && (
                                      <span className="flex items-center gap-1">
                                        <Icon name="Timer" size={12} />
                                        {Math.round(activity.duration / 60)} min
                                      </span>
                                    )}

                                    {activity.parentType && (
                                      <span className="flex items-center gap-1">
                                        <Icon name="Link" size={12} />
                                        {activity.parentType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* ===== EXPANDED ===== */}
                              <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                  isOpen
                                    ? "max-h-[300px] opacity-100 mt-4"
                                    : "max-h-0 opacity-0"
                                }`}
                              >
                                <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Start
                                    </p>
                                    <p className="font-medium">
                                      {activity.dateStart &&
                                        new Date(
                                          `${activity.dateStart.replace(" ", "T")}Z`,
                                        ).toLocaleString()}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      End
                                    </p>
                                    <p className="font-medium">
                                      {activity.dateEnd &&
                                        new Date(
                                          `${activity.dateEnd.replace(" ", "T")}Z`,
                                        ).toLocaleString()}
                                    </p>
                                  </div>

                                  {activity.assignedUserName && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Assigned To
                                      </p>
                                      <p className="font-medium">
                                        {activity.assignedUserName}
                                      </p>
                                    </div>
                                  )}

                                  {activity.parentType && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Parent
                                      </p>
                                      <p className="font-medium text-primary">
                                        {activity.parentType}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {!activityLoading && activities.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No activities found for this contact.
                        </p>
                      )}
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
