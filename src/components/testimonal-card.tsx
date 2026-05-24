"use client";

import Image from "next/image";
import Link from "next/link";
import { TestimonalDoc } from "./testimonals";
import { Logo } from "./logo";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { LayerInViewAnim } from "./layer-in-view-anim";

interface TestimonalCardProps extends Omit<TestimonalDoc, "id"> { }

export const TestimonalSwiper = ({ testimonals }: { testimonals: TestimonalDoc[] }) => {
    return (
        <Swiper
            slidesPerView={1}
            spaceBetween={20}
            centeredSlides={true}
            initialSlide={Math.floor(testimonals.length / 2) - 2}
            breakpoints={{
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1280: {
                    slidesPerView: 4,
                    spaceBetween: 30,
                },
            }}
            pagination={{
                clickable: true,
            }}
            modules={[Pagination]}
            className="w-full overflow-visible! pb-12 pl-4 sm:pl-6 mt-0!"
        >
            {testimonals.map(testimonal => (
                <SwiperSlide key={testimonal.id} className="h-auto! w-[60%]! sm:w-[50%]! lg:w-[16%]!">
                    <LayerInViewAnim based="physics" offsetY={18} scale={0.85} delay={0}>
                        <TestimonalCard {...testimonal} />
                    </LayerInViewAnim>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

export const TestimonalCard = ({ quote, coverImage, videoUrl }: TestimonalCardProps) => {
    return (
        <article className="flex h-full flex-col gap-2.5">
            <Link href={videoUrl} target="_blank" rel="noreferrer" className="relative block overflow-hidden rounded-[20px] border-black">
                <Image
                    src={coverImage.url}
                    alt="Testimonial poster"
                    width={640}
                    height={800}
                    className="aspect-3/5 w-full object-contain"
                />
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                    <Logo.play className="bg-white rounded-full px-1 size-10" />
                </span>
            </Link>

            <div className="space-y-1 px-1">
                <p className="font-dm-mono nav-s normal-case! text-black! leading-[1.3]! line-clamp-2">
                    "{quote.trim()}"
                </p>

                {/* <div className="w-full font-dm-mono nav-s flex items-center gap-y-1 text-black! uppercase">
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
                </div> */}
            </div>
        </article>
    );
};