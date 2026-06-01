import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";

const ContactsTable = ({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAllContacts,
  onContactClick,
  sortConfig,
  onSort,
  onEditContact,
  onDeleteContact,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) return "ArrowUpDown";
    return sortConfig?.direction === "asc" ? "ArrowUp" : "ArrowDown";
  };

  const handleSort = (column) => {
    onSort(column);
  };

  const handleQuickAction = (e, action, contact) => {
    e?.stopPropagation();
    if (action === "edit") {
      onEditContact(contact); // 🔥 yahin se drawer open hoga
    }
    console.log(`${action} action for contact:`, contact?.name);
  };

  const formatLastContact = (date) => {
    const now = new Date();
    const contactDate = new Date(date);
    const diffTime = Math.abs(now - contactDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return contactDate?.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: "bg-success/10 text-success border-success/20",
      Inactive: "bg-muted text-muted-foreground border-border",
      Prospect: "bg-warning/10 text-warning border-warning/20",
      Customer: "bg-primary/10 text-primary border-primary/20",
    };
    return colors?.[status] || colors?.["Inactive"];
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={
                    selectedContacts?.length === contacts?.length &&
                    contacts?.length > 0
                  }
                  indeterminate={
                    selectedContacts?.length > 0 &&
                    selectedContacts?.length < contacts?.length
                  }
                  onChange={(e) => onSelectAllContacts(e?.target?.checked)}
                />
              </th>
              {[
                { key: "name", label: "Name" },
                { key: "title", label: "Account Name" },
                { key: "company", label: "Phone Number" },
                { key: "email", label: "Assigned User" },

                { key: "status", label: "Status" },
              ]?.map((column) => (
                <th
                  key={column?.key}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort(column?.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column?.label}</span>
                    <Icon
                      name={getSortIcon(column?.key)}
                      size={14}
                      className="opacity-50"
                    />
                  </div>
                </th>
              ))}
              <th className="w-24 px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts?.map((contact) => (
              <tr
                key={contact?.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredRow(contact?.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedContacts?.includes(contact?.id)}
                    onChange={(e) => {
                      e?.stopPropagation();
                      onSelectContact(contact?.id, e?.target?.checked);
                    }}
                  />
                </td>
                <td
                  className="px-4 py-4"
                  onClick={() => onContactClick(contact)}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      {/* <div className="font-medium text-foreground">{contact?.salutationName}</div> */}
                      <div className="font-medium text-foreground">
                        {contact?.salutationName}
                        {contact?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contact?.emailAddress}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-foreground">
                  {contact?.accountName}
                </td>
                <td className="px-4 py-4 text-sm text-foreground">
                  {contact?.phoneNumber}
                </td>
                <td className="px-4 py-4 text-sm text-primary hover:underline">
                  {contact?.assignedUserName}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(contact?.accountIsInactive)}`}
                  >
                    {contact?.accountIsInactive ? "InActive" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div
                    className={`flex items-center justify-center space-x-1 transition-opacity`}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleQuickAction(e, "edit", contact)}
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteContact(contact.id);
                      }}
                    >
                      <Icon name="Trash" size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card Layout */}
      <div className="md:hidden">
        {contacts?.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onContactClick(contact)}
            className="p-4 border-b border-border bg-background hover:bg-muted/30 transition"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedContacts?.includes(contact.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelectContact(contact.id, e.target.checked);
                }}
                className="mt-1"
              />

              <div className="flex-1 min-w-0">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {contact.salutationName}
                    {contact.name}
                  </h3>

                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(
                      contact.accountIsInactive ? "Inactive" : "Active",
                    )}`}
                  >
                    {contact.accountIsInactive ? "Inactive" : "Active"}
                  </span>
                </div>

                {/* Assigned user */}
                {contact.assignedUserName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Icon name="User" size={12} />
                    Assigned to{" "}
                    <span className="truncate">{contact.assignedUserName}</span>
                  </div>
                )}

                {/* Last contact */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Icon name="Clock" size={12} />
                  Created At:{" "}
                  {contact.createdAt
                    ? formatLastContact(contact.createdAt)
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactsTable;
