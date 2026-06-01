"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { motion, Variants } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TestimonalDoc } from "./testimonals";
import { Logo } from "./logo";
import { detectPlatform, getEmbedUrl, extractHandle } from "@/lib/social-url";
import Image from "next/image";
import { getCloudinaryBlurUrl } from "@/lib/cloudinary";

function getAutoplayEmbedUrl(url: string, platform: string): string | null {
    const base = getEmbedUrl(url);
    if (!base) return null;
    if (platform === "tiktok") return `${base}?autoplay=1&loop=0`;
    if (platform === "instagram") return `${base}?autoplay=1&muted=1`;
    return base;
}

export const TestimonalSwiper = ({ testimonals }: { testimonals: TestimonalDoc[] }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: "center",
        dragFree: false,
        startIndex: 2,
        
    });

    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    const scrollToIndex = useCallback((i: number) => {
        emblaApi?.scrollTo(i);
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        onSelect();
        return () => { emblaApi.off("select", onSelect); };
    }, [emblaApi]);

    const itemVariants: Variants = {
        hidden: { opacity: 0, scale: 0.85, y: 18 },
        show: ({
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 58,
                mass: 1,
                delay: 0.6
            },
        }),
    } as const;

    return (
        <div className="relative select-none">
            <button
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
                aria-label="Previous"
            >
                <Logo.leftArrow />
            </button>
            <button
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
                aria-label="Next"
            >
                <Logo.rightArrow />
            </button>

            <div className="overflow-hidden" ref={emblaRef}>
                <motion.div
                    variants={itemVariants as any}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="flex gap-5 px-4">
                    {testimonals.map((t, i) => {
                        const isActive = i === selectedIndex;
                        return (
                            <div
                                key={t.id}
                                className="flex-none transition-opacity duration-300 cursor-pointer"
                                style={{
                                    width: "calc(70vh * 0.5625)",
                                    opacity: isActive ? 1 : 0.5,
                                }}
                                onClick={() => !isActive && scrollToIndex(i)}
                            >
                                <TestimonalCard {...t} isActive={isActive} />
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
};

export const TestimonalCard = ({
    coverImage,
    videoUrl,
    isActive,
}: Omit<TestimonalDoc, "id"> & { isActive: boolean }) => {
    const platform = detectPlatform(videoUrl);
    const handle = extractHandle(videoUrl);
    const embedUrl = getAutoplayEmbedUrl(videoUrl, platform);
    const blurUrl = getCloudinaryBlurUrl(coverImage?.url ?? "");
    const [iframeReady, setIframeReady] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const PlatformIcon = platform === "instagram" ? Logo.instagram : Logo.tiktok;

    useEffect(() => {
        if (!isActive) {
            setIframeReady(false);
        }
    }, [isActive]);

    return (
        <div
            className="relative h-[70vh] aspect-9/16 rounded-3xl overflow-hidden border border-black"
        >
            {coverImage?.url && (
                <div
                    className="absolute inset-0 z-10 transition-opacity duration-700"
                    style={{ opacity: iframeReady ? 0 : 1 }}
                >
                    <Image
                        src={coverImage.url}
                        fill
                        alt="testimonial cover"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={blurUrl}
                    />
                </div>
            )}

            {!isActive && (
                <div className="absolute inset-0 bg-primary/50 mix-blend-multiply z-20 pointer-events-none" />
            )}

            {embedUrl && isActive && (
                <iframe
                    ref={iframeRef}
                    key={videoUrl}
                    src={embedUrl}
                    onLoad={() => setIframeReady(true)}
                    className="absolute inset-0 w-full h-full border-0 z-30 transition-opacity duration-700"
                    style={{ opacity: iframeReady ? 1 : 0 }}
                    allowFullScreen
                    scrolling="no"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                />
            )}

            <Link
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-40 flex items-end p-4"
                style={{
                    background: "linear-gradient(rgba(0,0,0,0) 80%, rgba(0,0,0,0.85) 100%)",
                    pointerEvents: "none",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2" style={{ pointerEvents: "auto" }}>
                    <div className="size-8 rounded-full bg-white flex items-center justify-center shrink-0">
                        <PlatformIcon className="size-4" />
                    </div>
                    {handle && (
                        <span className="text-white text-sm font-medium">
                            @{platform === "instagram" ? "buldakdoro" : handle}
                        </span>
                    )}
                </div>
            </Link>
        </div>
    );
};