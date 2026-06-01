import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const ConfirmDeleteModal = ({
  open,
  title = "Delete",
  description,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-background border border-border rounded-lg w-full max-w-md p-6 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Icon name="Trash2" size={20} />
            </div>

            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDeleteModal;
