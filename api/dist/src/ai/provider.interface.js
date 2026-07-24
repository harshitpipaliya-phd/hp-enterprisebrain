/** Thrown by every provider when called without configuration. */
export class ProviderNotConfiguredError extends Error {
    constructor(providerName, envVarNeeded) {
        super(`AI provider "${providerName}" is not configured — set ${envVarNeeded} to enable it.`);
        this.name = 'ProviderNotConfiguredError';
    }
}
