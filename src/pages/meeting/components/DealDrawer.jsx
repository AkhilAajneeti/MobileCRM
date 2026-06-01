import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import Avatar from "react-avatar";
import ReactSelect from "react-select";
import makeAnimated from "react-select/animated";
import {
  createMeetingStream,
  meetingStreamById,
} from "services/meeting.service";
import { useUsers } from "hooks/useUsers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMetaData } from "hooks/useMetaData";
import { useTeams } from "hooks/useTeams";
import { useLeads } from "hooks/useLeads";
import { useAccounts } from "hooks/useAccounts";
import { canEditRecord } from "utils/permission";
import { toEspoDateTime, fromEspoToLocalInput } from "../../pipeline/utils/dateHelpers";
import { ParentSelectorModal } from "components/ParentSelectorModal";

// Duration option value -> minutes. Keys match DURATION_OPTIONS below.
const DURATION_TO_MINUTES = {
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "2h": 120,
  "3h": 180,
  "1d": 1440,
};

// Format a Date as a `YYYY-MM-DDTHH:mm` string for a datetime-local <input>.
const toLocalInputValue = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

// start (datetime-local string) + duration key -> end (datetime-local string).
// Returns "" when either input is missing/invalid so callers can no-op.
const computeEndFromDuration = (start, durationKey) => {
  const minutes = DURATION_TO_MINUTES[durationKey];
  if (!start || !minutes) return "";
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() + minutes);
  return toLocalInputValue(d);
};

