import React from "react";
import Icon from "../../../components/AppIcon";

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">

      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Welcome Back 👋
        </h2>
        <p className="text-muted-foreground">
          Access your CRM dashboard to manage leads and track performance efficiently.
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;
