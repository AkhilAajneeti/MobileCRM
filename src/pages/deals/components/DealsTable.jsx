import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";

const DealsTable = ({
  deals,
  selectedDeals,
  onSelectDeal,
  onSelectAll,
  onDealClick,
  sortConfig,
  onSort,
  canEdit = () => true,
  canDelete = () => true,
  onDelete,
  isLoading,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const formatDate = (date) => {
    if (!date) return "—"; // null / undefined / empty

    // EspoCRM datetimes ("YYYY-MM-DD HH:mm:ss") are UTC; append Z so JS
    // converts them to the user's local timezone for display.
    const safe =
      typeof date === "string" && date.length > 10
        ? `${date.replace(" ", "T")}Z`
        : date;
    const parsedDate = new Date(safe);

    if (isNaN(parsedDate.getTime())) return "—"; // invalid date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })?.format(parsedDate);
  };

  const getStageColor = (stage) => {
    const colors = {
      New: "bg-blue-50 text-blue-700 border border-blue-200",
      Interested:
        "bg-emerald-50 text-emerald-700 border border-emerald-200",
      "Follow up":
        "bg-indigo-50 text-indigo-700 border border-indigo-200",
      "Call Later":
        "bg-amber-50 text-amber-700 border border-amber-200",
      "Call Not Connecting":
        "bg-rose-50 text-rose-700 border border-rose-200",
      "Call Not Picked":
        "bg-red-50 text-red-700 border border-red-200",
      Broker:
        "bg-violet-50 text-violet-700 border border-violet-200",
      Dead:
        "bg-slate-100 text-slate-700 border border-slate-300",
      "Fake Lead":
        "bg-pink-50 text-pink-700 border border-pink-200",
      "Invalid Number":
        "bg-gray-100 text-gray-700 border border-gray-300",
      "Irrelevant Lead":
        "bg-orange-50 text-orange-700 border border-orange-200",
      "Low Budget":
        "bg-yellow-50 text-yellow-700 border border-yellow-200",
      "Low Interest":
        "bg-lime-50 text-lime-700 border border-lime-200",
      "Not Interested":
        "bg-red-50 text-red-700 border border-red-200",
      "Other Location":
        "bg-cyan-50 text-cyan-700 border border-cyan-200",
      Purchased:
        "bg-green-50 text-green-700 border border-green-200 shadow-sm",
      "Site Visit Done":
        "bg-teal-50 text-teal-700 border border-teal-200",
      "Site Visit Scheduled":
        "bg-sky-50 text-sky-700 border border-sky-200",
      "Switch Off":
        "bg-neutral-100 text-neutral-700 border border-neutral-300",
    };

    return (
      colors?.[stage] ||
      "bg-gray-100 text-gray-700 border border-gray-200"
    );
  };
  const getSourceColor = (source) => {
    // normalize value
    const normalizedSource = source
      ?.trim() // remove extra spaces start/end
      ?.replace(/\s+/g, " ") // multiple spaces -> single space
      ?.toLowerCase();

    const colors = {
      call: "bg-emerald-50 text-emerald-700 border border-emerald-200",

      email: "bg-blue-50 text-blue-700 border border-blue-200",

      "existing customer":
        "bg-violet-50 text-violet-700 border border-violet-200",

      partner:
        "bg-orange-50 text-orange-700 border border-orange-200",
      meta:
        "bg-orange-100 text-orange-700 border border-orange-200",

      "public relations":
        "bg-pink-50 text-pink-700 border border-pink-200",

      "web site":
        "bg-cyan-50 text-cyan-700 border border-cyan-200",

      campaign:
        "bg-amber-50 text-amber-700 border border-amber-200",

      other:
        "bg-slate-100 text-slate-700 border border-slate-200",

      acl:
        "bg-gradient-to-r from-fuchsia-50 to-violet-50 text-violet-700 border border-violet-200 shadow-sm",
    };

    return (
      colors?.[normalizedSource] ||
      "bg-gray-100 text-gray-700 border border-gray-200"
    );
  };
  const getProbabilityColor = (probability) => {
    if (probability >= 80) return "text-green-600";
    if (probability >= 60) return "text-yellow-600";
    if (probability >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) {
      return (
        <Icon name="ArrowUpDown" size={16} className="text-muted-foreground" />
      );
    }
    return sortConfig?.direction === "asc" ? (
      <Icon name="ArrowUp" size={16} className="text-primary" />
    ) : (
      <Icon name="ArrowDown" size={16} className="text-primary" />
    );
  };

  const handleQuickAction = (e, action, deal) => {
    e?.stopPropagation();
    onDealClick(deal);
    console.log(`${action} action for deal:`, deal?.id);
  };
  const handleDelete = async (e, deal) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete lead ${deal?.name}?`);
    if (!ok) return;

    await onDelete(deal.id); // 👈 parent ko bol rahe ho
  };

  // const paginatedDeals = useMemo(() => {
  //   if (!deals?.length) return [];
  //   const startIndex = (page - 1) * setPage;
  //   return deals?.slice(startIndex, startIndex + setPage);
  // }, [deals, page, setPage]);
  const paginatedDeals = deals;
  const isAllSelected =
    selectedDeals?.length === paginatedDeals?.length &&
    paginatedDeals?.length > 0;
  const isIndeterminate =
    selectedDeals?.length > 0 && selectedDeals?.length < paginatedDeals?.length;
  const SkeletonRow = () => (
    <tr className="animate-pulse border-t border-border">
      {/* Checkbox */}
      <td className="p-4">
        <div className="h-4 w-4 bg-gray-300/60 rounded"></div>
      </td>

      {/* Company */}
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300/60 rounded-lg"></div>
          <div>
            <div className="h-4 w-24 bg-gray-300/70 rounded mb-1"></div>
            <div className="h-3 w-32 bg-gray-300/50 rounded"></div>
          </div>
        </div>
      </td>

      {/* Industry */}
      <td className="p-4">
        <div className="h-4 w-20 bg-gray-300/60 rounded"></div>
      </td>

      {/* Type */}
      <td className="p-4">
        <div className="h-4 w-16 bg-gray-300/60 rounded"></div>
      </td>

      {/* status */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>
      {/* Next Contact */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>
      {/* Created At */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>
      {/* Assign User */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>

      {/* Actions */}
      <td className="p-4">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-300/60 rounded"></div>
          <div className="h-8 w-8 bg-gray-300/60 rounded"></div>
        </div>
      </td>
    </tr>
  );
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => onSelectAll(e?.target?.checked)}
                />
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("name")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth max-w-[150px]"
                >
                  <span className="truncate">Name</span>
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("cProjectName")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Project Name</span>
                  {getSortIcon("Project Name")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("Source")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Source</span>
                  {getSortIcon("value")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("Status")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Status</span>
                  {getSortIcon("owner")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("email")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Next Contact</span>
                  {getSortIcon("stage")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("createdAt")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Create At</span>
                  {getSortIcon("closeDate")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-sm font-medium text-foreground">
                  Assigned User
                </span>
              </th>
              <th className="w-24 px-4 py-3">
                <span className="text-sm font-medium text-foreground">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !paginatedDeals?.length ? (
              <tr>
                <td colSpan="8">
                  <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                    No leads available
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDeals?.map((deal) => (
                <tr
                  key={deal?.id}
                  onMouseEnter={() => setHoveredRow(deal?.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="hover:bg-muted/30 cursor-pointer transition-smooth"
                >
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedDeals?.includes(deal?.id)}
                      onChange={(e) => {
                        e?.stopPropagation();
                        onSelectDeal(deal?.id, e?.target?.checked);
                      }}
                    />
                  </td>
                  <td className="px-4 py-4" onClick={() => onDealClick(deal)}>
                    <div className="font-medium text-foreground">
                      {deal?.name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-foreground">{deal?.cProject || deal?.cProjectName || "None"}</div>

                  </td>
                  <td className="px-4 py-4">
                    <div className={`font-medium flex justify-center items-center space-x-2 rounded-full ${getSourceColor(deal?.cSubSource)}`}>
                      {deal?.cSubSource
                        ? deal?.cSubSource
                        : deal?.source === "acl"
                          ? "Aajneeti"
                          : deal?.source}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`flex justify-center items-center space-x-2 px-2 py-1 font-medium rounded-full ${getStageColor(
                        deal?.status,
                      )}`}
                    >
                      <span className={`text-sm text-foreg roundunded-full `}>
                        {deal?.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-1 py-1 text-xs font-medium rounded-full`}
                    >
                      {formatDate(deal?.cNextContactAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-foreground">
                      {formatDate(deal?.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`text-sm font-medium ${getProbabilityColor(
                        deal?.assignedUserName,
                      )}`}
                    >
                      {deal?.assignedUserName}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`flex items-center space-x-1 transition-opacity ${hoveredRow === deal?.id ? "opacity-100" : "opacity-50"
                        }`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleQuickAction(e, "edit", deal)}
                        className="h-8 w-8"
                      >
                        <Icon name="Edit" size={14} />
                      </Button>
                      {/* whats app button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();

                          const message = `Hello *${deal?.name || "Customer"}*,Thank you for contacting us for your lead generation requirements.I'm *${deal?.assignedUserName}.Let me know when you're available so that we can discuss this in more detail.`;

                          const whatsappUrl = `https://api.whatsapp.com/send/?phone=${deal?.phoneNumber}&text=${encodeURIComponent(
                            message
                          )}`;

                          window.open(whatsappUrl, "_blank");
                        }}
                        className="h-8 w-8 rounded-full hover:bg-green-100 transition-all duration-200"
                      >
                        <img
                          src="/assets/whatsapp-logo.png"
                          alt="WhatsApp"
                          className="w-5 h-5 object-contain"
                        />
                      </Button>

                      {canDelete(deal) && (<Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, deal)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}

      <div className="md:hidden">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : !paginatedDeals?.length ? (
          <tr>
            <td colSpan="6">
              <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                No leads available
              </div>
            </td>
          </tr>
        ) : (
          paginatedDeals?.map((deal) => (
            <div
              key={deal?.id}
              className="
    mx-3 my-2 p-4 rounded-2xl
    border border-border/50
    bg-gradient-to-br from-background to-muted/20
    hover:shadow-md
    active:scale-[0.99]
    transition-all duration-200
  "
            >
              <div className="flex gap-3">
                {/* Checkbox */}
                <Checkbox
                  checked={selectedDeals?.includes(deal?.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectDeal(deal?.id, e.target.checked);
                  }}
                  className="mt-1"
                />

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onDealClick(deal)}
                >
                  {/* Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {deal?.name}
                      </h3>

                      {deal?.cProjectName && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {deal?.cProjectName}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <span
                      className={`
            px-2.5 py-1 rounded-full
            text-[10px] font-medium
            whitespace-nowrap
            ${getStageColor(deal?.status)}
          `}
                    >
                      {deal?.status}
                    </span>
                  </div>

                  {/* Bottom */}
                  <div className="flex items-end justify-between mt-3 gap-3">
                    <div className="space-y-1 min-w-0">
                      {/* Assigned */}
                      {deal?.assignedUserName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon name="User2" size={12} />
                          <span className="truncate">
                            {deal?.assignedUserName}
                          </span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="Calendar" size={12} />
                        <span>{formatDate(deal?.createdAt)}</span>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();

                        const message = `Hello *${deal?.name || "Customer"}*,
Thank you for contacting us for your lead generation requirements.

I'm *${deal?.assignedUserName || "AAJneeti Team"}* from *AAJneeti Advertising*.`;

                        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${deal?.phoneNumber
                          }&text=${encodeURIComponent(message)}`;

                        window.open(whatsappUrl, "_blank");
                      }}
                      className="
            h-10 w-10 rounded-xl
            bg-green-500/10 hover:bg-green-500/20
            transition-all duration-200
            flex-shrink-0
          "
                    >
                      <img
                        src="/assets/whatsapp-logo.png"
                        alt="WhatsApp"
                        className="w-5 h-5 object-contain"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(DealsTable);
