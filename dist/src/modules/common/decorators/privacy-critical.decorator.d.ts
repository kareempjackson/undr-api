export declare const PrivacyCritical: (options?: {
    storeNoIpData?: boolean;
    detectProxy?: boolean;
    proxyHandling?: "allow" | "flag" | "challenge" | "block";
    regionOnly?: boolean;
}) => import("@nestjs/common").CustomDecorator<string>;
