import React, { useEffect, useState } from "react";
import { leadStreamById } from "services/leads.service";

const VersionHistoryModal = ({ isOpen, onClose, dealId }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!dealId || !isOpen) return;

    const fetchHistory = async () => {
      try {
        const data = await leadStreamById(dealId);
        setHistory(data.list || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchHistory();
  }, [dealId, isOpen]);
  const getReadableActivity = (item) => {
    const user = item.createdByName || "Unknown User";

    // 🟢 Comment / Post
    if (item.type === "Post" && item.post) {
      return {
        title: `${user} posted a comment`,
        description: item.post,
        icon: "💬",
      };
    }

    // 🟣 Field Update
    if (item.type === "Update") {
      const value = item.data?.value;

      if (value) {
        return {
          title: `${user} updated status to "${value}"`,
          description: null,
          icon: "🟣",
        };
      }

      return {
        title: `${user} made changes`,
        description: null,
        icon: "✏️",
      };
    }

    return {
      title: `${user} made an activity`,
      description: null,
      icon: "📌",
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Version History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[75vh] px-6 py-4 bg-gray-50">
          {history.length === 0 && (
            <p className="text-sm text-gray-500">No history found</p>
          )}

          <div className="relative border-l border-gray-300 ml-3">
            {history.map((item, index) => {
              const activity = getReadableActivity(item);

              return (
                <div key={item.id} className="mb-6 ml-6 relative">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[33px] flex items-center justify-center w-5 h-5 rounded-full bg-white border-2 border-gray-400 text-xs">
                    {activity.icon}
                  </span>

                  {/* Activity Card */}
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    {/* Title */}
                    <p className="text-sm font-semibold text-gray-800">
                      {activity.title}
                    </p>

                    {/* Description (if Post) */}
                    {activity.description && (
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg">
                        {activity.description}
                      </p>
                    )}

                    {/* Date */}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
