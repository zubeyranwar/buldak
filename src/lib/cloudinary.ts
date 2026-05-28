export function getCloudinaryBlurUrl(src: string): string {
    if (!src.includes("cloudinary.com")) return src;
    return src.replace("/upload/", "/upload/w_20,e_blur:200,q_1,f_auto/");
}