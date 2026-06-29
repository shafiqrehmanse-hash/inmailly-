import {
  DEMO_ACTIVITY,
  DEMO_CAMPAIGN,
  DEMO_RESPONSES,
  PIPELINE_STAGES,
} from "@/lib/client-demo";
import type { ClientDashboardLiveData } from "@/lib/map-portal-to-dashboard";

export function hasRealCampaignData(live: ClientDashboardLiveData) {
  return live.stats.total > 0 || live.proofs.length > 0;
}

/** Client login dashboard: show rich demo-style UI until team logs real data. */
export function buildClientDisplayDashboard(live: ClientDashboardLiveData): {
  display: ClientDashboardLiveData;
  usingDemoFill: boolean;
} {
  if (hasRealCampaignData(live)) {
    return { display: live, usingDemoFill: false };
  }

  const activity = DEMO_ACTIVITY[0];
  return {
    usingDemoFill: true,
    display: {
      ...live,
      stats: {
        total: DEMO_CAMPAIGN.replied,
        teamResponses: DEMO_CAMPAIGN.replied,
        interested: DEMO_CAMPAIGN.meetings + 18,
        replied: DEMO_CAMPAIGN.replied,
        replyRate: DEMO_CAMPAIGN.replyRate,
        sends: 8,
        teamSends: 8,
      },
      responses: DEMO_RESPONSES,
      pipeline: PIPELINE_STAGES,
      velocity: [22, 38, 34, 52, 48, 68, 61, 82],
      latestActivity: {
        name: activity.name,
        action: activity.action,
        time: activity.time,
      },
      proofs: [],
    },
  };
}
