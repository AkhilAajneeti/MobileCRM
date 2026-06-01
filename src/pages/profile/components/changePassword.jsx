import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const ChangePassword = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleChangePassword = async () => {
    setIsLoading(true);
    // Mock password change functionality
    setTimeout(() => {
      setIsLoading(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      console.log("Password changed successfully");
    }, 1000);
  };
  return (
    <div>
      {/* Password Change */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Icon name="Lock" size={24} className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              Change Password
            </h3>
            <p className="text-sm text-muted-foreground">
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            value={passwordData?.currentPassword}
            onChange={(e) =>
              handlePasswordChange("currentPassword", e?.target?.value)
            }
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordData?.newPassword}
            onChange={(e) =>
              handlePasswordChange("newPassword", e?.target?.value)
            }
            description="Must be at least 8 characters with uppercase, lowercase, and numbers"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData?.confirmPassword}
            onChange={(e) =>
              handlePasswordChange("confirmPassword", e?.target?.value)
            }
            required
          />

          <Button
            variant="default"
            onClick={handleChangePassword}
            loading={isLoading}
            iconName="Shield"
            iconPosition="left"
          >
            Change Password
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
