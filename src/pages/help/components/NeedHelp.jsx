import React from "react";
import Icon from "../../../components/AppIcon";
import { BRAND, BRAND_SOFT, brandBg } from "../theme";

const NeedHelp = () => (
  <div
    className="mt-10 rounded-2xl border px-5 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
    style={{
      borderColor: `${BRAND}33`,
      background: `linear-gradient(135deg, ${BRAND_SOFT} 0%, #ffffff 80%)`,
    }}
  >
    <div
      className="w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-sm shrink-0"
      style={brandBg}
    >
      <Icon name="MessageCircleQuestion" size={22} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-slate-900">Still stuck?</div>
      <div className="text-sm text-slate-600 mt-0.5">
        Reach out to your admin or your CRM partner — most questions are answered
        in under a day.
      </div>
    </div>
    <a
      href="mailto:support@aajneetiadvertising.com"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-shadow"
      style={brandBg}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px -8px ${BRAND}99`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <Icon name="Mail" size={16} />
      Contact support
    </a>
  </div>
);

export default NeedHelp;
