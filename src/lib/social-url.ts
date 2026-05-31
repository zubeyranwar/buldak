export type SocialPlatform = "tiktok" | "instagram" | "unknown";

export function detectPlatform(url: string): SocialPlatform {
    if (!url) return "unknown";
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("instagram.com")) return "instagram";
    return "unknown";
}

export function getTikTokEmbedUrl(url: string): string | null {
    // https://www.tiktok.com/@user/video/1234567890
    const match = url.match(/video\/(\d+)/);
    if (!match) return null;
    return `https://www.tiktok.com/embed/v2/${match[1]}`;
}

export function getInstagramEmbedUrl(url: string): string | null {
    // https://www.instagram.com/reel/ABC123/ or /p/ABC123/
    const match = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    return `https://www.instagram.com/p/${match[2]}/embed/`;
}

export function getEmbedUrl(url: string): string | null {
    const platform = detectPlatform(url);
    if (platform === "tiktok") return getTikTokEmbedUrl(url);
    if (platform === "instagram") return getInstagramEmbedUrl(url);
    return null;
}

export function extractHandle(url: string): string {
    const tiktok = url.match(/@([^/?]+)/);
    if (tiktok) return tiktok[1];
    const ig = url.match(/instagram\.com\/([^/?]+)/);
    if (ig && ig[1] !== "reel" && ig[1] !== "p") return ig[1];
    const igUser = url.match(/instagram\.com\/([^/?]+)\//);
    if (igUser) return igUser[1];
    return "";
}