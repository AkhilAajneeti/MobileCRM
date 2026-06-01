import React, { useEffect, useState } from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import Select from "components/ui/Select";
import Input from "components/ui/Input";
import toast from "react-hot-toast";
import Avatar from "react-avatar";
import { useUsers } from "hooks/useUsers";
import { useTeams } from "hooks/useTeams";
import { fetchLeads } from "services/leads.service";
import { fetchAccounts } from "services/account.service";
import { canEditRecord } from "utils/permission";
import { ParentSelectorModal } from "components/ParentSelectorModal";
import {
  toEspoDateTime as toEspoDateTimeUtc,
  fromEspoToLocalInput,
} from "../pages/pipeline/utils/dateHelpers";

const ActivityDrawer = ({
    deal,
    entityType = "task",
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
    const { data: usersData } = useUsers();
    const { data: teamData } = useTeams();

    const limit = 10;
    const users = usersData?.list || [];
    const team = teamData?.list || [];
    const isMeeting = entityType === "meeting";
    const entityLabel = isMeeting ? "Meeting" : "Task";
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
        joinUrl: "",
        attendeeUsers: [],
        attendeeLeads: [],
    });
    useEffect(() => {
        if (mode === "add") {
            setFormData({
                name: "",
                assignedUserId: deal?.assignedUserId || "",
                teamId:
                    deal?.teamId ||
                    deal?.teamsIds?.[0] ||
                    "",
                status: isMeeting ? "Planned" : "Not Started",
                priority: isMeeting ? "30m" : "Normal",
                startDate: "",
                dueDate: "",
                description: "",
                parentName: deal?.parentType || "",
                parentType: deal?.parentId || "",
                joinUrl: "",
                attendeeUsers: [],
                attendeeLeads: [],
            });

        } else if (deal) {
            setFormData({
                name: deal.name || "",
                assignedUserId: deal.assignedUserId || "",
                teamId: deal.teamId || deal.teamsIds?.[0] || "",
                status: deal.status || "",
                priority: deal.priority || "",
                startDate: deal.startDate || fromEspoToLocalInput(deal.dateStart) || "",
                dueDate: deal.dueDate || fromEspoToLocalInput(deal.dateEnd) || "",
                description: deal.description || "",
                parentName: deal.parentType || "",
                parentType: deal.parentId || "",
                joinUrl: deal.joinUrl || "",
                attendeeUsers: (deal.usersIds || []).filter((id) => id !== deal.assignedUserId),
                attendeeLeads: deal.attendeesLeadsIds || [],
            });
        }
    }, [deal, mode, isMeeting]);
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


    // mockactivities 

    const STATUS_OPTIONS =
        entityType === "meeting"
            ? [
                { value: "Planned", label: "Planned" },
                { value: "Held", label: "Held" },
                { value: "Not Held", label: "Not Held" },
            ]
            : [
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
    const SOURCE_OPTIONS =
        entityType === "meeting"
            ? [
                { value: "15m", label: "15m" },
                { value: "30m", label: "30m" },
                { value: "1h", label: "1h" },
                { value: "2h", label: "2h" },
                { value: "3h", label: "3h" },
            ]
            : [
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

                if (formData.parentName === "Lead" || isMeeting) {
                    const res = await fetchLeads({ limit: 10, page: 1 });
                    setLead(res.list || []);
                }

            } catch (err) {
                console.error("Parent fetch failed", err);
                toast.error("Failed to load parent data");
            }
        };

        if (formData.parentName || isMeeting) {
            loadParentData();
        }
    }, [formData.parentName, isMeeting]);
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
            toast.error(
                `${entityLabel} name is required`
            );
            return;
        }

        const payload = {
            // ✅ TASK REQUIRED
            name: formData.name.trim(),
            status:
                formData.status ||
                (isMeeting
                    ? "Planned"
                    : "Not Started"),

            priority:
                formData.priority ||
                (isMeeting
                    ? "30m"
                    : "Normal"),

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

        if (isMeeting) {
            const usersIds = [
                formData.assignedUserId,
                ...(formData.attendeeUsers || []),
            ].filter(Boolean);
            const uniqueUsersIds = [...new Set(usersIds)];

            payload.joinUrl = formData.joinUrl || "";
            payload.usersIds = uniqueUsersIds;
            payload.usersColumns = uniqueUsersIds.reduce((acc, id) => {
                acc[id] = { status: "Accepted" };
                return acc;
            }, {});
            payload.attendeesLeadsIds = formData.attendeeLeads || [];

            delete payload.attachmentsIds;
            delete payload.reminders;
        }


        try {
            if (mode === "add") {
                // ✅ CREAT E
                await onCreate(payload);
                toast.success(`${entityLabel} is created`);
            } else {
                // ✅ UPDATE (id MUST be passed)
                await onUpdate(deal.id, payload);
                toast.success(`${entityLabel} is updated`);
            }

            onClose();
        } catch (err) {
            console.error(`${entityLabel} save failed`, err);
            toast.error(`${entityLabel} is not saved`);
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
    const leadOptions = lead?.map((item) => ({
        value: item.id,
        label: item.name,
    })) || [];
    const showForm = mode === "add" || isEditing;
    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const toEspoDateTime = (value) => toEspoDateTimeUtc(value);

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
                                {`Add ${entityType === "meeting" ? "Meeting" : "Task"}`}
                            </h2>
                            <span
                                className={`inline-flex
                                    
                                    px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                    deal?.status,
                                )}`}
                            >
                                {deal?.status}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">

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
                                                value={formData.status || (isMeeting ? "Planned" : "Not Started")}
                                                options={STATUS_OPTIONS}
                                                onChange={(value) => handleChange("status", value)}
                                            />

                                            <Select
                                                label={isMeeting ? "Duration" : "Priority"}
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
                                        {entityType === "meeting" && (
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
                                        )}
                                    </div>

                                    {isMeeting && (
                                        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                                            <h3 className="font-medium text-foreground">Attendees</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Select
                                                    label="Attendee Users"
                                                    value={formData.attendeeUsers || []}
                                                    options={userOptions}
                                                    multiple
                                                    searchable
                                                    placeholder="Search users..."
                                                    onChange={(value) =>
                                                        handleChange("attendeeUsers", value)
                                                    }
                                                />

                                                <Select
                                                    label="Attendee Leads"
                                                    value={formData.attendeeLeads || []}
                                                    options={leadOptions}
                                                    multiple
                                                    searchable
                                                    placeholder="Search leads..."
                                                    onChange={(value) =>
                                                        handleChange("attendeeLeads", value)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* ================= Actions ================= */}
                                    <div className="flex justify-end gap-3">
                                        <Button type="submit">Save {entityLabel}</Button>
                                    </div>
                                </form>
                            </div>
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

export default ActivityDrawer;
