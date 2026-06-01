import React, { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
// import { fetchStatus } from "services/others.service";
import { fetchUser } from "services/user.service";
import { fetchTeam } from "services/team.service";
import { fetchAccounts } from "services/account.service";
import { fetchLeads } from "services/leads.service";
// import { fetchContacts } from "services/contact.service";
import { createCall } from "services/call.services";
import { createMeeting } from "services/meeting.service";
import { toEspoDateTime } from "../../pipeline/utils/dateHelpers";

const QuickAddActivity = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: "",
    status: "Planned",
    direction: "",
    dateStart: "",
    dateEnd: "",
    duration: "",
    parentId: "",
    parentType: "Lead",
    assignedUserId: "",
    teamsIds: [],
    usersIds: [],
    // contactsIds: [],
    isAllDay: false,
    description: "",
  });

  const [errors, setErrors] = useState({});
  // const [stats, setStatus] = useState([]);
  const [user, setUser] = useState([]);
  const [team, setTeam] = useState([]);
  const [acc, setAcc] = useState([]);
  const [lead, setLead] = useState([]);
  // const [contact, setContact] = useState([]);

  const activityTypeOptions = [
    { value: "none", label: "None" },
    { value: "Call", label: "Call" },
    { value: "Meeting", label: "Meeting" },
  ];
  const statusOptions = [
    { value: "Planned", label: "Planned" },
    { value: "Held", label: "Held" },
    { value: "Not Held", label: "Not Held" },
  ];
  const directionOptions = [
    { value: "none", label: "None" },
    { value: "Inbound", label: "Inbound" },
    { value: "Outbound", label: "Outbound" },
  ];
  const durationOptions = [
    { value: "15m", label: "15m" },
    { value: "30m", label: "30m" },
    { value: "1h", label: "1h" },
    { value: "2h", label: "2h" },
    { value: "3h", label: "3h" },
    { value: "1d", label: "1d" },
  ];
  const parentTypeOptions = [
    { value: "Account", label: "Account" },
    { value: "Lead", label: "Lead" },
    // { value: "Contact", label: "Contact" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = "Activity name is required";
    }

    if (!formData?.dateStart) {
      newErrors.dateStart = "Start date is required";
    }

    if (!formData?.dateEnd) {
      newErrors.dateEnd = "End date is required";
    }

    if (!formData?.assignedUserId) {
      newErrors.assignedUserId = "Assigned user is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    const payload = {
      _scope: formData._scope,

      name: formData.name.trim(),
      status: formData.status,

      // only for Call
      ...(formData._scope === "Call" && {
        direction: formData.direction,
      }),

      dateStart: toEspoDateTime(formData.dateStart),
      dateEnd: toEspoDateTime(formData.dateEnd),

      duration: formData.duration,

      parentType: formData.parentType,
      parentId: formData.parentId,

      assignedUserId: formData.assignedUserId,

      teamsIds: formData.teamsIds || [],

      // ✅ Match DealDrawer naming
      attendeesUsersIds: formData.usersIds || [],
      // attendeesContactsIds: formData.contactsIds || [],

      isAllDay: formData.isAllDay,
      description: formData.description || "",
    };

    try {
      if (formData._scope === "Call") {
        await createCall(payload);
      } else if (formData._scope === "Meeting") {
        await createMeeting(payload);
      }

      handleReset();
      onClose();
    } catch (err) {
      console.error("Create activity failed", err);
    }
  };

  const handleReset = () => {
    setFormData({
      _scope: "Meeting", // Default activity type

      name: "",
      status: "Planned",

      dateStart: "",
      dateEnd: "",
      duration: 0,
      isAllDay: false,

      description: "",

      parentId: "",
      parentType: "Lead",

      assignedUserId: "",

      usersIds: [],
      // contactsIds: [],

      direction: "", // For Call only
      reminders: [], // Optional
    });

    setErrors({});
  };
  useEffect(() => {
    if (formData.dateStart && formData.dateEnd) {
      const diff =
        (new Date(formData.dateEnd) - new Date(formData.dateStart)) / 1000;
      if (diff > 0) {
        setFormData((prev) => ({
          ...prev,
          duration: diff,
        }));
      }
    }
  }, [formData.dateStart, formData.dateEnd]);
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ userRes, teamRes, accRes, leadRes] =
          await Promise.all([
            // fetchStatus(),
            fetchUser(),
            fetchTeam(),
            fetchAccounts(),
            fetchLeads(),
            // fetchContacts(),
          ]);
        // setStatus(statusRes.options || []);
        setUser(userRes.list || []);
        setTeam(teamRes.list || []);
        setAcc(accRes.list || []);
        setLead(leadRes.list || []);
        // setContact(contactRes.list || []);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    loadData();
  }, []);

  const userOptions = user
    ?.filter((u) => u?.isActive) // ✅ only active users
    ?.map((u) => ({
      value: u.id,
      label: u.name || u.userName,
    }));

  const teamOptions = team?.map((t) => ({
    value: t.id,
    label: t.name,
  }));
  // const contactOptions = contact.map((c) => ({
  //   value: c.id,
  //   label: c.name || c.accountName,
  // }));

  const getParentTypeOptions = () => {
    switch (formData.parentType) {
      case "Account":
        return acc.map((item) => ({
          value: item.id,
          label: item.name,
        }));

      case "Lead":
        return lead.map((item) => ({
          value: item.id,
          label: item.name,
        }));

      // case "Contact":
      //   return contact.map((item) => ({
      //     value: item.id,
      //     label: item.name,
      //   }));

      default:
        return [];
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Icon name="Plus" size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Quick Add Activity
            </h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Activity Type"
              options={activityTypeOptions} // Meeting / Call
              value={formData?._scope}
              onChange={(value) => handleInputChange("_scope", value)}
              required
            />

            <Select
              label="Status"
              options={statusOptions} // Planned, Held, Not Held
              value={formData?.status}
              onChange={(value) => handleInputChange("status", value)}
              required
            />
          </div>

          {/* Name */}
          <Input
            label="Name"
            type="text"
            placeholder="Enter activity name"
            value={formData?.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />

          {/* Direction (Only for Call) */}
          {formData?._scope === "Call" && (
            <Select
              label="Direction"
              options={directionOptions} // Inbound / Outbound
              value={formData?.direction}
              onChange={(value) => handleInputChange("direction", value)}
            />
          )}

          {/* Start & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={formData?.dateStart}
              onChange={(e) => handleInputChange("dateStart", e.target.value)}
              required
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              value={formData?.dateEnd}
              onChange={(e) => handleInputChange("dateEnd", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <Select
              label="Duration"
              options={durationOptions} // 5m, 15m, 30m, 1h etc.
              value={formData?.duration}
              onChange={(value) => handleInputChange("duration", value)}
            />
            <Select
              label="Direction"
              options={directionOptions} // 5m, 15m, 30m, 1h etc.
              value={formData?.direction}
              onChange={(value) => handleInputChange("direction", value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assigned User */}
            <Select
              label="Assigned User"
              options={userOptions}
              value={formData?.assignedUserId}
              onChange={(value) => handleInputChange("assignedUserId", value)}
              required
            />

            {/* Teams */}
            <Select
              label="Teams"
              options={teamOptions}
              value={formData?.teamsIds}
              onChange={(value) => handleInputChange("teamsIds", value)}
              searchable
            />
          </div>
          {/* Parent (Lead / Deal / Contact etc.) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Parent Type"
              options={parentTypeOptions} // Lead, Deal, Account
              value={formData?.parentType}
              onChange={(value) => handleInputChange("parentType", value)}
            />

            <Select
              label="Parent"
              options={getParentTypeOptions()}
              value={formData?.parentId}
              onChange={(value) => handleInputChange("parentId", value)}
              searchable
            />
          </div>

          {/* Attendees Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Users"
              options={userOptions}
              value={formData?.usersIds}
              onChange={(value) => handleInputChange("usersIds", value)}
              searchable
            />

            {/* <Select
              label="Contacts"
              options={contactOptions}
              value={formData?.contactsIds}
              onChange={(value) => handleInputChange("contactsIds", value)}
              searchable
            /> */}
          </div>

          {/* Reminder */}
          <Checkbox
            label="All Day"
            checked={formData?.isAllDay}
            onChange={(e) => handleInputChange("isAllDay", e.target.checked)}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              value={formData?.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button type="button" variant="ghost" onClick={handleReset}>
              Reset
            </Button>

            <Button
              type="submit"
              variant="default"
              iconName="Plus"
              iconPosition="left"
            >
              Add Activity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddActivity;
