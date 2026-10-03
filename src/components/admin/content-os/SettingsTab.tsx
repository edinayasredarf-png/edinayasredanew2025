"use client";

import React from "react";
import ChannelsTab from "./ChannelsTab";
import CompaniesPanel from "./CompaniesPanel";
import AiRoutingPanel from "./AiRoutingPanel";
import type { ContentChannelProfile, ContentCompany } from "@/lib/contentOsTypes";

export default function SettingsTab({
  channels, reloadChannels, companies, reloadCompanies,
}: {
  channels: ContentChannelProfile[]; reloadChannels: () => Promise<void>;
  companies: ContentCompany[]; reloadCompanies: () => Promise<void>;
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Настройки</h2>
        <p className="text-sm text-gray-500">Компании, профили каналов и выбор AI-моделей.</p>
      </div>

      <CompaniesPanel companies={companies} reload={reloadCompanies} />
      <AiRoutingPanel />
      <ChannelsTab channels={channels} reload={reloadChannels} />
    </div>
  );
}
