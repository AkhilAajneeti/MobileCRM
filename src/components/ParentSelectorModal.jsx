import { useAccounts } from "hooks/useAccounts";
import { useNewLeads } from "hooks/useLeads";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Icon from "./AppIcon";

export const ParentSelectorModal = ({
  open,
  onClose,
  type,
  onSelect,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState([]);

  const limit = 20;

  // filters
  const [filters, setFilters] = useState({});

  // reset modal
  useEffect(() => {
    if (open) {
      setSearch("");
      setFilters({});
      setPage(1);
      setAllItems([]);
    }
  }, [open, type]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters({
        search: search || undefined,
      });

      setPage(1);
      setAllItems([]);
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  // dynamic hook
  const { data, isLoading, isFetching } =
    type === "Account"
      ? useAccounts({ page, limit, filters })
      : useNewLeads({ page, limit, filters });

  // append pagination data
  useEffect(() => {
    if (!data?.list) return;

    if (page === 1) {
      setAllItems(data.list);
    } else {
      setAllItems((prev) => {
        const merged = [...prev, ...data.list];

        // remove duplicates
        return merged.filter(
          (item, index, self) =>
            index === self.findIndex((i) => i.id === item.id)
        );
      });
    }
  }, [data, page]);

  const list = allItems;

  const hasMore = data?.total > page * limit;

  // esc close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
          >
            <div
              className="
                w-full max-w-lg rounded-2xl p-5
                bg-white/30 backdrop-blur-xl
                border border-white/40
                shadow-2xl
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Select {type}
                </h2>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                >
                  <Icon name="X" size={18} />
                </Button>
              </div>

              {/* Search */}
              <Input
                placeholder={`Search ${type}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* List */}
              <div className="mt-4 max-h-80 overflow-y-auto space-y-1">
                {isLoading && page === 1 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Loading...
                  </p>
                )}

                {!isLoading && list.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No results found
                  </p>
                )}

                {list.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg cursor-pointer text-gray-800 hover:bg-gray-100 transition"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    {item.name}
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <Button
                  className="w-full mt-4"
                  disabled={isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {isFetching ? "Loading..." : "Load More"}
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};