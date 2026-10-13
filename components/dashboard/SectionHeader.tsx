import React from 'react';

export const SectionHeader: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; id: string }> = ({ title, subtitle, icon, id }) => (
  <div id={id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F2225]/45 pb-3.5 mb-6 text-left scroll-mt-24 gap-2">
    <div className="flex items-center gap-3 min-w-0">
      <span className="p-2.5 bg-[#26F0C4]/10 rounded-xl text-[#26F0C4] flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-[15px] md:text-md font-black text-[#E5E7EB] tracking-tight">{title}</h2>
        <p className="text-[11px] text-[#8B929A] mt-0.5 leading-normal">{subtitle}</p>
      </div>
    </div>
  </div>
);

export default SectionHeader;
