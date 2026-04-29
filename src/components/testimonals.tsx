"use client";

import { sluggish } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const TESTIMONALS = [
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },
    {
        name: "Bitaniya Solomon",
        used: ["Chicken kampong", "Cold ramen ", "Beef kimbap"],
        quote: "Delicious! I loved it, Specially Chicken kampong, it was so good! ",
        posterSrc: "https://res.cloudinary.com/du5mob6ny/image/upload/v1777418598/Screenshot_from_2026-04-29_02-16-19_iufhhw.png",
        videoSrc: "https://www.instagram.com/p/DXcQd63DKK3/"
    },

]

export const Testimonals = () => {
    return (
        <section className="mt-20 flex min-h-screen flex-col gap-8 overflow-hidden py-8">
            <div className="w-full max-w-400 mx-auto">

                <div className="flex items-end justify-between gap-6">
                    <div className="max-w-2xl space-y-3">
                        <h2 className="font-sans!">Words of affirmation</h2>
                        <p className="body-low max-w-xl!">
                            Real reactions from guests who stopped by for ramen, drinks, and everything spicy in between.
                        </p>
                    </div>
                </div>

            </div>
            <Swiper
                modules={[Pagination]}
                spaceBetween={14}
                slidesPerView="auto"
                grabCursor
                pagination={{ clickable: true }}
                className="w-full overflow-visible! pb-12 pl-4 sm:pl-6"
            >
                {TESTIMONALS.map((testimonal, index) => (
                    <SwiperSlide key={`${testimonal.name}-${index}`} className="h-auto! w-64! md:w-72!">
                        <TestimonalCard {...testimonal} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    )
}

interface TestimonalCardProps {
    name: string;
    used?: string[];
    quote: string;
    posterSrc: string;
    videoSrc: string;
}

const TestimonalCard = ({ name, used, quote, posterSrc, videoSrc }: TestimonalCardProps) => {
    return (
        <article className="flex h-full flex-col gap-2.5">
            <Link href={videoSrc} target="_blank" rel="noreferrer" className="relative block overflow-hidden rounded-[20px] border-black">
                <Image
                    src={posterSrc}
                    alt={`${name} poster`}
                    width={640}
                    height={800}
                    className="aspect-3/5 w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                    <span className="size-10 rounded-full bg-black/20 text-white grid place-items-center text-sm">
                        ▶
                    </span>
                </span>
            </Link>

            <div className="space-y-1 px-1">
                <p className="font-dm-mono nav-s normal-case! text-black! leading-[1.3]! line-clamp-2">
                    "{quote.trim()}"
                </p>

                <div className="w-full font-dm-mono nav-s flex items-center gap-y-1 text-black! uppercase">
                    <span>{name}</span>
                    <span className="text-black-80!">used</span>
                    <div className="ml-3 flex flex-col">
                        {used?.map((item, index) => (
                            <Link
                                href={`/menu/${sluggish(item.trim())}`}
                                key={index}
                                className="text-primary!"
                            >
                                {item.trim()}{index < used.length - 1 ? "," : ""}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </article>
    );
};

