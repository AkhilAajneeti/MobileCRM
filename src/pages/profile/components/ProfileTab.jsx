import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Avatar from "react-avatar";
import { attachment, fetchUserById, updateUser } from "services/user.service";
import { fetchTeam } from "services/team.service";
import toast from "react-hot-toast";
import { canEditField, canEditRecord, canReadField } from "utils/permission";

const ProfileTab = () => {
  const [profileData, setProfileData] = useState({});
  const [team, setTeam] = useState([]);
  const loginUserStr = localStorage.getItem("login_object");
  const loginUser = loginUserStr ? JSON.parse(loginUserStr) : null;
  const getPrimaryTeamId = (user = {}) =>
    user.teamsIds?.[0] ||
    user.teamIds?.[0] ||
    user.teamId ||
    user.defaultTeamId ||
    "";

  const UserId = loginUser?.id;
  console.log(UserId);
  useEffect(() => {
    if (!UserId) return;

    const loadUser = async () => {
      try {
        const data = await fetchUserById(UserId);

        setProfileData({
          id: data.id,
          userId: data.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          userName: data.userName || "",
          email: data.emailAddress || "",
          phone: data.phoneNumber || "",
          role: Object.values(data.rolesNames || {}).join(", "),
          type: data.type || "",
          teamId: getPrimaryTeamId(data),
          teamsIds: data.teamsIds || [],
          defaultTeamId: data.defaultTeamId || "",
          createdAt: data.createdAt,
          lastAccess: data.lastAccess,
          avatarId: data.avatarId,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    loadUser();
  }, [UserId]);

  const [notifications, setNotifications] = useState({
    emailDeals: true,
    emailActivities: true,
    emailReports: false,
    pushDeals: true,
    pushActivities: false,
    pushReports: false,
    smsReminders: true,
    weeklyDigest: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const canEditProfile = useMemo(
    () => canEditRecord("User", { ...profileData, userId: UserId }),
    [profileData, UserId],
  );
  const canShowField = (field) => canReadField("User", field);
  const canChangeField = (field) =>
    canEditProfile && canEditField("User", field);
  const canChangeTeam =
    canEditProfile &&
    canEditField("User", "teamsIds") &&
    canEditField("User", "defaultTeamId");
  const canShowTeam =
    canReadField("User", "teamsIds") &&
    canReadField("User", "defaultTeamId");
  const canShowRole =
    canReadField("User", "roles") &&
    canReadField("User", "rolesIds") &&
    canReadField("User", "rolesNames");
  const canShowAvatar =
    canReadField("User", "avatar") && canReadField("User", "avatarId");
  const canChangeAvatar =
    canEditProfile &&
    canEditField("User", "avatar") &&
    canEditField("User", "avatarId");

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (field, checked) => {
    setNotifications((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleAvatarUpload = async (e) => {
    if (!canChangeAvatar) {
      toast.error("You do not have permission to update profile photo");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result;

      const payload = {
        role: "Attachment",
        relatedType: "User",
        field: "avatar",
        name: file.name,
        type: file.type,
        size: file.size,
        file: base64,
      };

      try {
        // 1️⃣ upload attachment
        const attachmentRes = await attachment(payload);

        console.log("Attachment uploaded:", attachmentRes);

        // 2️⃣ update user
        await updateUser(UserId, {
          avatarId: attachmentRes.id,
        });

        // 3️⃣ update UI
        setProfileData((prev) => ({
          ...prev,
          avatarId: attachmentRes.id,
        }));

        toast.success("Avatar updated");
      } catch (error) {
        console.error(error);
        toast.error("Avatar upload failed");
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!canEditProfile) {
      toast.error("You do not have permission to edit profile");
      return;
    }

    setIsLoading(true);

    try {
      const teamId = profileData.teamId || null;
      const payload = {};

      if (canChangeField("firstName")) payload.firstName = profileData.firstName;
      if (canChangeField("lastName")) payload.lastName = profileData.lastName;
      if (canChangeField("userName")) payload.userName = profileData.userName;
      if (canChangeField("emailAddress")) payload.emailAddress = profileData.email;
      if (canChangeField("phoneNumber")) payload.phoneNumber = profileData.phone;
      if (canChangeTeam) {
        payload.teamsIds = teamId ? [teamId] : [];
        payload.defaultTeamId = teamId;
      }

      if (!Object.keys(payload).length) {
        toast.error("No editable fields available");
        return;
      }

      await updateUser(UserId, payload);

      if (loginUser) {
        const updatedLoginUser = {
          ...loginUser,
          teamsIds: teamId ? [teamId] : [],
          teamId,
          defaultTeamId: teamId,
        };
        localStorage.setItem("login_object", JSON.stringify(updatedLoginUser));
      }

      console.log("Profile updated successfully");
      toast.success("Your profile is updated");
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamRes] = await Promise.all([fetchTeam()]);
        setTeam(teamRes.list || []);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };

    loadData();
  }, []);
  const teamOptions = team?.map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const fileInputRef = useRef();
  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-6">
          {/* Avatar Section */}
          {canShowAvatar && (
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                    <Avatar
                      name={`${profileData?.firstName || ""} ${profileData?.lastName || ""}`}
                      size="80"
                      round
                    />
                  </div>
                </div>
                {canChangeAvatar && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                  >
                    <Icon name="Camera" size={16} />
                  </button>
                )}
              </div>
              <div>
                <h4 className="font-medium text-card-foreground">
                  {[
                    profileData?.salutationName,
                    profileData?.firstName,
                    profileData?.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </h4>

                {canChangeAvatar && (
                  <label className="cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />

                    <Button variant="outline" size="sm">
                      <Icon name="Upload" size={16} className="mr-2" />
                      Upload New Photo
                    </Button>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canShowField("firstName") && (
              <Input
                label="First Name"
                type="text"
                value={profileData?.firstName}
                onChange={(e) => handleProfileChange("firstName", e.target.value)}
                disabled={!canChangeField("firstName")}
                required
              />
            )}
            {canShowField("lastName") && (
              <Input
                label="Last Name"
                type="text"
                value={profileData?.lastName}
                onChange={(e) => handleProfileChange("lastName", e.target.value)}
                disabled={!canChangeField("lastName")}
                required
              />
            )}
            {canShowField("userName") && (
              <Input
                label="Username"
                value={profileData?.userName || ""}
                onChange={(e) => handleProfileChange("userName", e.target.value)}
                disabled={!canChangeField("userName")}
              />
            )}

            {canShowField("emailAddress") && (
              <Input
                label="Email"
                value={profileData?.email || ""}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                disabled={!canChangeField("emailAddress")}
              />
            )}

            {canShowField("phoneNumber") && (
              <Input
                label="Phone Number"
                value={profileData?.phone || ""}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                disabled={!canChangeField("phoneNumber")}
              />
            )}
            {canShowRole && (
              <Input label="Role" value={profileData?.role || ""} disabled />
            )}
            {canShowTeam && (
              <Select
                label="Teams"
                value={profileData?.teamId || ""}
                options={teamOptions}
                disabled={!canChangeTeam}
                onChange={(value) =>
                  setProfileData((prev) => ({
                    ...prev,
                    teamId: value,
                  }))
                }
              />
            )}
            {canShowField("type") && (
              <Input label="Type" value={profileData?.type || ""} disabled />
            )}
          </div>

          {/* Preferences */}
          {(canShowField("createdAt") || canShowField("lastAccess")) && (
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              {canShowField("createdAt") && <p>Created At: {profileData?.createdAt}</p>}
              {canShowField("lastAccess") && <p>Last Access: {profileData?.lastAccess}</p>}
            </div>
          )}

          {canEditProfile && (
            <div className="flex justify-end">
              <Button
                variant="default"
                onClick={handleSaveProfile}
                loading={isLoading}
                iconName="Save"
                iconPosition="left"
              >
                Save Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
