import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import { fetchTeam } from "services/team.service";
import ReactSelect from "react-select";
import makeAnimated from "react-select/animated";
import {
  integrateAcc,
  updateIntergrateAcc,
} from "services/intergration.service";

const DealDrawer = ({
  deal,
  isOpen,
  onClose,
  mode,
  integrations,
  onUpdate,
  onDelete,
  leadsDetails,
  selectedIds = [],
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [team, setTeam] = useState([]);
  const [mockStream, setmockStream] = useState([]);
  const [mockActivities, setActivities] = useState([]);
  const [showActivityForm, setActivityForm] = useState(false);
  const [drawerMode, setDrawerMode] = useState(mode);
  const [postingActivity, setPostingActivity] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    isActive: "",
    leadSource: "",
    targetTeamId: "",
    fieldList: [],
    requiredFields: [],
  });
  const animatedComponents = makeAnimated();

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "add") {
      setDrawerMode("add");
      setIsEditing(false);
      setFormData({
        name: "",
        isActive: "",
        leadSource: "",
        targetTeamId: "",
        fieldList: [],
        requiredFields: [],
      });
    }

    if (mode === "edit") {
      setDrawerMode("edit");
      setIsEditing(true);
    }

    if (mode === "view") {
      setDrawerMode("view");
      setIsEditing(false);
    }
  }, [mode, isOpen]);

  const LEADSOURCE = [
    { value: "Facebook", label: "Facebook" },
    { value: "IVR", label: "IVR" },
    { value: "Web Site", label: "Web Site" },
  ];
  const activeOptions = [
    { value: true, label: "Active" },
    { value: false, label: "Inactive" },
  ];
  const toggleActivity = (id) => {
    setExpandedActivityId((prev) => (prev === id ? null : id));
  };

  const formatDate = (date) => {
    if (!date) return "—";

    // EspoCRM datetimes are UTC; append Z so display uses local tz.
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
  const formatDateTime = (value) => {
    if (!value) return "—";

    const safe =
      typeof value === "string" && value.length > 10
        ? `${value.replace(" ", "T")}Z`
        : value;
    const date = new Date(safe);

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    { id: "requests", label: "Requests", icon: "FileText" },
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
    if (activity._scope === "Call") {
      return `${activity.direction || "Call"} call scheduled`;
    }

    if (activity._scope === "Meeting") {
      return "Meeting scheduled";
    }

    return "Activity updated";
  };

  const handleRequiredChange = (selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      requiredFields: selectedOptions || [],
    }));
  };
  const FIELDLIST = [
    { value: "firstName", label: "First Name" },
    { value: "lastName", label: "Last Name" },
    { value: "emailAddress", label: "Email" },
    { value: "phoneNumber", label: "Phone" },
    { value: "addressCity", label: "City" },
    { value: "cProjectName", label: "Project Name" },
    { value: "accountName", label: "Account Name" },
    { value: "description", label: "Description" },
    { value: "cLeadReceived", label: "Lead Received" },
    { value: "cNextContact", label: "Next Contact" },
    { value: "industry", label: "Industry" },
  ];

  const handleFieldListChange = (selectedOptions) => {
    const selected = selectedOptions || [];

    setFormData((prev) => ({
      ...prev,
      fieldList: selected,

      // remove required fields that are no longer selected
      requiredFields: prev.requiredFields.filter((req) =>
        selected.some((field) => field.value === req.value),
      ),
    }));
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (drawerMode === "edit" && deal) {
      setFormData({
        name: deal?.name,
        isActive: {
          value: deal?.isActive,
          label: deal?.isActive ? "Active" : "Inactive",
        },
        leadSource: deal?.leadSource,
        targetTeamId: deal?.targetTeamId,
        fieldList:
          deal?.fieldList?.map((f) => ({
            value: f,
            label: f,
          })) || [],
        requiredFields: deal?.fieldParams
          ? Object.keys(deal.fieldParams)
              .filter((key) => deal.fieldParams[key]?.required)
              .map((key) => ({
                value: key,
                label: key,
              }))
          : [],
      });
    }
  }, [drawerMode, deal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convert fieldList to string array
      const fieldListValues = formData.fieldList.map((f) => f.value);

      // Convert requiredFields to fieldParams object
      const fieldParams = {};
      formData.requiredFields.forEach((field) => {
        fieldParams[field.value] = { required: true };
      });

      const payload = {
        name: formData?.name,
        isActive: formData?.isActive?.value ?? formData?.isActive,
        leadSource: formData?.leadSource,
        targetTeamId: formData?.targetTeamId,
        fieldList: fieldListValues,
        fieldParams: fieldParams,
        subscribeToTargetList: false,
      };

      console.log("FINAL PAYLOAD:", payload);

      await integrateAcc(payload);
      toast.success("Lead Capture Created Successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create Lead Capture");
    }
  };
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const fieldListValues = formData.fieldList.map((f) => f.value);

      const fieldParams = {};
      formData.requiredFields.forEach((field) => {
        fieldParams[field.value] = { required: true };
      });

      const payload = {
        name: formData?.name,
        isActive:
          typeof formData?.isActive === "object"
            ? formData?.isActive?.value
            : formData?.isActive,
        leadSource: formData?.leadSource?.value || formData?.leadSource,
        targetTeamId: formData?.targetTeamId?.value || formData?.targetTeamId,
        fieldList: fieldListValues,
        fieldParams,
        subscribeToTargetList: false,
      };

      console.log("UPDATE PAYLOAD:", payload);

      await updateIntergrateAcc(deal?.id, payload);

      toast.success("Integration Updated Successfully");

      setDrawerMode("view"); // 🔥 switch back to view mode
    } catch (error) {
      console.error(error);
      toast.error("Failed to update Integration");
    }
  };

  // activity operation -------
  // fetching lead stream from id

  const handleDelete = async (e, activity) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete Stream ${activity?.createdByName}?`);
    if (!ok) return;
    await onDelete(activity.id); // 👈 parent ko bol rahe ho
  };
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamRes] = await Promise.all([fetchTeam()]);
        setTeam(teamRes.list || []);
      } catch (err) {
        console.error("Failed to load team", err);
      }
    };

    loadData();
  }, []);

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
                {drawerMode === "add"
                  ? "Create Integration"
                  : drawerMode === "edit"
                    ? "Edit Integration"
                    : deal?.name}
              </h2>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${deal?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              ></span>
            </div>

            <div className="flex items-center space-x-2">
              {drawerMode === "view" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawerMode("edit")}
                >
                  <Icon name="Edit" size={16} className="mr-1" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>
          <div className="flex border-b border-border">
            {/* Tabs */}
            {/* Tabs */}
            {drawerMode !== "add" && drawerMode !== "edit" && (
              <div className="flex border-b border-border overflow-x-scroll md:overflow-hidden ">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                    flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }
                  `}
                  >
                    <Icon name={tab.icon} size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {drawerMode === "add" && (
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
                      <Select
                        label="Active"
                        value={formData.isActive || ""}
                        options={activeOptions} // 👉 later API se teams
                        onChange={(value) =>
                          handleSelectChange("isActive", value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Assigned User ================= */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <Select
                        label="Lead Source"
                        value={formData.leadSource || ""}
                        options={LEADSOURCE} // 👉 later API se users
                        onChange={(value) =>
                          handleSelectChange("leadSource", value)
                        }
                      />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <Select
                        label="Teams"
                        value={formData.targetTeamId || ""}
                        options={teamOptions} // 👉 later API se teams
                        onChange={(value) =>
                          handleSelectChange("targetTeamId", value)
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <ReactSelect
                      isMulti
                      closeMenuOnSelect={false}
                      components={animatedComponents}
                      options={FIELDLIST}
                      value={formData.fieldList}
                      onChange={handleFieldListChange}
                      placeholder="Select Field List..."
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "42px",
                          borderColor: state.isFocused ? "#a3d9a5" : "#a3d9a5",
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
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <ReactSelect
                      isMulti
                      closeMenuOnSelect={false}
                      components={animatedComponents}
                      options={formData.fieldList}
                      value={formData.requiredFields}
                      onChange={handleRequiredChange}
                      placeholder="Select Required Fields..."
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "42px",
                          borderColor: state.isFocused ? "#a3d9a5" : "#a3d9a5",
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

                  {/* ================= Actions ================= */}
                  <div className="flex justify-end gap-3">
                    <Button type="submit">Save Lead</Button>
                  </div>
                </form>
              </div>
            )}

            {drawerMode === "edit" && (
              <div className="p-6">
                {/* Lead Form Here */}
                <form onSubmit={handleUpdate} className="space-y-6">
                  {/* ================= Overview ================= */}
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Name *"
                        value={formData.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                      />
                      <Select
                        label="Active"
                        value={formData.isActive || ""}
                        options={activeOptions} // 👉 later API se teams
                        onChange={(value) =>
                          handleSelectChange("isActive", value)
                        }
                      />
                    </div>
                  </div>

                  {/* ================= Assigned User ================= */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <Select
                        label="Lead Source"
                        value={formData.leadSource || ""}
                        options={LEADSOURCE} // 👉 later API se users
                        onChange={(value) =>
                          handleSelectChange("leadSource", value)
                        }
                      />
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <Select
                        label="Teams"
                        value={formData.targetTeamId || ""}
                        options={teamOptions} // 👉 later API se teams
                        onChange={(value) =>
                          handleSelectChange("targetTeamId", value)
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <ReactSelect
                      isMulti
                      closeMenuOnSelect={false}
                      components={animatedComponents}
                      options={FIELDLIST}
                      value={formData.fieldList}
                      onChange={handleFieldListChange}
                      placeholder="Select Field List..."
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "42px",
                          borderColor: state.isFocused ? "#a3d9a5" : "#a3d9a5",
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
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <ReactSelect
                      isMulti
                      closeMenuOnSelect={false}
                      components={animatedComponents}
                      options={formData.fieldList}
                      value={formData.requiredFields}
                      onChange={handleRequiredChange}
                      placeholder="Select Required Fields..."
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "42px",
                          borderColor: state.isFocused ? "#a3d9a5" : "#a3d9a5",
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

                  {/* ================= Actions ================= */}
                  <div className="flex justify-end gap-3">
                    <Button type="submit">Save Lead</Button>
                  </div>
                </form>
              </div>
            )}
            {drawerMode === "view" && deal && activeTab === "overview" && (
              <div className="p-6 space-y-6">
                {/* Overview Card */}
                <div className="border border-border rounded-xl p-6">
                  <h3 className="text-base font-semibold mb-6">Overview</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{deal?.name || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          deal?.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {deal?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Lead Source
                      </p>
                      <p>{deal?.leadSource || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Team</p>
                      <p>{deal?.targetTeamName || "—"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">API Key</p>
                      <p className="break-all text-xs bg-muted p-2 rounded">
                        {deal?.apiKey || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Fields</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {deal?.fieldList?.length
                          ? deal.fieldList.map((field) => (
                              <span
                                key={field}
                                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full"
                              >
                                {field}
                              </span>
                            ))
                          : "—"}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Created At
                      </p>
                      <p>{formatDateTime(deal?.createdAt)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Modified At
                      </p>
                      <p>{formatDateTime(deal?.modifiedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Created By
                      </p>
                      <p>{deal?.createdByName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {drawerMode === "view" && deal && activeTab === "requests" && (
              <div className="p-6 space-y-6">
                <div className="border border-border rounded-xl p-6">
                  <h3 className="text-base font-semibold mb-6">
                    API Request Details
                  </h3>

                  {/* URL */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">URL</p>
                    <div className="bg-muted p-3 rounded text-xs break-all">
                      {deal?.exampleRequestUrl}
                    </div>
                  </div>

                  {/* Method */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Method</p>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {deal?.exampleRequestMethod}
                    </span>
                  </div>

                  {/* Headers */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Headers
                    </p>
                    <div className="bg-muted p-3 rounded text-xs">
                      {deal?.exampleRequestHeaders}
                    </div>
                  </div>

                  {/* Sample Body */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Sample Body
                    </p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {deal?.exampleRequestPayload}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DealDrawer;
