import React from "react";

const renderAttendees = (names = {}, columns = {}, phoneMap = {}) => {
  const entries = Object.entries(names);
  if (entries.length === 0) {
    return <p className="text-foreground">None</p>;
  }
  return (
    <div className="space-y-2">
      {entries.map(([id, name]) => {
        const status = columns?.[id]?.status || "None";
        const phone =
          Object.values(phoneMap || {}).find((p) => p?.includes(id)) || null;

        return (
          <div
            key={id}
            className="flex items-center justify-between border rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                {name?.charAt(0)}
              </div>

              {/* Name + Phone */}
              <div>
                <p className="text-sm font-medium text-primary hover:underline">
                  {name}
                </p>
                {phone && (
                  <p className="text-xs text-muted-foreground">{phone}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                status === "Accepted"
                  ? "bg-green-100 text-green-700"
                  : status === "Tentative"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {status}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default renderAttendees;