// Reverse-map an existing start/end gap to a duration option (for edit mode),
// so the Duration select shows the saved value. "" when no exact match.
const deriveDurationKey = (start, end) => {
  if (!start || !end) return "";
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "";
  const minutes = Math.round((endMs - startMs) / 60000);
  const entry = Object.entries(DURATION_TO_MINUTES).find(
    ([, m]) => m === minutes,
  );
  return entry ? entry[0] : "";
};

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
  canEdit = true,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showActivityForm, setActivityForm] = useState(false);
  const [activityText, setActivityText] = useState("");
  const [postingActivity, setPostingActivity] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [modalType, setModalType] = useState("parent");
  const [formData, setFormData] = useState({
    name: "",
    assignedUserId: "",
    teamId: "",
    status: "",
    priority: "",
    duration: "",
    startDate: "",
    dueDate: "",
    description: "",
    parentName: "",
    parentType: "",
    attendeeUsers: [],
    attendeeLeads: [],
  });
  const queryClient = useQueryClient();
  const animatedComponents = makeAnimated();
  const { data: meta } = useMetaData();
  const { data: teamData } = useTeams();
  // const { data: accountData } = useAccounts({ limit, page });
  const { data: leadsData } = useLeads({ limit: 10, page: 1 });
  useEffect(() => {
    if (mode === "add") {
      setFormData({
        name: "",
        assignedUserId: "",
        teamId: "",
        status: "",
        priority: "",
        duration: "",
        startDate: "",
        dueDate: "",
        joinUrl: "",
        description: "",
        parentName: "", // Account | Lead | Contact (TYPE)
        parentType: "", // record ID
        attendeeUsers: [],
        attendeeLeads: [],
      });
    } else if (deal) {
      setFormData({
        name: deal.name || "",
        assignedUserId: deal.assignedUserId || "",
        teamId: deal.teamId?.[0] || "",
        status: deal.status || "",
        priority: deal.priority || "",
        // Derive the duration option from the saved start/end gap so the
        // Duration select reflects the stored meeting length on open.
        duration: deriveDurationKey(
          fromEspoToLocalInput(deal.dateStart),
          fromEspoToLocalInput(deal.dateEnd),
        ),
        startDate: fromEspoToLocalInput(deal.dateStart),
        dueDate: fromEspoToLocalInput(deal.dateEnd),
        joinUrl: deal.joinUrl || "",
        description: deal.description || "",
        parentName: deal.parentType || "",
        parentType: deal.parentId || "",
        attendeeUsers: (deal.usersIds || []).map((id) => ({
          value: id,
          label: deal.usersNames?.[id] || "Unknown",
        })),
        attendeeLeads: deal.attendeesLeadsIds || [],
      });
    }
  }, [deal, mode]);

  const { data: streamData } = useQuery({
    queryKey: ["meetingStream", deal?.id],
    queryFn: () => meetingStreamById(deal.id),
    enabled: isOpen && !!deal?.id,
  });
  // mass update
  const { data: usersData } = useUsers();
  const users = usersData?.list || [];
  const isMassUpdate = mode === "mass-update";
  const mockStream = streamData?.list || [];
  const [massFields, setMassFields] = useState({
    status: false,
    usersIds: false,
    startDate: false,
    dueDate: false,
  });
  const toggleMassField = (field) => {
    setMassFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };


  const team = teamData?.list || [];
  // const acc = accountData?.list || [];
  const lead = leadsData?.list || [];
  const STATUS_OPTIONS = [
    { value: "Planned", label: "Planned" },
    { value: "Held", label: "Held" },
    { value: "Not Held", label: "Not Held" },
  ];
  const Parent_OPTIONS = [
    // { value: "Account", label: "Account" },
    { value: "Lead", label: "Lead" },
  ];
  const DURATION_OPTIONS = [
    { value: "15m", label: "15m" },
    { value: "30m", label: "30m" },
    { value: "1h", label: "1h" },
    { value: "2h", label: "2h" },
    { value: "3h", label: "3h" },
    { value: "1d", label: "1d" },
  ];
  const currentUserId = JSON.parse(localStorage.getItem("login_object"))?.id;

  const canEditDeal = (deal) =>
    canEditRecord("Meeting", deal) &&
    deal?.assignedUserId === currentUserId;
  const formatDate = (date) => {
    if (!date) return "—";

    // EspoCRM datetimes are UTC; append Z so the local timezone is applied.
    const safeDate =
      typeof date === "string" && date.length > 10
        ? `${date.replace(" ", "T")}Z`
        : date;
    const parsed = new Date(safeDate);

    if (isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStageColor = (stage) => {
    const colors = {
      Planned: "bg-blue-100 text-blue-800",
      "Not Held": "bg-red-100 text-red-800",
      Held: "bg-green-100 text-green-800",
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

  const getActivityMessage = (activity) => {
    const { type, post, data, createdByName } = activity;

    if (type === "Post") {
      return post;
    }

    if (type === "Assign") {
      return `Assigned to ${data?.assignedUserName}`;
    }

    if (type === "Create") {
      return "Lead was created";
    }

    if (type === "Update") {
      if (data?.value) {
        return `Status updated to ${data.value}`;
      }
      return "Lead updated";
    }

    return "Activity updated";
  };

  const handleChange = (key, value) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      // Auto-update Date End whenever Start Date or Duration changes — using
      // whichever values are now current. A blank/invalid combo leaves the
      // existing dueDate alone so manual edits aren't wiped.
      if (key === "startDate" || key === "duration") {
        const computedEnd = computeEndFromDuration(
          key === "startDate" ? value : next.startDate,
          key === "duration" ? value : next.duration,
        );
        if (computedEnd) next.dueDate = computedEnd;
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error("Meeting name is required");
      return;
    }
    const allUserIds = [
      formData.assignedUserId,
      ...(formData.attendeeUsers?.map((u) => u.value) || []),
    ].filter(Boolean);

    const uniqueUserIds = [...new Set(allUserIds)];
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
      joinUrl: formData.joinUrl || "",

      // ✅ CORRECT parent mapping
      parentType: formData.parentName || null, // Account
      parentId: formData.parentType || null, // record ID
      usersIds: uniqueUserIds,
      usersColumns: uniqueUserIds.reduce((acc, id) => {
        acc[id] = { status: "Accepted" }; // 🔥 default status
        return acc;
      }, {}),
      // attendeesContactsIds: formData.attendeeContacts || [],
      attendeesLeadsIds: formData.attendeeLeads || [],
    };

    console.log("FINAL Meeting PAYLOAD 👉", payload);

    try {
      if (mode === "add") {
        // ✅ CREATE
        await onCreate(payload);
      } else {
        // ✅ UPDATE (id MUST be passed)
        await onUpdate(deal.id, payload);
        queryClient.invalidateQueries(["meeting", deal.id]);
        queryClient.invalidateQueries(["meetings"]);
      }

      onClose();
    } catch (err) {
      console.error("Meeting creation failed", err);
      toast.error("Meeting is not created");
    }
  };
  const handleBulkUpdate = async (e) => {
    e.preventDefault();

    const payload = {};

    if (massFields.status) payload.status = formData.status;
    if (massFields.usersIds)
      payload.attendeesUsersIds = formData.attendeeUsers.map((u) => u.value);
    if (massFields.startDate)
      payload.dateStart = toEspoDateTime(formData.startDate);
    if (massFields.dueDate) payload.dateEnd = toEspoDateTime(formData.dueDate);

    if (!Object.keys(payload).length) {
      toast.error("Select at least one field to update");
      return;
    }
    onBulkUpdate(payload);
    onClose();
  };

  // activity operation -------
  const handleDelete = async (e, activity) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete Activity ${activity?.createdByName}?`);
    if (!ok) return;
    await onDelete(activity.id); // 👈 parent ko bol rahe ho
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
        parentType: "Meeting", // 👈 MUST
        type: "Post",
        isInternal: false,
        attachmentsIds: [],
      };

      await createMeetingStream(payload);
      queryClient.invalidateQueries(["meetingStream", deal.id]);

      setActivityText("");
      setActivityForm(false);

      toast.success("Activity posted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post activity");
    } finally {
      setPostingActivity(false);
    }
  };

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
  const leadOptions = (lead || []).map((l) => ({
    value: l.id,
    label: l.name,
  }));

  const showForm = mode === "add" || isEditing;
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const createStream = async () => {
    //post activity
    setActivityForm(true);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "—";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs && mins) return `${hrs}h ${mins}m`;
    if (hrs) return `${hrs}h`;
    return `${mins}m`;
  };

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
  const getAttendeeLeadOptions = () => {
    let options =
      lead?.map((item) => ({
        value: item.id,
        label: item.name,
      })) || [];

    if (hasMoreLeads) {
      options.push({
        value: "__load_more_attendees__",
        label: "🔍 Load More Leads...",
      });
    }

    return options;
  };
  const hasMoreLeads = lead?.length >= limit;
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setActiveTab("overview");
    }
  }, [isOpen]);
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
                  ? "Mass Update Meeting"
                  : mode === "add"
                    ? "Add Meeting"
                    : isEditing
                      ? "Edit Meeting"
                      : deal?.name}
              </h2>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageColor(
                  deal?.status,
                )}`}
              >
                {deal?.status}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {!isMassUpdate && canEditDeal(deal) && canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false); // reset on cancel
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
                        label="Duration"
                        value={formData.duration || ""}
                        options={DURATION_OPTIONS}
                        onChange={(value) => handleChange("duration", value)}
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
                          label="Date End"
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
                            setModalType("parent");
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
                    <div className="col-span-2">
                      <Input
                        type="text"
                        label="Meeting Link"
                        value={formData.joinUrl || ""}
                        onChange={(e) =>
                          handleChange("joinUrl", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Details ================= */}
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium text-foreground">Attendees</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-y-1">
                        <label className="text-sm font-medium">User</label>
                        <ReactSelect
                          label="eeee"
                          isMulti
                          closeMenuOnSelect={false}
                          components={animatedComponents}
                          options={userOptions}
                          value={formData.attendeeUsers}
                          onChange={(value) =>
                            handleChange("attendeeUsers", value)
                          }
                          placeholder="Search users..."
                          classNamePrefix="react-select"
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              minHeight: "42px",
                              borderColor: state.isFocused
                                ? "#a3d9a5"
                                : "#a3d9a5",
                              boxShadow: "none",
                              "&:hover": { borderColor: "#6366f1" },
                            }),
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: "#EEF2FF",
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: "#000",
                              fontWeight: 500,
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: "#e8a8a0",
                              ":hover": {
                                backgroundColor: "#e8a8a0",
                                color: "#fff",
                              },
                            }),
                          }}
                        />
                      </div>
                      <Select
                        label="Leads"
                        value={formData.attendeeLeads}
                        options={getAttendeeLeadOptions()}
                        placeholder="Search leads..."
                        onChange={(value) => {
                          if (value === "__load_more_attendees__") {
                            setModalType("attendee");
                            setShowParentModal(true); // 🔥 open modal
                          } else {
                            handleChange("attendeeLeads", value);
                          }
                        }}
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

                          {/* Duration */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Duration
                            </p>
                            <p className="text-foreground font-medium">
                              {formatDuration(deal?.duration)}
                            </p>
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
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground mb-1">
                              Meeting Link
                            </p>

                            <div className="flex items-center justify-between border rounded-lg p-2 bg-muted/30">
                              <p className="text-sm text-foreground truncate">
                                {deal?.joinUrl || "—"}
                              </p>

                              {deal?.joinUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(deal.joinUrl);
                                    toast.success("Link copied!");
                                  }}
                                  className="ml-3 text-muted-foreground hover:text-primary transition"
                                >
                                  <Icon name="Copy" size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "AssignedUsers" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Assigned User */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Assigned User
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.assignedUserName || "—"}
                            </p>
                          </div>
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

                          {/* Users */}
                          <div className="grid-cols-1 col-span-2">
                            <p className="text-sm text-muted-foreground">
                              User Names
                            </p>
                            <p className="text-foreground font-medium">
                              <div className="flex flex-wrap gap-2">
                                <div className="flex flex-wrap gap-3">
                                  {deal?.usersNames &&
                                    Object.entries(deal.usersNames).map(
                                      ([id, name]) => {
                                        const status =
                                          deal?.usersColumns?.[id]?.status;

                                        const statusConfig = {
                                          Accepted: {
                                            color:
                                              "bg-emerald-100 text-emerald-700",
                                            dot: "bg-emerald-500",
                                          },
                                          Declined: {
                                            color: "bg-rose-100 text-rose-700",
                                            dot: "bg-rose-500",
                                          },
                                          Tentative: {
                                            color:
                                              "bg-amber-100 text-amber-700",
                                            dot: "bg-amber-500",
                                          },
                                          "Needs Action": {
                                            color: "bg-gray-100 text-gray-600",
                                            dot: "bg-gray-400",
                                          },
                                        };

                                        const config =
                                          statusConfig[status] ||
                                          statusConfig["Needs Action"];

                                        return (
                                          <div
                                            key={id}
                                            className="group flex items-center gap-3 px-3 py-2 rounded-xl 
                     bg-white/60 backdrop-blur-md border border-gray-200 
                     shadow-sm hover:shadow-md transition-all duration-200"
                                          >
                                            {/* Avatar */}
                                            <Avatar
                                              name={name}
                                              size="32"
                                              round
                                              textSizeRatio={2}
                                              className="!text-sm"
                                            />

                                            {/* Name */}
                                            <div className="flex flex-col">
                                              <span className="text-sm font-semibold text-gray-800 leading-tight">
                                                {name}
                                              </span>

                                              {/* Status */}
                                              <div className="flex items-center gap-1 mt-0.5">
                                                <span
                                                  className={`w-2 h-2 rounded-full ${config.dot}`}
                                                ></span>
                                                <span className="text-xs text-gray-500">
                                                  {status || "No Response"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      },
                                    )}
                                </div>
                              </div>
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
                                    // onClick={(e) =>
                                    //   handleQuickAction(e, "edit", deal)
                                    // }
                                    className="h-8 w-8"
                                  >
                                    <Icon name="Edit" size={14} />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleDelete(e, stream)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Icon name="Trash2" size={14} />
                                  </Button>
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
                  Updating {selectedIds.length} selected Meeting
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
                          checked={massFields.assignedUserId}
                          onChange={() => toggleMassField("assignedUserId")}
                        />
                        <Select
                          label="Assigned User"
                          value={formData.assignedUserId}
                          options={userOptions}
                          disabled={!massFields.assignedUserId}
                          onChange={(v) => handleChange("assignedUserId", v)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2">
                      <div className="flex gap-3 items-center">
                        <input
                          type="checkbox"
                          checked={massFields.startDate}
                          onChange={() => toggleMassField("startDate")}
                        />

                        <Input
                          type="datetime-local"
                          label="Start Date"
                          value={formData.startDate}
                          disabled={!massFields.dueDate}
                          onChange={(e) =>
                            handleChange("startDate", e.target.value)
                          }
                        />
                        <input
                          type="checkbox"
                          checked={massFields.dueDate}
                          onChange={() => toggleMassField("dueDate")}
                        />
                        <Input
                          type="datetime-local"
                          label="End Date"
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
                    <Button type="button" variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update {selectedIds.length} Meeting
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
            if (modalType === "parent") {
              handleChange("parentType", item.id);
            } else {
              handleChange("attendeeLeads", item.id);
            }
          }}
        />
      </div>
    </>
  );
};

export default DealDrawer;
