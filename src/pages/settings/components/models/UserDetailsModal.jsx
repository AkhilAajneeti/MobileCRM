import Avatar from "react-avatar";
import Icon from "../../../../components/AppIcon";

const InfoRow = ({ icon, label, value, valueClassName = "" }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <Icon name={icon} size={14} className="text-muted-foreground" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={`text-sm font-medium text-card-foreground break-words mt-0.5 ${valueClassName}`}>
        {value || value === 0 ? value : <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, icon, children }) => (
  <div className="border border-border rounded-xl bg-card/50">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
      <Icon name={icon} size={16} className="text-primary" />
      <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
    </div>
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {children}
    </div>
  </div>
);

const UserDetailsModal = ({ user, onClose, getStatusBadge }) => {
  if (!user) return null;

  const emails =
    Array.isArray(user.emailAddressData) && user.emailAddressData.length
      ? user.emailAddressData
      : user.emailAddress
        ? [{ emailAddress: user.emailAddress, primary: true }]
        : [];

  const phones =
    Array.isArray(user.phoneNumberData) && user.phoneNumberData.length
      ? user.phoneNumberData
      : user.phoneNumber
        ? [{ phoneNumber: user.phoneNumber, type: "Mobile", primary: true }]
        : [];

  const teams = user.teamsNames
    ? Object.values(user.teamsNames)
    : user.defaultTeamName
      ? [user.defaultTeamName]
      : [];

  const roles = user.rolesNames ? Object.values(user.rolesNames) : [];

  const displayName =
    [user.salutationName, user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.name ||
    user.userName ||
    "—";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon name="UserCircle2" size={20} className="text-primary" />
              <h3 className="text-lg font-semibold">User Details</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition"
              aria-label="Close"
            >
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto">
            {/* Hero */}
            <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-primary/5 via-card to-card border-b border-border">
              <div className="flex items-center gap-4">
                <Avatar name={displayName} size="72" round textSizeRatio={2} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-xl font-semibold text-card-foreground truncate">
                      {displayName}
                    </h2>
                    {getStatusBadge?.(user.isActive ? "Active" : "Inactive")}
                  </div>
                  {user.title && (
                    <p className="text-sm text-muted-foreground mt-0.5">{user.title}</p>
                  )}
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="AtSign" size={14} />
                      {user.userName || "—"}
                    </span>
                    {emails[0]?.emailAddress && (
                      <span className="flex items-center gap-1 truncate">
                        <Icon name="Mail" size={14} />
                        <span className="truncate">{emails[0].emailAddress}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="p-6 space-y-4">
              {/* Personal Information */}
              <SectionCard title="Personal Information" icon="User">
                <InfoRow icon="User" label="First Name" value={user.firstName} />
                <InfoRow icon="User" label="Last Name" value={user.lastName} />
                <InfoRow icon="Tag" label="Salutation" value={user.salutationName} />
                <InfoRow icon="Briefcase" label="Designation" value={user.title} />
                <InfoRow icon="UserCheck" label="Gender" value={user.gender} />
              </SectionCard>

              {/* Contact */}
              <SectionCard title="Contact" icon="Mail">
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Emails
                  </p>
                  {emails.length ? (
                    <ul className="space-y-1.5">
                      {emails.map((e, i) => (
                        <li key={i} className="flex items-center flex-wrap gap-2 text-sm">
                          <Icon name="Mail" size={14} className="text-muted-foreground" />
                          <span className="text-card-foreground break-all">{e.emailAddress}</span>
                          {e.primary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                              Primary
                            </span>
                          )}
                          {e.invalid && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive uppercase tracking-wide">
                              Invalid
                            </span>
                          )}
                          {e.optOut && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
                              Opt-out
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Phones
                  </p>
                  {phones.length ? (
                    <ul className="space-y-1.5">
                      {phones.map((p, i) => (
                        <li key={i} className="flex items-center flex-wrap gap-2 text-sm">
                          <Icon name="Phone" size={14} className="text-muted-foreground" />
                          <span className="text-card-foreground">{p.phoneNumber}</span>
                          {p.type && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
                              {p.type}
                            </span>
                          )}
                          {p.primary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                              Primary
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </SectionCard>

              {/* Access Control */}
              <SectionCard title="Teams & Access Control" icon="Shield">
                <InfoRow
                  icon="ShieldCheck"
                  label="Type"
                  value={user.type}
                  valueClassName="capitalize"
                />
                <InfoRow
                  icon="ToggleRight"
                  label="Status"
                  value={getStatusBadge?.(user.isActive ? "Active" : "Inactive")}
                />
                <InfoRow icon="Star" label="Default Team" value={user.defaultTeamName} />
                <div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon name="Users" size={14} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Teams
                      </p>
                      {teams.length ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {teams.map((t, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-0.5">—</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon name="Key" size={14} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Roles
                      </p>
                      {roles.length ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {roles.map((r, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-0.5">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Activity */}
              <SectionCard title="Activity" icon="Clock">
                <InfoRow icon="UserPlus" label="Created By" value={user.createdByName} />
                <InfoRow icon="Calendar" label="Created At" value={user.createdAt} />
                <InfoRow icon="History" label="Modified At" value={user.modifiedAt} />
                <InfoRow icon="LogIn" label="Last Access" value={user.lastAccess} />
              </SectionCard>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-card/80 flex justify-end">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailsModal;
