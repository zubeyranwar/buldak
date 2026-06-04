"use client";

import { useEffect, useState } from "react";
import { Container } from "./container";
import { LayerInViewAnim } from "./layer-in-view-anim";

type GoogleReview = {
    author_name: string;
    profile_photo_url: string;
    rating: number;
    relative_time_description: string;
    text: string;
    google_maps_uri: string;
};

const StarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBC04" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const FiveStars = () => (
    <span className="flex gap-0.5" aria-label="5 stars">
        {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
    </span>
);

const Shimmer = ({ className }: { className: string }) => (
    <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
);

const SkeletonCard = () => (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3">
            <Shimmer className="h-11 w-11 shrink-0 rounded-full bg-white/8" />
            <div className="flex-1 space-y-2">
                <Shimmer className="h-3 w-28 rounded bg-white/8" />
                <Shimmer className="h-2.5 w-20 rounded bg-white/6" />
            </div>
        </div>
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => <Shimmer key={i} className="h-3.5 w-3.5 rounded-sm bg-white/8" />)}
        </div>
        <div className="space-y-2">
            <Shimmer className="h-2.5 w-full rounded bg-white/8" />
            <Shimmer className="h-2.5 w-4/5 rounded bg-white/8" />
            <Shimmer className="h-2.5 w-3/5 rounded bg-white/6" />
        </div>
    </div>
);

const SkeletonRating = () => (
    <div className="flex items-center gap-3">
        <Shimmer className="h-16 w-14 rounded-lg bg-white/8" />
        <div className="flex flex-col gap-2">
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Shimmer key={i} className="h-3.5 w-3.5 rounded-sm bg-white/8" />)}
            </div>
            <Shimmer className="h-2.5 w-24 rounded bg-white/6" />
        </div>
    </div>
);

const ReviewCard = ({ review }: { review: GoogleReview }) => {
    const [expanded, setExpanded] = useState(false);
    const isLong = review.text.length > 160;
    const displayText = isLong && !expanded ? review.text.slice(0, 160) + "…" : review.text;

    return (
        <a
            href={review.google_maps_uri}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] cursor-pointer"
        >
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-[#FBBC04]/40 to-transparent" />

            <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                    <img
                        src={review.profile_photo_url}
                        alt={review.author_name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=2a2a2a&color=fbbc04&size=88`;
                        }}
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/90 leading-tight">{review.author_name}</p>
                </div>
                <svg
                    className="shrink-0 opacity-0 group-hover:opacity-50 transition-opacity duration-200"
                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <path d="M7 17L17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <FiveStars />

            <p className="text-sm leading-relaxed text-white/65">
                {displayText}
                {isLong && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded); }}
                        className="ml-1 text-[#FBBC04]/80 underline-offset-2 hover:text-[#FBBC04] hover:underline transition-colors text-xs font-medium"
                    >
                        {expanded ? "Show less" : "Read more"}
                    </button>
                )}
            </p>
        </a >
    );
};

const AggregateRating = ({ rating, total }: { rating: number; total: number }) => (
    <div className="flex items-center gap-3">
        <span className="font-serif text-6xl font-bold leading-none text-primary">{rating.toFixed(1)}</span>
        <div className="flex flex-col gap-1">
            <FiveStars />
            <span className="text-xs text-gray!">{total} Google reviews</span>
        </div>
    </div>
);

export const GoogleReviews = () => {
    const [reviews, setReviews] = useState<GoogleReview[]>([]);
    const [rating, setRating] = useState<number | null>(null);
    const [totalRatings, setTotalRatings] = useState<number | null>(null);
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
        const placeId = process.env.NEXT_PUBLIC_BULDAK_PLACE_ID;

        const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
        url.searchParams.set("fields", "rating,userRatingCount,reviews");
        url.searchParams.set("key", apiKey!);
        url.searchParams.set("languageCode", "en");

        fetch(url.toString())
            .then((r) => r.json())
            .then((data) => {
                const fiveStars: GoogleReview[] = (data.reviews ?? [])
                    .filter((r: any) => r.rating === 5)
                    .map((r: any) => ({
                        author_name: r.authorAttribution?.displayName ?? "Guest",
                        profile_photo_url: r.authorAttribution?.photoUri ?? "",
                        rating: r.rating,
                        relative_time_description: r.relativePublishTimeDescription ?? "",
                        text: r.text?.text ?? "",
                        google_maps_uri: r.googleMapsUri ?? "#",
                    }));

                setReviews(fiveStars);
                if (data.rating) setRating(data.rating);
                if (data.userRatingCount) setTotalRatings(data.userRatingCount);
                setStatus("success");
            })
            .catch(() => setStatus("error"));
    }, []);

    return (
        <>
            <style>{`
                @keyframes shimmer { 100% { transform: translateX(200%); } }
            `}</style>
            <section className="mt-24 flex flex-col gap-12">
                <Container>
                    <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                        <LayerInViewAnim>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FBBC04]/25 bg-[#FBBC04]/10 px-3 py-1 text-xs font-medium text-[#FBBC04]">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        Google Reviews
                                    </span>
                                </div>
                                <h2 className="font-sans!">What guests are saying</h2>
                                <p className="body-low max-w-xl!">
                                    Straight from Google Maps, unfiltered opinions from people who came hungry and left happy.
                                </p>
                            </div>
                        </LayerInViewAnim>
                        <div className="shrink-0">
                            {status === "loading" ? (
                                <SkeletonRating />
                            ) : rating !== null && totalRatings !== null ? (
                                <AggregateRating rating={rating} total={totalRatings} />
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {status === "loading"
                            ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
                            : reviews.map((review, i) => (
                                <ReviewCard key={`${review.author_name}-${i}`} review={review} />
                            ))}
                    </div>

                    {status === "success" && (
                        <div className="mt-10 flex justify-center">
                            <a
                                href={`https://search.google.com/local/reviews?placeid=${process.env.NEXT_PUBLIC_BULDAK_PLACE_ID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-8 py-3 font-medium transition-all duration-200 hover:border-white/24 hover:bg-white/8"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                                </svg>
                                See all {totalRatings} reviews on Google Maps
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M7 17L17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                        </div>
                    )}
                </Container>
            </section >
        </>
    );
};