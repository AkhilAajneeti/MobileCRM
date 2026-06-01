import React, { memo } from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import { STAT_CARDS } from "../utils/pipelineConstants";

/**
 * PipelineStats - presentation only.
 *
 * Renders the six summary cards. All counts are pre-computed by
 * usePipelineStats; this component just maps the STAT_CARDS config onto them.
 */
const PipelineStats = ({ stats = {} }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {STAT_CARDS.map((card, index) => (
      <motion.div
        key={card.key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`${card.bgColor} border border-border rounded-xl p-4`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}
          >
            <Icon name={card.icon} size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-foreground leading-none">
              {stats[card.key] ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {card.title}
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

export default memo(PipelineStats);
