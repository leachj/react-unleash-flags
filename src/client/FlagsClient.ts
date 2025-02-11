import { DEFAULT_FEATURES_URI } from '../constants';

export type FlagsConfig = {
  appName: string;
  instanceId: string;
  host?: string; // make required after removing url
  url?: string; // @deprecated in favour of host
  uri?: string;
  userId: string;
  extraHttpHeaders?: { [key: string]: string };
};

export type FlagValue = {
  description?: string;
  enabled: boolean;
  name: string;
  strategies: {
    name: string;
    parameters: { [key: string]: string | number | boolean };
  }[];
};

class FlagsClient {
  private flags: FlagValue[] = [];

  constructor(public config: FlagsConfig) {
    this.checkValidInstance();
    this.config.uri = config.uri || DEFAULT_FEATURES_URI;
  }

  /**
   * Populate the flags
   */
  public async init() {
    await this.fetchFlags();
  }

  /**
   * Fetch all the flags for the current application
   */
  public getFlags(): FlagValue[] {
    return this.flags;
  }

  /**
   * Get a single Flag
   * @param flagName the name of the flag
   */
  public getFlag(flagName: string): FlagValue | undefined {
    return this.flags.filter((flag) => flag.name === flagName)[0];
  }

  /**
   * Get the user ID using the hook passed into the config
   */
  public getUserId(): string | undefined {
    if(this.config.userId) { return this.config.userId}
  }

  /**
   * Fetch all the flags from the API and store them on the flags prop
   */
  private async fetchFlags() {
    const { host, appName, uri, instanceId, extraHttpHeaders = {} } = this.config;
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'UNLEASH-APPNAME': appName || '',
      'UNLEASH-INSTANCEID': instanceId || '',
      ...extraHttpHeaders,
    };

    const response = await fetch(`${host}${uri}`, {
      headers,
      method: 'GET',
    });

    try {
      const json = await response.json();
      this.flags = json.features;
    } catch {
      // no json, return nothing
      this.flags = [];
    }
  }

  /**
   * Check if config is complete
   */
  private checkValidInstance() {
    if (!this.config) {
      throw Error('No config provided!');
    }

    // swap deprecated url with host
    if (!this.config.host && this.config.url) {
      this.config.host = this.config.url;

      // allow developers to update url to host
      // tslint:disable-next-line: no-console
      console.warn('config.url is deprecated, use config.host instead!');
    }

    const { host, appName, instanceId, url } = this.config;
    if (!host || !appName || !instanceId) {
      throw Error('Provided config is incomplete!');
    }
  }
}

export default FlagsClient;
