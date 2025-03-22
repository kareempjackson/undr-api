import { SetMetadata } from "@nestjs/common";

/**
 * This decorator marks endpoints as privacy-critical,
 * triggering enhanced IP masking and proxy handling.
 *
 * Use this on controller methods for endpoints where
 * location data is sensitive.
 *
 * @param options Options for privacy handling
 */
export const PrivacyCritical = (
  options: {
    // Whether to store any IP-related data at all
    storeNoIpData?: boolean;

    // Whether to perform proxy/VPN detection
    detectProxy?: boolean;

    // How to handle proxy/VPN connections
    proxyHandling?: "allow" | "flag" | "challenge" | "block";

    // Log only region instead of any IP-related info
    regionOnly?: boolean;
  } = {}
) => SetMetadata("privacy-critical", options);
