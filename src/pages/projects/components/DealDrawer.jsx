import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import ReactSelect from "react-select";
import { fetchUser } from "services/user.service";
import { fetchTeam } from "services/team.service";
import { fetchContacts } from "services/contact.service";
import makeAnimated from "react-select/animated";
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
  const [users, setUsers] = useState([]);
  const [team, setTeam] = useState([]);


  const [contact, setContact] = useState([]);
  const [mockStream, setmockStream] = useState([]);
  const [showActivityForm, setActivityForm] = useState(false);
  const [activityText, setActivityText] = useState("");
  const [postingActivity, setPostingActivity] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    assignedUserId: "",
    teamId: "",
    address: "",
    description: "",
    parentName: "",
    parentType: "",
    collaboratorsIds: "",
  });
  useEffect(() => {
    if (mode === "add") {
      setFormData({
        name: "",
        assignedUserId: "",
        teamId: "",
        address: "",
        description: "",
        parentName: "", // Account | Lead | Contact (TYPE)
        parentType: "",
        collaboratorsIds: "",
      });
    } else if (deal) {
      setFormData({
        name: deal.name || "",
        address: deal.address || "",
        assignedUserId: deal.assignedUserId || "",
        teamId: deal.teamId || "",
        collaboratorsIds: deal.collaboratorsIds || "",
        description: deal.description || "",
        parentName: deal.parentType || "",
        parentType: deal.parentId || "",
      });
    }
  }, [deal, mode]);
  // mass update
  const isMassUpdate = mode === "mass-update";
  const animatedComponents = makeAnimated();
  const [massFields, setMassFields] = useState({
    status: false,
    priority: false,
    assignedUserId: false,
    dueDate: false,
  });
  const toggleMassField = (field) => {
    setMassFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // if (!isOpen) return null;
  const handleFieldListChange = (selectedOptions) => {
    const selected = selectedOptions || [];

    setFormData((prev) => ({
      ...prev,
      fieldList: selected,
    }));
  };
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

  const tabs = [
    { id: "overview", label: "Overview", icon: "Eye" },
    { id: "Teams", label: "Teams / Collaborators", icon: "Users" },
  ];

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
      assignedUserId: formData.assignedUserId || null,
      // ✅ TASK expects ARRAY
      teamsIds: formData.teamId ? [formData.teamId] : [],
      address: formData.address || "",
      description: formData.description || "",

      // ✅ CORRECT parent mapping
      parentType: formData.parentName || null, // Account
      parentId: formData.parentType || null, // record ID
      collaboratorsIds: formData.collaboratorsIds || null, // record ID
      attachmentsIds: [],
      reminders: [],
    };

    console.log("FINAL TASK PAYLOAD 👉", payload);

    try {
      if (mode === "add") {
        // ✅ CREATE
        await onCreate(payload);
      } else {
        // ✅ UPDATE (id MUST be passed)
        await onUpdate(deal.id, payload);
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, teamRes, contactRes] =
          await Promise.all([
            fetchUser(),
            fetchTeam(),


            fetchContacts(),
          ]);

        setUsers(usersRes.list || []);
        setTeam(teamRes.list || []);

        setContact(contactRes.list || []);
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
            </div>
            <div className="flex items-center space-x-2">
              {!isMassUpdate && (
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
                      <Input
                        label="Address"
                        value={formData.address || ""}
                        onChange={(e) =>
                          handleChange("address", e.target.value)
                        }
                      />
                      <Select
                        label="Assigned User"
                        value={formData.assignedUserId || ""}
                        options={userOptions} // 👉 later API se users
                        onChange={(value) =>
                          handleSelectChange("assignedUserId", value)
                        }
                      />
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

                  {/* ================= Assigned User ================= */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4 col-span-2">
                      <h2>Collaborator</h2>
                      <ReactSelect
                        isMulti
                        closeMenuOnSelect={false}
                        components={animatedComponents}
                        options={userOptions}
                        value={userOptions.filter((option) =>
                          formData.collaboratorsIds?.includes(option.value),
                        )}
                        onChange={(value) =>
                          handleSelectChange(
                            "collaboratorsIds",
                            value.map((s) => s.value),
                          )
                        }
                        placeholder="Select Collaborators."
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
                    <Button type="submit">Save Project</Button>
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
                              Created By
                            </p>
                            {deal?.createdByName ? (
                              <p className="text-primary hover:underline">
                                {deal.createdByName}
                              </p>
                            ) : (
                              <p className="text-foreground">—</p>
                            )}
                          </div>

                          {/* Email */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Assigned User
                            </p>
                            {deal?.assignedUserName ? (
                              <p className="text-primary hover:underline break-all">
                                {deal.assignedUserName}
                              </p>
                            ) : (
                              <p className="text-foreground">—</p>
                            )}
                          </div>

                          {/* WhatsApp */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Last Assigned User
                            </p>
                            {deal?.lastAssignedUser ? (
                              <p className="text-primary hover:underline break-all">
                                {deal.lastAssignedUser}
                              </p>
                            ) : (
                              <p className="text-foreground">—</p>
                            )}
                          </div>

                          {/* Next Contact */}
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

                          {/* Next Contact */}
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Modified At
                            </p>
                            <p className="text-foreground font-medium">
                              {deal?.modifiedAt
                                ? formatDate(deal.modifiedAt)
                                : "—"}
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
                          {/* Description */}
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">
                              Address
                            </p>
                            <p className="text-foreground leading-relaxed mt-1">
                              {deal?.address}
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

                  {activeTab === "Teams" && (
                    <div className="space-y-6">
                      {/* ================= Assigned User ================= */}
                      <div className="border border-border rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Assigned User */}
                          <div>
                            <p className="text-md text-muted-foreground">
                              Teams
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {deal?.teamsNames &&
                                Object.values(deal.teamsNames).map(
                                  (team, i) => (
                                    <span
                                      key={i}
                                      className="px-3 py-1 text-xs bg-primary text-white rounded-full"
                                    >
                                      {team}
                                    </span>
                                  ),
                                )}
                            </div>
                          </div>

                          {/* Followers */}
                          <div>
                            <p className="text-md text-muted-foreground">
                              Followers
                            </p>
                            <p className="text-primary font-medium">
                              {deal?.collaboratorsNames &&
                                Object.values(deal?.collaboratorsNames).join(
                                  " , ",
                                )}
                            </p>
                          </div>
                        </div>
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
      </div>
    </>
  );
};

export default DealDrawer;
