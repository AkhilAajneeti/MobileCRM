import React, { useState } from "react";
import Papa from "papaparse";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const ImportModel = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        onImport(result.data); // 🔥 send rows to parent
        setLoading(false);
        onClose();
        setFile(null);
      },
      error: () => {
        setLoading(false);
        alert("Failed to read CSV file");
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Import Accounts</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            required
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Importing..." : "Import"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportModel;
