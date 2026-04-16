/**
 * Meta Ads API client — wraps the Meta Graph API v22.0.
 * All methods require a valid userId with credentials stored in Supabase.
 */
import { store } from "./store";

const GRAPH_API = "https://graph.facebook.com/v22.0";

export class MetaAdsClient {
  constructor(private readonly userId: string) {}

  private async getToken(): Promise<string> {
    const creds = await store.getCredentials(this.userId);
    if (!creds) throw new Error("No credentials found. Please reconnect.");
    if (creds.tokenExpiresAt < Date.now()) {
      throw new Error("Meta access token expired. Please reconnect via the /connect flow.");
    }
    return creds.accessToken;
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string | number | boolean | string[] | undefined>,
    body?: Record<string, unknown>
  ): Promise<T> {
    const token = await this.getToken();
    const url = new URL(`${GRAPH_API}/${path.replace(/^\//, "")}`);
    url.searchParams.set("access_token", token);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
        }
      }
    }
    const res = await fetch(url.toString(), {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      throw new Error(`Meta Graph API ${method} /${path} → ${res.status}: ${text}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
  }

  // ── User & Accounts ──────────────────────────────────────────────────────────

  async getMe(fields = "id,name,email"): Promise<unknown> {
    return this.request("GET", "me", { fields });
  }

  async listAdAccounts(params?: { fields?: string; limit?: number; after?: string }): Promise<unknown> {
    return this.request("GET", "me/adaccounts", {
      fields: params?.fields ?? "id,name,currency,account_status,business",
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }

  async getAdAccount(adAccountId: string, fields = "id,name,currency,account_status,business,spend_cap,balance"): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", id, { fields });
  }

  async listBusinesses(params?: { fields?: string; limit?: number }): Promise<unknown> {
    return this.request("GET", "me/businesses", {
      fields: params?.fields ?? "id,name,verification_status",
      limit: params?.limit ?? 25,
    });
  }

  async getBusiness(businessId: string, fields = "id,name,verification_status,created_time"): Promise<unknown> {
    return this.request("GET", businessId, { fields });
  }

  async listBusinessAdAccounts(businessId: string, params?: { fields?: string; limit?: number }): Promise<unknown> {
    return this.request("GET", `${businessId}/owned_ad_accounts`, {
      fields: params?.fields ?? "id,name,currency,account_status",
      limit: params?.limit ?? 25,
    });
  }

  // ── Campaigns ────────────────────────────────────────────────────────────────

  async listCampaigns(adAccountId: string, params?: { fields?: string; effective_status?: string[]; limit?: number; after?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", `${id}/campaigns`, {
      fields: params?.fields ?? "id,name,objective,status,effective_status,start_time,stop_time,daily_budget,lifetime_budget,budget_remaining",
      effective_status: params?.effective_status,
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }

  async getCampaign(campaignId: string, fields = "id,name,objective,status,effective_status,start_time,stop_time,daily_budget,lifetime_budget,budget_remaining,spend_cap"): Promise<unknown> {
    return this.request("GET", campaignId, { fields });
  }

  async createCampaign(adAccountId: string, data: { name: string; objective: string; status?: string; special_ad_categories?: string[]; daily_budget?: number; lifetime_budget?: number }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("POST", `${id}/campaigns`, undefined, {
      ...data,
      special_ad_categories: data.special_ad_categories ?? [],
    });
  }

  async updateCampaign(campaignId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", campaignId, undefined, data);
  }

  async deleteCampaign(campaignId: string): Promise<unknown> {
    return this.request("DELETE", campaignId);
  }

  // ── Ad Sets ──────────────────────────────────────────────────────────────────

  async listAdSets(adAccountId: string, params?: { fields?: string; campaign_id?: string; effective_status?: string[]; limit?: number; after?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", `${id}/adsets`, {
      fields: params?.fields ?? "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,start_time,end_time,targeting,optimization_goal,billing_event",
      campaign_id: params?.campaign_id,
      effective_status: params?.effective_status,
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }

  async getAdSet(adSetId: string, fields = "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,start_time,end_time,targeting,optimization_goal,billing_event,bid_amount"): Promise<unknown> {
    return this.request("GET", adSetId, { fields });
  }

  async createAdSet(adAccountId: string, data: Record<string, unknown>): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("POST", `${id}/adsets`, undefined, data);
  }

  async updateAdSet(adSetId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", adSetId, undefined, data);
  }

  async deleteAdSet(adSetId: string): Promise<unknown> {
    return this.request("DELETE", adSetId);
  }

  // ── Ads ──────────────────────────────────────────────────────────────────────

  async listAds(adAccountId: string, params?: { fields?: string; adset_id?: string; campaign_id?: string; effective_status?: string[]; limit?: number; after?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", `${id}/ads`, {
      fields: params?.fields ?? "id,name,adset_id,campaign_id,status,effective_status,creative,created_time",
      adset_id: params?.adset_id,
      campaign_id: params?.campaign_id,
      effective_status: params?.effective_status,
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }

  async getAd(adId: string, fields = "id,name,adset_id,campaign_id,status,effective_status,creative,created_time,tracking_specs"): Promise<unknown> {
    return this.request("GET", adId, { fields });
  }

  async createAd(adAccountId: string, data: Record<string, unknown>): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("POST", `${id}/ads`, undefined, data);
  }

  async updateAd(adId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", adId, undefined, data);
  }

  async deleteAd(adId: string): Promise<unknown> {
    return this.request("DELETE", adId);
  }

  // ── Ad Creatives ─────────────────────────────────────────────────────────────

  async listAdCreatives(adAccountId: string, params?: { fields?: string; limit?: number; after?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", `${id}/adcreatives`, {
      fields: params?.fields ?? "id,name,title,body,image_url,video_id,object_story_spec",
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }

  async getAdCreative(creativeId: string, fields = "id,name,title,body,image_url,video_id,object_story_spec,effective_object_story_id"): Promise<unknown> {
    return this.request("GET", creativeId, { fields });
  }

  async createAdCreative(adAccountId: string, data: Record<string, unknown>): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("POST", `${id}/adcreatives`, undefined, data);
  }

  // ── Insights ─────────────────────────────────────────────────────────────────

  async getInsights(objectId: string, params: {
    level?: "account" | "campaign" | "adset" | "ad";
    fields?: string;
    date_preset?: string;
    time_range?: { since: string; until: string };
    breakdowns?: string[];
    limit?: number;
    after?: string;
  }): Promise<unknown> {
    return this.request("GET", `${objectId}/insights`, {
      level: params.level,
      fields: params.fields ?? "impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,cost_per_action_type,video_views",
      date_preset: params.date_preset ?? "last_30d",
      time_range: params.time_range ? JSON.stringify(params.time_range) : undefined,
      breakdowns: params.breakdowns,
      limit: params.limit ?? 25,
      after: params.after,
    });
  }

  // ── Pages ────────────────────────────────────────────────────────────────────

  async listPages(params?: { fields?: string; limit?: number }): Promise<unknown> {
    return this.request("GET", "me/accounts", {
      fields: params?.fields ?? "id,name,category,fan_count,followers_count,link",
      limit: params?.limit ?? 25,
    });
  }

  async getPage(pageId: string, fields = "id,name,category,fan_count,followers_count,link,about,website"): Promise<unknown> {
    return this.request("GET", pageId, { fields });
  }

  async getPageInsights(pageId: string, params?: { metric?: string; period?: string; since?: string; until?: string }): Promise<unknown> {
    return this.request("GET", `${pageId}/insights`, {
      metric: params?.metric ?? "page_impressions,page_engaged_users,page_views_total,page_fans",
      period: params?.period ?? "day",
      since: params?.since,
      until: params?.until,
    });
  }

  // ── Custom Audiences ─────────────────────────────────────────────────────────

  async listCustomAudiences(adAccountId: string, params?: { fields?: string; limit?: number; after?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", `${id}/customaudiences`, {
      fields: params?.fields ?? "id,name,subtype,approximate_count,data_source",
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }

  async getCustomAudience(audienceId: string, fields = "id,name,subtype,approximate_count,data_source,delivery_status"): Promise<unknown> {
    return this.request("GET", audienceId, { fields });
  }

  async createCustomAudience(adAccountId: string, data: { name: string; subtype: string; description?: string; customer_file_source?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("POST", `${id}/customaudiences`, undefined, data);
  }

  // ── Saved Audiences ──────────────────────────────────────────────────────────

  async listSavedAudiences(adAccountId: string, params?: { fields?: string; limit?: number; after?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", `${id}/saved_audiences`, {
      fields: params?.fields ?? "id,name,approximate_count,targeting",
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }

  // ── Targeting Search ─────────────────────────────────────────────────────────

  async searchTargeting(params: { q: string; type: string; limit?: number }): Promise<unknown> {
    return this.request("GET", "search", {
      type: params.type,
      q: params.q,
      limit: params.limit ?? 20,
    });
  }

  // ── Ad Images ────────────────────────────────────────────────────────────────

  async listAdImages(adAccountId: string, params?: { fields?: string; limit?: number; after?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", `${id}/adimages`, {
      fields: params?.fields ?? "hash,url,url_128,width,height,name,status",
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }

  // ── Ad Videos ────────────────────────────────────────────────────────────────

  async listAdVideos(adAccountId: string, params?: { fields?: string; limit?: number; after?: string }): Promise<unknown> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.request("GET", `${id}/advideos`, {
      fields: params?.fields ?? "id,title,description,length,thumbnails,status",
      limit: params?.limit ?? 25,
      after: params?.after,
    });
  }
}
