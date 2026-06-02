"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Container } from "./container";
import { LayerInViewAnim } from "./layer-in-view-anim";
import { Logo } from "./logo";
import { Button } from "./ui/button";

export const Navbar = () => {
    const [open, setOpen] = useState(false);

    return (
        <nav className="w-full">
            <Container>
                <div className="mt-2 flex justify-between items-center">
                    <LayerInViewAnim className="hidden sm:block" based="physics" offsetY={18} scale={0.85} delay={0}>
                        <Link href="/menu" className="nav-link text-primary!">Menu {/*<span className="-ml-1 text-[12px]">{17}</span>*/}</Link>
                    </LayerInViewAnim>
                    <LayerInViewAnim based="physics" offsetY={18} scale={0.85} delay={0}>
                        <Link href="/" className="flex gap-2 items-center">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={60}
                                height={62}
                            />
                            <h2>Buldak</h2>
                        </Link>
                    </LayerInViewAnim>
                    <div className="hidden sm:flex items-center gap-6">
                        <LayerInViewAnim className="flex gap-2" based="physics" offsetY={18} scale={0.85} delay={0.5}>
                            <Link href="https://www.tiktok.com/@buldakdoro" target="_blank">
                                <Logo.tiktok />
                            </Link>
                            <Link href="https://www.instagram.com/buldakdoro" target="_blank">
                                <Logo.instagram />
                            </Link>
                        </LayerInViewAnim>
                        {/* <LanguageSelector /> */}
                        <LayerInViewAnim based="physics" offsetY={18} scale={0.85} delay={0.4}>
                            <Link href="/reserve-table"><Button className="text-white">Reserve Table ➜</Button></Link>
                        </LayerInViewAnim>
                    </div>
                    <div
                        onClick={() => setOpen((prev) => !prev)}
                        className="sm:hidden flex">
                        <div className={`${open ? "bg-black" : "bg-primary"} rounded-full w-6 h-6 flex justify-center items-center cursor-pointer px-1`}>
                            {open ? <Logo.x fill="white" /> : <Logo.plus fill="white" />}
                        </div>
                    </div>

                    <div className={`${open ? "block" : "hidden"} absolute top-36 left-0 inset-0 bg-background h-screen z-9999 overflow-hidden`}>
                        <div className="w-full flex flex-col items-center gap-20">
                            <LayerInViewAnim based="physics" offsetY={18} scale={0.85} delay={0}>
                                <Link href="/menu" onClick={() => setOpen(false)} className="nav-link text-primary!">Menu {/*<span className="-ml-1 text-[12px]">{17}</span>*/}</Link>
                            </LayerInViewAnim>
                            <div className="flex flex-col items-center gap-6">
                                <LayerInViewAnim className="flex gap-2" based="physics" offsetY={18} scale={0.85} delay={0.5}>
                                    <Link href="https://www.tiktok.com/@buldakdoro" target="_blank">
                                        <Logo.tiktok />
                                    </Link>

                                    <Link href="https://www.instagram.com/buldakdoro" target="_blank">
                                        <Logo.instagram />
                                    </Link>
                                </LayerInViewAnim>
                                <LayerInViewAnim based="physics" offsetY={18} scale={0.85} delay={0.4}>
                                    <Link href="/reserve-table"><Button onClick={() => setOpen(false)} className="text-white">Reserve Table ➜</Button></Link>
                                </LayerInViewAnim>
                            </div>
                            <div className="space-y-2 text-center">
                                <p className="nav-link text-black!">bole, Addis ababa <br /> 43.7031° N, 5.4500° E  </p>
                                <a href="tel:+251978561111">
                                    <LayerInViewAnim
                                        as="p"
                                        scale={0.85}
                                        offsetY={18}
                                        based="physics"
                                        className="nav-link text-primary! hover:text-black! orange-link cursor-pointer"
                                    >
                                        +251978561111
                                    </LayerInViewAnim>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </nav >
    )
}
