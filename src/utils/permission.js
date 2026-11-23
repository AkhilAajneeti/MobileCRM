const ACCESS_ALLOW_VALUES = ["yes", "all", "team", "own"];

export const getStoredAcl = () => {
  try {
    const storedAcl = localStorage.getItem("acl");
    if (storedAcl) return JSON.parse(storedAcl);

    const storedUser = localStorage.getItem("login_object");
    if (!storedUser) return null;

    return JSON.parse(storedUser)?.acl || null;
  } catch {
    return null;
  }
};

export const hasAcl = () => Boolean(getStoredAcl());

const isAllowedValue = (value) => {
  if (value === true) return true;
  if (value === false || value == null) return false;

  return ACCESS_ALLOW_VALUES.includes(String(value).toLowerCase());
};

export const canEntity = (entity, action = "read") => {
  const acl = getStoredAcl();
  if (!acl) return true;

  const entityAcl = acl?.table?.[entity];
  if (entityAcl === true) return true;
  if (!entityAcl) return false;

  return isAllowedValue(entityAcl?.[action]);
};

export const canRead = (entity) => canEntity(entity, "read");
export const canCreate = (entity) => canEntity(entity, "create");
export const canEdit = (entity) => canEntity(entity, "edit");
export const canDelete = (entity) => canEntity(entity, "delete");

export const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("login_object");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const getEntityActionValue = (entity, action) => {
  const acl = getStoredAcl();
  const entityAcl = acl?.table?.[entity];

  if (!acl) return null;
  if (entityAcl === true) return "all";

  return entityAcl?.[action] || "no";
};

export const isOwnRecord = (record, user) => {
  if (!record || !user?.id) return false;

  const userId = String(user.id);

  return [
    record.assignedUserId,
    record.createdById,
    record.ownerId,
    record.userId,
  ].some((id) => id != null && String(id) === userId);
};

const isTeamRecord = (record, user) => {
  const toIdList = (...values) =>
    values
      .flatMap((value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return [value];
      })
      .filter(Boolean)
      .map(String);

  const userTeamIds = toIdList(
    user?.teamsIds,
    user?.teamIds,
    user?.teamId,
    user?.defaultTeamId,
  );

  const recordTeamIds = toIdList(
    record?.teamsIds,
    record?.teamIds,
    record?.teamId,
    record?.defaultTeamId,
  );

  return recordTeamIds.some((teamId) =>
    userTeamIds.includes(teamId)
  );
};

export const canEntityRecord = (entity, action, record) => {
  const rawAccess = getEntityActionValue(entity, action);
  const access = typeof rawAccess === "string" ? rawAccess.toLowerCase() : rawAccess;
  if (access == null) return false;
  if (access === true || access === "yes" || access === "all") return true;
  if (access === false || access === "no") return false;

  const user = getStoredUser();

  if (access === "own") return isOwnRecord(record, user);
  if (access === "team") return isOwnRecord(record, user) || isTeamRecord(record, user);

  return isAllowedValue(access);
};

export const canEditRecord = (entity, record) =>
  canEntityRecord(entity, "edit", record);

export const canDeleteRecord = (entity, record) =>
  canEntityRecord(entity, "delete", record);

export const canGlobal = (permissionKey) => {
  const acl = getStoredAcl();
  if (!acl) return true;

  return isAllowedValue(acl?.[permissionKey]);
};

export const canReadField = (entity, field) => {
  const acl = getStoredAcl();
  if (!acl) return true;

  const fieldAcl = acl?.fieldTable?.[entity]?.[field];
  if (!fieldAcl) return true;

  return isAllowedValue(fieldAcl?.read);
};

export const canEditField = (entity, field) => {
  const acl = getStoredAcl();
  if (!acl) return true;

  const fieldAcl = acl?.fieldTable?.[entity]?.[field];
  if (!fieldAcl) return true;

  return isAllowedValue(fieldAcl?.edit);
};

/**
 * True when the signed-in user holds the named role.
 *
 * Roles are distinct from the EspoCRM user `type`: `type` is one of
 * admin/regular/portal, while names like "Owner" or "Manager" live in
 * `roles` (and `role`, which is just the first of them). Checking `type`
 * for a role name therefore never matches — which is how an Owner ended up
 * unable to see an admin-gated nav item.
 */
export const hasRole = (name) => {
  const user = getStoredUser();
  const target = String(name || "").toLowerCase();
  if (!target) return false;

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (roles.some((role) => String(role).toLowerCase() === target)) return true;

  return String(user?.role || "").toLowerCase() === target;
};

/** Admin by type, or an Owner by role. */
export const isAdminOrOwner = () =>
  getStoredUser()?.type?.toLowerCase() === "admin" || hasRole("Owner");

export const isAdminOrManager = () => {
  const user = getStoredUser();
  const role = user?.role?.toLowerCase();
  return role === 'admin' || role === 'manager';
};
