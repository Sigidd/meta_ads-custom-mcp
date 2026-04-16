/**
 * Registers all Meta Ads MCP tools on the given McpServer instance.
 *
 * Tools (35 total):
 *   User & Accounts:   get_me, list_ad_accounts, get_ad_account,
 *                      list_businesses, get_business, list_business_ad_accounts
 *   Campaigns:         list_campaigns, get_campaign, create_campaign,
 *                      update_campaign, delete_campaign
 *   Ad Sets:           list_ad_sets, get_ad_set, create_ad_set,
 *                      update_ad_set, delete_ad_set
 *   Ads:               list_ads, get_ad, create_ad, update_ad, delete_ad
 *   Ad Creatives:      list_ad_creatives, get_ad_creative, create_ad_creative
 *   Insights:          get_insights
 *   Pages:             list_pages, get_page, get_page_insights
 *   Audiences:         list_custom_audiences, get_custom_audience,
 *                      create_custom_audience, list_saved_audiences
 *   Targeting:         search_targeting
 *   Media:             list_ad_images, list_ad_videos
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MetaAdsClient } from "./meta";

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function err(e: unknown): ToolResult {
  const msg = e instanceof Error ? e.message : String(e);
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}

const optStr = z.string().optional();
const optNum = z.number().optional();
const optStrArr = z.array(z.string()).optional();

export function registerTools(server: McpServer, client: MetaAdsClient) {
  // ════════════════════════════════════════════════════════════════════════════
  // USER & ACCOUNTS
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "get_me",
    "Get the authenticated Meta user's profile information",
    {
      fields: optStr.describe("Comma-separated fields to return (default: id,name,email)"),
    },
    async ({ fields }) => {
      try {
        return ok(await client.getMe(fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_ad_accounts",
    "List all ad accounts accessible to the authenticated user",
    {
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async (params) => {
      try {
        return ok(await client.listAdAccounts(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_ad_account",
    "Get details of a specific ad account by ID",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
    },
    async ({ ad_account_id, fields }) => {
      try {
        return ok(await client.getAdAccount(ad_account_id, fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_businesses",
    "List all businesses the authenticated user has access to",
    {
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
    },
    async (params) => {
      try {
        return ok(await client.listBusinesses(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_business",
    "Get details of a specific business by ID",
    {
      business_id: z.string().describe("Business Manager ID"),
      fields: optStr.describe("Comma-separated fields to return"),
    },
    async ({ business_id, fields }) => {
      try {
        return ok(await client.getBusiness(business_id, fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_business_ad_accounts",
    "List all ad accounts owned by a specific business",
    {
      business_id: z.string().describe("Business Manager ID"),
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
    },
    async ({ business_id, ...params }) => {
      try {
        return ok(await client.listBusinessAdAccounts(business_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // CAMPAIGNS
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_campaigns",
    "List campaigns for an ad account with optional filters",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
      effective_status: optStrArr.describe("Filter by status: ACTIVE, PAUSED, DELETED, ARCHIVED, IN_PROCESS, WITH_ISSUES"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ ad_account_id, ...params }) => {
      try {
        return ok(await client.listCampaigns(ad_account_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_campaign",
    "Get details of a specific campaign by ID",
    {
      campaign_id: z.string().describe("Campaign ID"),
      fields: optStr.describe("Comma-separated fields to return"),
    },
    async ({ campaign_id, fields }) => {
      try {
        return ok(await client.getCampaign(campaign_id, fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_campaign",
    "Create a new campaign in an ad account",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      name: z.string().describe("Campaign name"),
      objective: z.string().describe("Campaign objective: AWARENESS, TRAFFIC, ENGAGEMENT, LEADS, APP_PROMOTION, SALES"),
      status: optStr.describe("Campaign status: ACTIVE, PAUSED (default: PAUSED)"),
      special_ad_categories: optStrArr.describe("Special ad categories: NONE, EMPLOYMENT, HOUSING, CREDIT, ISSUES_ELECTIONS_POLITICS"),
      daily_budget: optNum.describe("Daily budget in account currency cents"),
      lifetime_budget: optNum.describe("Lifetime budget in account currency cents"),
    },
    async ({ ad_account_id, name, objective, status, special_ad_categories, daily_budget, lifetime_budget }) => {
      try {
        return ok(await client.createCampaign(ad_account_id, { name, objective, status, special_ad_categories, daily_budget, lifetime_budget }));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update_campaign",
    "Update an existing campaign's settings",
    {
      campaign_id: z.string().describe("Campaign ID to update"),
      name: optStr.describe("New campaign name"),
      status: optStr.describe("New status: ACTIVE, PAUSED, ARCHIVED, DELETED"),
      daily_budget: optNum.describe("New daily budget in account currency cents"),
      lifetime_budget: optNum.describe("New lifetime budget in account currency cents"),
      spend_cap: optNum.describe("New spend cap in account currency cents"),
    },
    async ({ campaign_id, ...data }) => {
      try {
        const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        return ok(await client.updateCampaign(campaign_id, filtered));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "delete_campaign",
    "Delete a campaign by ID",
    {
      campaign_id: z.string().describe("Campaign ID to delete"),
    },
    async ({ campaign_id }) => {
      try {
        return ok(await client.deleteCampaign(campaign_id));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // AD SETS
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_ad_sets",
    "List ad sets for an ad account with optional filters",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
      campaign_id: optStr.describe("Filter by campaign ID"),
      effective_status: optStrArr.describe("Filter by status: ACTIVE, PAUSED, DELETED, ARCHIVED, IN_PROCESS, WITH_ISSUES"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ ad_account_id, ...params }) => {
      try {
        return ok(await client.listAdSets(ad_account_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_ad_set",
    "Get details of a specific ad set by ID",
    {
      adset_id: z.string().describe("Ad set ID"),
      fields: optStr.describe("Comma-separated fields to return"),
    },
    async ({ adset_id, fields }) => {
      try {
        return ok(await client.getAdSet(adset_id, fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_ad_set",
    "Create a new ad set within a campaign",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      name: z.string().describe("Ad set name"),
      campaign_id: z.string().describe("Parent campaign ID"),
      daily_budget: optNum.describe("Daily budget in account currency cents (required if no lifetime_budget)"),
      lifetime_budget: optNum.describe("Lifetime budget in account currency cents (required if no daily_budget)"),
      start_time: optStr.describe("Start time in ISO 8601 format"),
      end_time: optStr.describe("End time in ISO 8601 format (required for lifetime budget)"),
      optimization_goal: optStr.describe("Optimization goal: REACH, IMPRESSIONS, LINK_CLICKS, CONVERSIONS, etc."),
      billing_event: optStr.describe("Billing event: IMPRESSIONS, LINK_CLICKS, APP_INSTALLS, etc."),
      bid_amount: optNum.describe("Bid amount in account currency cents"),
      targeting: optStr.describe("Targeting spec as JSON string"),
      status: optStr.describe("Ad set status: ACTIVE, PAUSED (default: PAUSED)"),
    },
    async ({ ad_account_id, targeting, ...rest }) => {
      try {
        const data: Record<string, unknown> = { ...rest };
        if (targeting) {
          try {
            data.targeting = JSON.parse(targeting);
          } catch {
            data.targeting = targeting;
          }
        }
        const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        return ok(await client.createAdSet(ad_account_id, filtered));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update_ad_set",
    "Update an existing ad set's settings",
    {
      adset_id: z.string().describe("Ad set ID to update"),
      name: optStr.describe("New ad set name"),
      status: optStr.describe("New status: ACTIVE, PAUSED, ARCHIVED, DELETED"),
      daily_budget: optNum.describe("New daily budget in account currency cents"),
      lifetime_budget: optNum.describe("New lifetime budget in account currency cents"),
      end_time: optStr.describe("New end time in ISO 8601 format"),
      bid_amount: optNum.describe("New bid amount in account currency cents"),
    },
    async ({ adset_id, ...data }) => {
      try {
        const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        return ok(await client.updateAdSet(adset_id, filtered));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "delete_ad_set",
    "Delete an ad set by ID",
    {
      adset_id: z.string().describe("Ad set ID to delete"),
    },
    async ({ adset_id }) => {
      try {
        return ok(await client.deleteAdSet(adset_id));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // ADS
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_ads",
    "List ads for an ad account with optional filters",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
      adset_id: optStr.describe("Filter by ad set ID"),
      campaign_id: optStr.describe("Filter by campaign ID"),
      effective_status: optStrArr.describe("Filter by status: ACTIVE, PAUSED, DELETED, ARCHIVED, IN_PROCESS, WITH_ISSUES"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ ad_account_id, ...params }) => {
      try {
        return ok(await client.listAds(ad_account_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_ad",
    "Get details of a specific ad by ID",
    {
      ad_id: z.string().describe("Ad ID"),
      fields: optStr.describe("Comma-separated fields to return"),
    },
    async ({ ad_id, fields }) => {
      try {
        return ok(await client.getAd(ad_id, fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_ad",
    "Create a new ad within an ad set",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      name: z.string().describe("Ad name"),
      adset_id: z.string().describe("Parent ad set ID"),
      creative_id: z.string().describe("Ad creative ID to use for this ad"),
      status: optStr.describe("Ad status: ACTIVE, PAUSED (default: PAUSED)"),
      tracking_specs: optStr.describe("Tracking specs as JSON string"),
    },
    async ({ ad_account_id, tracking_specs, creative_id, ...rest }) => {
      try {
        const data: Record<string, unknown> = {
          ...rest,
          creative: { creative_id },
        };
        if (tracking_specs) {
          try {
            data.tracking_specs = JSON.parse(tracking_specs);
          } catch {
            data.tracking_specs = tracking_specs;
          }
        }
        const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        return ok(await client.createAd(ad_account_id, filtered));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update_ad",
    "Update an existing ad's settings",
    {
      ad_id: z.string().describe("Ad ID to update"),
      name: optStr.describe("New ad name"),
      status: optStr.describe("New status: ACTIVE, PAUSED, ARCHIVED, DELETED"),
      creative_id: optStr.describe("New ad creative ID"),
    },
    async ({ ad_id, creative_id, ...data }) => {
      try {
        const update: Record<string, unknown> = { ...data };
        if (creative_id) update.creative = { creative_id };
        const filtered = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
        return ok(await client.updateAd(ad_id, filtered));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "delete_ad",
    "Delete an ad by ID",
    {
      ad_id: z.string().describe("Ad ID to delete"),
    },
    async ({ ad_id }) => {
      try {
        return ok(await client.deleteAd(ad_id));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // AD CREATIVES
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_ad_creatives",
    "List ad creatives for an ad account",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ ad_account_id, ...params }) => {
      try {
        return ok(await client.listAdCreatives(ad_account_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_ad_creative",
    "Get details of a specific ad creative by ID",
    {
      creative_id: z.string().describe("Ad creative ID"),
      fields: optStr.describe("Comma-separated fields to return"),
    },
    async ({ creative_id, fields }) => {
      try {
        return ok(await client.getAdCreative(creative_id, fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_ad_creative",
    "Create a new ad creative for use in ads",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      name: z.string().describe("Creative name"),
      object_story_spec: optStr.describe("Object story spec as JSON string (for link/photo/video ads)"),
      image_hash: optStr.describe("Hash of an uploaded image to use"),
      title: optStr.describe("Ad title text"),
      body: optStr.describe("Ad body text"),
      link_url: optStr.describe("URL users go to when clicking the ad"),
      call_to_action_type: optStr.describe("CTA type: LEARN_MORE, SHOP_NOW, SIGN_UP, SUBSCRIBE, etc."),
    },
    async ({ ad_account_id, object_story_spec, ...rest }) => {
      try {
        const data: Record<string, unknown> = { ...rest };
        if (object_story_spec) {
          try {
            data.object_story_spec = JSON.parse(object_story_spec);
          } catch {
            data.object_story_spec = object_story_spec;
          }
        }
        const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        return ok(await client.createAdCreative(ad_account_id, filtered));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "get_insights",
    "Get performance insights for an ad account, campaign, ad set, or ad. Returns metrics like impressions, clicks, spend, CTR, CPC, etc.",
    {
      object_id: z.string().describe("ID of the object to get insights for (account ID with act_ prefix, campaign ID, ad set ID, or ad ID)"),
      level: optStr.describe("Aggregation level: account, campaign, adset, ad"),
      fields: optStr.describe("Comma-separated metrics: impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,cost_per_action_type,video_views"),
      date_preset: optStr.describe("Date preset: today, yesterday, last_7d, last_14d, last_28d, last_30d, last_90d, last_month, last_quarter, last_year, this_month, this_quarter, this_week_sun_today, this_week_mon_today, this_year"),
      time_range_since: optStr.describe("Start date in YYYY-MM-DD format (use with time_range_until instead of date_preset)"),
      time_range_until: optStr.describe("End date in YYYY-MM-DD format"),
      breakdowns: optStrArr.describe("Breakdown dimensions: age, gender, country, region, dma, impression_device, publisher_platform, platform_position, device_platform"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ object_id, level, fields, date_preset, time_range_since, time_range_until, breakdowns, limit, after }) => {
      try {
        const time_range = time_range_since && time_range_until
          ? { since: time_range_since, until: time_range_until }
          : undefined;
        return ok(await client.getInsights(object_id, {
          level: level as "account" | "campaign" | "adset" | "ad" | undefined,
          fields,
          date_preset,
          time_range,
          breakdowns,
          limit,
          after,
        }));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PAGES
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_pages",
    "List Facebook Pages managed by the authenticated user",
    {
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
    },
    async (params) => {
      try {
        return ok(await client.listPages(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_page",
    "Get details of a specific Facebook Page by ID",
    {
      page_id: z.string().describe("Facebook Page ID"),
      fields: optStr.describe("Comma-separated fields to return"),
    },
    async ({ page_id, fields }) => {
      try {
        return ok(await client.getPage(page_id, fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_page_insights",
    "Get insights/analytics for a Facebook Page",
    {
      page_id: z.string().describe("Facebook Page ID"),
      metric: optStr.describe("Comma-separated metrics: page_impressions,page_engaged_users,page_views_total,page_fans,page_fan_adds,page_fan_removes"),
      period: optStr.describe("Aggregation period: day, week, days_28, month, lifetime"),
      since: optStr.describe("Start date in Unix timestamp or YYYY-MM-DD"),
      until: optStr.describe("End date in Unix timestamp or YYYY-MM-DD"),
    },
    async ({ page_id, ...params }) => {
      try {
        return ok(await client.getPageInsights(page_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // AUDIENCES
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_custom_audiences",
    "List custom audiences for an ad account",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ ad_account_id, ...params }) => {
      try {
        return ok(await client.listCustomAudiences(ad_account_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_custom_audience",
    "Get details of a specific custom audience by ID",
    {
      audience_id: z.string().describe("Custom audience ID"),
      fields: optStr.describe("Comma-separated fields to return"),
    },
    async ({ audience_id, fields }) => {
      try {
        return ok(await client.getCustomAudience(audience_id, fields));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_custom_audience",
    "Create a new custom audience for an ad account",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      name: z.string().describe("Audience name"),
      subtype: z.string().describe("Audience subtype: CUSTOM, WEBSITE, APP, OFFLINE_CONVERSION, CLAIM, PARTNER, MANAGED, VIDEO, LOOKALIKE, ENGAGEMENT, BAG_OF_ACCOUNTS, STUDY_RULE_AUDIENCE, FOX"),
      description: optStr.describe("Audience description"),
      customer_file_source: optStr.describe("Source of customer data: USER_PROVIDED_ONLY, PARTNER_PROVIDED_ONLY, BOTH_USER_AND_PARTNER_PROVIDED"),
    },
    async ({ ad_account_id, ...data }) => {
      try {
        return ok(await client.createCustomAudience(ad_account_id, data));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_saved_audiences",
    "List saved audiences for an ad account",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ ad_account_id, ...params }) => {
      try {
        return ok(await client.listSavedAudiences(ad_account_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TARGETING
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "search_targeting",
    "Search for targeting options (interests, behaviors, demographics, locations, etc.)",
    {
      q: z.string().describe("Search query string"),
      type: z.string().describe("Type of targeting to search: adinterest, adeducationschool, adeducationmajor, adlocale, adcountry, adregion, adcity, adworkemployer, adworkposition, adTargetingCategory"),
      limit: optNum.describe("Number of results (default: 20)"),
    },
    async (params) => {
      try {
        return ok(await client.searchTargeting(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MEDIA
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_ad_images",
    "List ad images uploaded to an ad account",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ ad_account_id, ...params }) => {
      try {
        return ok(await client.listAdImages(ad_account_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_ad_videos",
    "List ad videos uploaded to an ad account",
    {
      ad_account_id: z.string().describe("Ad account ID (with or without act_ prefix)"),
      fields: optStr.describe("Comma-separated fields to return"),
      limit: optNum.describe("Number of results per page (default: 25)"),
      after: optStr.describe("Pagination cursor for next page"),
    },
    async ({ ad_account_id, ...params }) => {
      try {
        return ok(await client.listAdVideos(ad_account_id, params));
      } catch (e) {
        return err(e);
      }
    }
  );
}
