import React from "react";
import IndustryChart from "./IndustryChart";
import StatusChart from "./StatusChart";

const RightRail = ({ leads = [] }) => {
 
  return (
    <div className="space-y-6">
      {/* Industry Chart */}
      {/* <ProgressChart leads={leads} /> */}
      <IndustryChart />
      <StatusChart leads={leads} />
    </div>
  );
};

export default RightRail;
