import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import Avatar from "react-avatar";
import { useUsers } from "hooks/useUsers";
import { useTeams } from "hooks/useTeams";
import { createLeadActivity, fetchLeads } from "services/leads.service";
import { fetchAccounts } from "services/account.service";
import { taskStreamById } from "services/tasks.service";
import { canEditRecord } from "utils/permission";
import { ParentSelectorModal } from "components/ParentSelectorModal";
import { toEspoDateTime as toEspoDateTimeUtc } from "../../pipeline/utils/dateHelpers";

const DealDrawer = ({
  deal,
  selectedIds = [],
  isOpen,
  onClose,
  mode,
  onCreate,
  onUpdate,
  onBulkUpdate,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [acc, setAcc] = useState([]);
  const [lead, setLead] = useState([]);
  const [contact, setContact] = useState([]);
  const [mockStream, setmockStream] = useState([]);
  const [showActivityForm, setActivityForm] = useState(false);
  const [activityText, setActivityText] = useState("");
  const [postingActivity, setPostingActivity] = useState(false);
  const { data: usersData } = useUsers();
  const { data: teamData } = useTeams();

  const limit = 10;
  const users = usersData?.list || [];
  const team = teamData?.list || [];
  const [formData, setFormData] = useState({
    name: "",
    assignedUserId: "",
    teamId: "",
    status: "",
    priority: "",
    startDate: "",
    dueDate: "",
    description: "",
    parentName: "",
    parentType: "",
  });
  useEffect(() => {
    if (mode === "add") {
      setFormData({
        name: "",
        assignedUserId: "",
        teamId: "",
        status: "",
        priority: "",
        startDate: "",
        dueDate: "",
        description: "",
        parentName: "", // Account | Lead | Contact (TYPE)
        parentType: "", // record ID
      });
    } else if (deal) {
      setFormData({
        name: deal.name || "",
        assignedUserId: deal.assignedUserId || "",
        teamId: deal.teamId || "",
        status: deal.status || "",
        priority: deal.priority || "",
        startDate: deal.startDate || "",
        dueDate: deal.dueDate || "",
        description: deal.description || "",
        parentName: deal.parentType || "",
        parentType: deal.parentId || "",
      });
    }
  }, [deal, mode]);
  // mass update
  const isMassUpdate = mode === "mass-update";

  const [massFields, setMassFields] = useState({
    status: false,
    priority: false,
    assignedUserId: false,
    dueDate: false,
  });
  const toggleMassField = (field) => {
    setMassFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // fetching lead stream from id
  useEffect(() => {
    if (!isOpen || !deal?.id) return;

    const loadStream = async () => {
      try {
        const id = deal?.id;
        const res = await taskStreamById(id);
        setmockStream(res.list || []);
      } catch (err) {
        console.error("Failed to fetch streams", err);
        toast.error("Failed to load activity");
      }
    };

    loadStream();
  }, [isOpen, deal?.id]);

  // mockactivities

  const STATUS_OPTIONS = [
    { value: "Not Started", label: "Not Started" },
    { value: "Started", label: "Started" },
    { value: "Completed", label: "Completed" },
    { value: "Canceled", label: "Canceled" },
    { value: "Deferred", label: "Deferred" },
  ];
  const Parent_OPTIONS = [
    // { value: "Account", label: "Account" },
    { value: "Lead", label: "Lead" },
  ];
  const SOURCE_OPTIONS = [
    { value: "Low", label: "Low" },
    { value: "Normal", label: "Normal" },
    { value: "High", label: "High" },
    { value: "Urgent", label: "Urgent" },
  ];

  useEffect(() => {
    const loadParentData = async () => {
      try {
        if (formData.parentName === "Account") {
          const res = await fetchAccounts({ limit: 200, page: 1 });
          setAcc(res.list || []);
        }

        if (formData.parentName === "Lead") {
          const res = await fetchLeads({ limit: 10, page: 1 });
          setLead(res.list || []);
        }

      } catch (err) {
        console.error("Parent fetch failed", err);
        toast.error("Failed to load parent data");
      }
    };

    if (formData.parentName) {
      loadParentData();
    }
  }, [formData.parentName]);
  const currentUserId = JSON.parse(localStorage.getItem("login_object"))?.id;
  // if (!isOpen) return null;
  const canEditDeal = (deal) =>
    canEditRecord("Task", deal) &&
    deal?.assignedUserId === currentUserId;
  const formatDate = (date) => {
    if (!date) return "—";

    // Espo format: YYYY-MM-DD HH:mm:ss
    const parsed = new Date(date.replace(" ", "T") + "Z");

    if (isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Not Started":
        return "bg-gray-100 text-gray-700";
      case "Started":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      case "Deferred":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  const getStageColor = (stage) => {
    const colors = {
      New: "bg-blue-100 text-blue-800",
      Interested: "bg-sky-100 text-sky-800",
      "Follow up": "bg-indigo-100 text-indigo-800",
      Converted: "bg-green-100 text-green-800",
      "Not interested": "bg-orange-100 text-orange-800",
      Broker: "bg-purple-100 text-purple-800",
      "Call Not Picked": "bg-red-100 text-red-800",
      Invalid: "bg-gray-100 text-gray-700",
    };
    return colors?.[stage] || "bg-gray-100 text-gray-800";
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "Eye" },
    { id: "AssignedUsers", label: "Assigned User", icon: "Users" },
    { id: "stream", label: "Stream", icon: "Calendar" },

  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "Post":
        return "MessageSquare";
      case "Update":
        return "RefreshCcw";
      case "Assign":
        return "UserPlus";
      case "Create":
        return "PlusCircle";
      default:
        return "Activity";
    }
  };

  const getActivityIconColor = (type) => {
    switch (type) {
      case "Post":
        return "text-indigo-600";
      case "Update":
        return "text-blue-600";
      case "Assign":
        return "text-purple-600";
      case "Create":
        return "text-green-600";
      default:
        return "text-gray-500";
    }
  };

  const getActivityMessage = (stream) => {
    const { type, post, data, createdByName } = stream;

    if (type === "Post") {
      return post;
    }

    if (type === "Assign") {
      return `Assigned to ${data?.assignedUserName}`;
    }

    if (type === "Create") {
      return "Task was created";
    }

    if (type === "Update") {
      if (data?.value) {
        return `Status updated to ${data.value}`;
      }
      return "Task updated";
    }

    if (activity._scope === "Call") {
      return `${activity.direction || "Call"} call scheduled`;
    }

    if (activity._scope === "Meeting") {
      return "Meeting scheduled";
    }

    return "Activity updated";
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error("Task name is required");
      return;
    }

    const payload = {
      // ✅ TASK REQUIRED
      name: formData.name.trim(),
      status: formData.status || "Not Started",
      priority: formData.priority || "Normal",

      assignedUserId: formData.assignedUserId || null,

      // ✅ TASK expects ARRAY
      teamsIds: formData.teamId ? [formData.teamId] : [],

      // ✅ DATE FORMAT (EspoCRM Task)
      dateStart: toEspoDateTime(formData.startDate),
      dateEnd: toEspoDateTime(formData.dueDate),

      description: formData.description || "",

      // ✅ CORRECT parent mapping
      parentType: formData.parentName || null, // Account
      parentId: formData.parentType || null, // record ID

      attachmentsIds: [],
      reminders: [],
    };


    try {
      if (mode === "add") {
        // ✅ CREATE
        await onCreate(payload);
        toast.success("Task is  created");
      } else {
        // ✅ UPDATE (id MUST be passed)
        await onUpdate(deal.id, payload);
        toast.success("Task is  Updated");
      }

      onClose();
    } catch (err) {
      console.error("Task creation failed", err);
      toast.error("Task is not created");
    }
  };
  const handleBulkUpdate = async (e) => {
    e.preventDefault();

    const payload = {};

    if (massFields.status) payload.status = formData.status;
    if (massFields.priority) payload.priority = formData.priority;
    if (massFields.assignedUserId)
      payload.assignedUserId = formData.assignedUserId;
    if (massFields.dueDate) payload.dateEnd = toEspoDateTime(formData.dueDate);

    if (!Object.keys(payload).length) {
      toast.error("Select at least one field to update");
      return;
    }
    onBulkUpdate(selectedIds, payload);
    onClose();
  };

  // activity operation -------
  const handleDelete = async (e, activity) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete Activity ${activity?.createdByName}?`);
    if (!ok) return;
    await onDelete(activity.id); // 👈 parent ko bol rahe ho
  };
  const createStream = async () => {
    //post activity
    setActivityForm(true);
  };
  const handlePostActivity = async (e) => {
    e.preventDefault();

    if (!activityText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setPostingActivity(true);

      const payload = {
        post: activityText,
        parentId: deal.id, // 👈 ID PAYLOAD me
        parentType: "Task", // 👈 MUST
        type: "Post",
        isInternal: false,
        attachmentsIds: [],
      };

      const newActivity = await createLeadActivity(payload);

      // 🔥 UI update instantly
      setmockStream((prev) => [newActivity, ...prev]);

      setActivityText("");
      setActivityForm(false);

      toast.success("Stream posted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to Stream post activity");
    } finally {
      setPostingActivity(false);
    }
  };


  const userOptions = users
    ?.filter((u) => u?.isActive)
    ?.map((u) => ({
      value: u.id || u.userId,
      label: u.name || u.userName || u.fullName,
    }));

  const teamOptions = team?.map((t) => ({
    value: t.id || t.teamId,
    label: t.name || t.teamName,
  }));
  const showForm = mode === "add" || isEditing;
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const toEspoDateTime = (value) => toEspoDateTimeUtc(value);

  useEffect(() => {
    if (!isOpen) {
      setmockStream([]);
    }
  }, [isOpen]);


  const getParentTypeOptions = () => {
    let options = [];

    if (formData.parentName === "Lead") {
      options = lead?.map((item) => ({
        value: item.id,
        label: item.name,
      })) || [];

      // 🔥 add load more
      if (hasMoreLeads) {
        options.push({
          value: "__load_more__",
          label: "🔍 Load More Leads...",
        });
      }
    }
    return options;
  };

  const hasMoreLeads = lead?.length >= limit;

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
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-foreground">
                {isMassUpdate
                  ? "Mass Update Tasks"
                  : mode === "add"
                    ? "Add Task"
                    : isEditing
                      ? "Edit Task"
                      : deal?.name}
              </h2>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  deal?.status,
                )}`}
              >
                {deal?.status}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {!isMassUpdate && canEditDeal(deal) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      setFormData(deal); // reset on cancel
                    }
                    setIsEditing(!isEditing);
                  }}
                >
                  <Icon name="Edit" size={16} className="mr-1" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              )}

              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {showForm && (
              <div className="p-6">
                {/* Lead Form Here */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ================= Overview ================= */}
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Name *"
                        value={formData.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ================= Assigned User ================= */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <Select
                        label="Assigned User"
                        value={formData.assignedUserId || ""}
                        options={userOptions} // 👉 later API se users
                        onChange={(value) =>
                          handleSelectChange("assignedUserId", value)
                        }
                        searchable
                      />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <Select
                        label="Teams"
                        value={formData.teamId || ""}
                        options={teamOptions} // 👉 later API se teams
                        onChange={(value) =>
                          handleSelectChange("teamId", value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Details ================= */}
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium text-foreground">Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Status"
                        value={formData.status || "New"}
                        options={STATUS_OPTIONS}
                        onChange={(value) => handleChange("status", value)}
                      />

                      <Select
                        label="priority"
                        value={formData.priority || ""}
                        options={SOURCE_OPTIONS}
                        onChange={(value) => handleChange("priority", value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="datetime-local"
                          label="Start Date"
                          value={formData.startDate || ""}
                          onChange={(e) =>
                            handleChange("startDate", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Input
                          type="datetime-local"
                          label="Due Date"
                          value={formData.dueDate || ""}
                          onChange={(e) =>
                            handleChange("dueDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Parent Name"
                        value={formData.parentName || ""}
                        options={Parent_OPTIONS}
                        onChange={(value) => {
                          handleChange("parentName", value);
                          handleChange("parentType", ""); // reset child dropdown
                        }}
                      />

                      <Select
                        label="Parent Type"
                        value={formData.parentType || ""}
                        options={getParentTypeOptions()}
                        disabled={!formData.parentName}
                        onChange={(value) => {
                          if (value === "__load_more__") {
                            setShowParentModal(true); // 🔥 open modal
                          } else {
                            handleChange("parentType", value);
                          }
                        }}
                      />
                    </div>

                    <div className="col-span-2">
                      <textarea
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        label="Description"
                        rows={4}
                        value={formData.description || ""}
                        placeholder="Description"
                        onChange={(e) =>
                          handleChange("description", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Actions ================= */}
                  <div className="flex justify-end gap-3">
                    <Button type="submit">Save Lead</Button>
                  </div>
                </form>
              </div>
            )}
            {mode !== "add" && deal && !isEditing && (
              <>
                {/* Tabs */}
                <div className="flex items-center space-x-1 p-4 border-b border-border">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`
                  flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-smooth
                  ${activeTab === tab?.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }
                `}
                    >
                      <Icon name={tab?.icon} size={16} />
                      <span>{tab?.label}</span>
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* ================= Overview ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Name */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Name
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.name || "—"}
                            </p>
                          </div>

                          {/* Phone */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Parent Name
                            </p>
                            {deal?.parentName ? (
                              <p className="text-primary hover:underline">
                                {deal.parentName}
                              </p>
                            ) : (
                              <p className="text-foreground">—</p>
                            )}
                          </div>

                          {/* Email */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Status
                            </p>
                            {deal?.status ? (
                              <p className="text-primary hover:underline break-all">
                                {deal.status}
                              </p>
                            ) : (
                              <p className="text-foreground">—</p>
                            )}
                          </div>

                          {/* WhatsApp */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Priority
                            </p>
                            {deal?.priority ? (
                              <p className="text-primary hover:underline break-all">
                                {deal.priority}
                              </p>
                            ) : (
                              <p className="text-foreground">—</p>
                            )}
                          </div>

                          {/* Next Contact */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Date Start
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.dateStart
                                ? formatDate(deal.dateStart)
                                : "—"}
                            </p>
                          </div>

                          {/* Next Contact */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Date Complete
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.dateEnd ? formatDate(deal.dateEnd) : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ================= Details ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="text-base font-semibold text-foreground mb-6">
                          Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Status */}
                          {/* Project Name */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Created By
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.createdByName || "—"}
                            </p>
                          </div>

                          {/* Preference */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Created At
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.createdAt
                                ? formatDate(deal.createdAt)
                                : "—"}
                            </p>
                          </div>

                          {/* Description */}
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">
                              Description
                            </p>
                            <p className="text-foreground leading-relaxed mt-1">
                              {deal?.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "AssignedUsers" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Assigned User */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Assigned User
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.assignedUserName || "—"}
                            </p>
                          </div>

                          {/* Followers */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Followers
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.followersNames ? (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(deal.followersNames).map(
                                    ([id, name]) => (
                                      <span
                                        key={id}
                                        className="text-sm text-primary font-medium"
                                      >
                                        {name}
                                      </span>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <span>—</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ================= Audit Information ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <h3 className="text-base font-semibold text-foreground mb-6">
                          Audit Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Created */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Created
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.createdAt
                                ? `${formatDate(deal.createdAt)} by ${deal?.createdByName || "—"}`
                                : "—"}
                            </p>
                          </div>

                          {/* Modified */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Last Modified
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.modifiedAt
                                ? `${formatDate(deal.modifiedAt)} by ${deal?.modifiedByName || "—"}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "stream" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-foreground">
                          Recent Activities
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={createStream}
                        >
                          <Icon name="Plus" size={16} className="mr-1" />
                          Add Stream
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {/* add activity form */}
                        {showActivityForm && (
                          <form onSubmit={handlePostActivity}>
                            <textarea
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              label="Activity"
                              rows={4}
                              placeholder="Write Your Comment Here..."
                              value={activityText}
                              onChange={(e) => setActivityText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setActivityForm(false);
                                  setActivityText("");
                                }}
                              >
                                Cancel
                                <Icon
                                  name="XCircle"
                                  size={16}
                                  className="mr-1"
                                />
                              </Button>

                              <Button
                                type="submit"
                                size="sm"
                                disabled={postingActivity}
                              >
                                Post
                                <Icon name="Send" size={16} className="mr-1" />
                              </Button>
                            </div>
                          </form>
                        )}
                        {mockStream?.map((stream) => (
                          <div
                            key={stream.id}
                            className="flex space-x-3 p-4 bg-muted/30 rounded-lg"
                          >
                            {/* AVATAR */}
                            <Avatar
                              name={stream.createdByName || "System"}
                              size="36"
                              round
                              textSizeRatio={2}
                              color={
                                stream.createdById === "system"
                                  ? "#9CA3AF"
                                  : undefined
                              }
                            />

                            {/* CONTENT */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-foreground">
                                    {stream.createdByName || "System"}
                                  </h4>

                                  <Icon
                                    name={getActivityIcon(stream.type)}
                                    size={14}
                                    className={getActivityIconColor(
                                      stream.type,
                                    )}
                                  />

                                  <span className="text-xs text-muted-foreground">
                                    {stream.type}
                                  </span>
                                </div>

                                <span className="text-xs text-muted-foreground">
                                  {formatDate(stream.createdAt)}
                                </span>
                                <div
                                  className={`flex items-center space-x-1 transition-opacity`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) =>
                                      handleQuickAction(e, "edit", deal)
                                    }
                                    className="h-8 w-8"
                                  >
                                    <Icon name="Edit" size={14} />
                                  </Button>

                                  {/* <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleDelete(e, stream)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Icon name="Trash2" size={14} />
                                  </Button> */}
                                </div>
                              </div>

                              {/* MESSAGE */}
                              <p className="text-sm text-muted-foreground mt-1">
                                {getActivityMessage(stream)}
                              </p>

                              {/* STATUS BADGE */}
                              {stream?.data?.value && (
                                <span
                                  className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(
                                    stream.data.value,
                                  )}`}
                                >
                                  {stream.data.value}
                                </span>
                              )}

                              {stream?.data?.statusValue && (
                                <span
                                  className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(
                                    stream.data.statusValue,
                                  )}`}
                                >
                                  {stream.data.statusValue}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}

            {isMassUpdate && (
              <>
                <p className="text-sm text-muted-foreground text-center pt-4 fw-bold">
                  Updating {selectedIds.length} selected tasks
                </p>
                <form className="space-y-6 p-6" onSubmit={handleBulkUpdate}>
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2">
                      <div className="flex gap-3 items-center">
                        <input
                          type="checkbox"
                          checked={massFields.status}
                          onChange={() => toggleMassField("status")}
                        />
                        <Select
                          label="Status"
                          value={formData.status}
                          options={STATUS_OPTIONS}
                          disabled={!massFields.status}
                          onChange={(v) => handleChange("status", v)}
                        />
                      </div>
                      <div className="flex gap-3 items-center">
                        <input
                          type="checkbox"
                          checked={massFields.priority}
                          onChange={() => toggleMassField("priority")}
                        />
                        <Select
                          label="Priority"
                          value={formData.priority}
                          options={SOURCE_OPTIONS}
                          disabled={!massFields.priority}
                          onChange={(v) => handleChange("priority", v)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2">
                      <div className="flex gap-3 items-center">
                        <input
                          type="checkbox"
                          checked={massFields.assignedUserId}
                          onChange={() => toggleMassField("assignedUserId")}
                        />
                        <Select
                          label="Assigned User"
                          value={formData.assignedUserId}
                          options={userOptions}
                          disabled={!massFields.assignedUserId}
                          onChange={(v) => handleChange("assignedUserId", v)}
                          searchable
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2">
                      <div className="flex gap-3 items-center">
                        <input
                          type="checkbox"
                          checked={massFields.dueDate}
                          onChange={() => toggleMassField("dueDate")}
                        />
                        <Input
                          type="datetime-local"
                          label="Due Date"
                          value={formData.dueDate}
                          disabled={!massFields.dueDate}
                          onChange={(e) =>
                            handleChange("dueDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update {selectedIds.length} Tasks
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
        <ParentSelectorModal
          open={showParentModal}
          type={formData.parentName}
          onClose={() => setShowParentModal(false)}
          onSelect={(item) => {
            setLead((prev) => {
              const exists = prev.find((i) => i.id === item.id);

              if (exists) return prev;

              return [item, ...prev];
            });

            handleChange("parentType", item.id);
          }}
        />
      </div>
    </>
  );
};

export default DealDrawer;
