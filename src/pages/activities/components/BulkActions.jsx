import React from "react";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Icon from "../../../components/AppIcon";

const BulkActions = ({
  selectedCount,
  onMarkComplete,
  onReassign,
  onDelete,
  onClearSelection,
}) => {
  const handleReassign = (newOwner) => {
    if (newOwner && selectedCount > 0) {
      const ownerName = ownerOptions?.find((o) => o?.value === newOwner)?.label;
      onReassign(ownerName);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              {selectedCount} {selectedCount === 1 ? "activity" : "activities"}{" "}
              selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkComplete}
              iconName="Check"
              iconPosition="left"
            >
              Mark Complete
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              iconName="Trash2"
              iconPosition="left"
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          iconName="X"
          iconPosition="left"
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
};

export default BulkActions;
