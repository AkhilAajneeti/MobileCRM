import React from "react";
import { canEntityRecord } from "../../../utils/permission";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Image from "../../../components/AppImage";

const ConnectedIntegrationsList = ({
  integrations,
  onRowClick,
  onDelete,
  isLoading,
}) => {
  const sourceLogos = {
    facebook: "/assets/images/facebook.png",
    ivr: "/assets/images/ivr.png",
    "Web Site": "/assets/images/web-traffic.png",
  };

  if (integrations?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Link" size={24} className="text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-card-foreground mb-2">
          No Connected Integrations
        </h3>
        <p className="text-muted-foreground">
          Connect your first integration to start syncing data with CRM.
        </p>
      </div>
    );
  }

  const SkeletonRow = () => (
    <tr className="animate-pulse border-t border-border">
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
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-card-foreground ">
          Connected Integrations
        </h3>
        <p className="text-sm text-muted-foreground">
          {integrations?.length} integration
          {integrations?.length !== 1 ? "s" : ""} active
        </p>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          Array.from({ length: integrations?.length }).map((_, i) => (
            <SkeletonRow key={i} />
          ))
        ) : !integrations?.length ? (
          <tr>
            <td colSpan="4">
              <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                No leads available
              </div>
            </td>
          </tr>
        ) : (
          integrations?.map((integration) => {
            const sourceName = integration?.leadSource?.toLowerCase();
            const logo =
              sourceLogos[sourceName] || "/assets/images/web-traffic.png";
            return (
              <div
                key={integration?.id}
                className="p-4 hover:bg-muted/50 transition-smooth"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      <div key={integration?.id}>
                        <Image
                          src={logo}
                          alt={`${integration?.name} logo`}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4
                          className="font-medium text-card-foreground"
                          onClick={() => onRowClick(integration, "view")}
                        >
                          {integration?.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <Icon
                            name={
                              integration?.isActive
                                ? "CheckCircle"
                                : "AlertCircle"
                            }
                            size={14}
                            className={
                              integration?.isActive
                                ? "text-success"
                                : "text-error"
                            }
                          />
                          <span
                            className={`text-xs ${integration?.isActive
                                ? "text-success"
                                : "text-error"
                              }`}
                          >
                            {integration?.statusText}
                          </span>
                        </div>
                      </div>

                      {integration?.lastSync && (
                        <p className="text-sm text-muted-foreground">
                          Last synced: {integration?.lastSync}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {canEntityRecord('LeadCapture', 'edit', integration) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRowClick(integration, "edit")}
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                    )}
                    {canEntityRecord('LeadCapture', 'delete', integration) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-red-50"
                        onClick={() => onDelete(integration)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConnectedIntegrationsList;
