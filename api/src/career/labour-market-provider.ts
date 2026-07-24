/**
 * Labour Market Provider abstraction (Career Intelligence sprint, Part 6).
 *
 * Same discipline as the AI Provider abstraction: an interface, real
 * behavior when unconfigured (throws, doesn't fabricate), a factory that
 * would switch by environment variable once a real provider exists. The
 * stakes here are higher than an unconfigured AI provider — presenting
 * invented salary trends or job-demand numbers to a family as if real
 * could mislead a real decision about a real person's future. There is no
 * placeholder data anywhere in this file. Every method throws until a real
 * government/labour-market API is wired in — that is correct behavior,
 * not a gap to paper over.
 */

export interface OccupationDemand {
  occupationCode: string;
  demandTrend: 'growing' | 'stable' | 'declining';
  projectedGrowthPercent: number;
  source: string;
  asOfDate: string;
}

export interface SalaryTrend {
  occupationCode: string;
  currency: string;
  medianAnnual: number;
  percentile25: number;
  percentile75: number;
  region: string;
  source: string;
  asOfDate: string;
}

export interface EmergingSkill {
  skillName: string;
  growthSignal: string;
  relatedOccupationCodes: string[];
  source: string;
}

export interface LabourMarketProvider {
  readonly name: string;
  readonly available: boolean;
  getDemand(occupationCode: string): Promise<OccupationDemand>;
  getSalaryTrend(occupationCode: string, region: string): Promise<SalaryTrend>;
  getEmergingSkills(careerClusterCode: string): Promise<EmergingSkill[]>;
}

export class LabourMarketProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(`Labour Market provider "${providerName}" is not configured — no government or labour-market data source is wired in. This is the correct state until a real provider is configured; no fabricated market data is ever returned.`);
    this.name = 'LabourMarketProviderNotConfiguredError';
  }
}

/**
 * The only implementation right now — genuinely unconfigured, because no
 * real labour-market data source exists to connect to. Refusing to answer
 * is the entire correct behavior until a real provider is selected (a
 * decision with real licensing and data-quality implications).
 */
export class UnconfiguredLabourMarketProvider implements LabourMarketProvider {
  readonly name = 'unconfigured';
  readonly available = false;

  async getDemand(): Promise<OccupationDemand> {
    throw new LabourMarketProviderNotConfiguredError(this.name);
  }
  async getSalaryTrend(): Promise<SalaryTrend> {
    throw new LabourMarketProviderNotConfiguredError(this.name);
  }
  async getEmergingSkills(): Promise<EmergingSkill[]> {
    throw new LabourMarketProviderNotConfiguredError(this.name);
  }
}

export function getLabourMarketProvider(): LabourMarketProvider {
  return new UnconfiguredLabourMarketProvider();
}
