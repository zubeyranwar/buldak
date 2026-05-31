import Image from "next/image"
import { Container } from "./container"
import { Logo } from "./logo"
import Link from "next/link"
import { LayerInViewAnim } from "./layer-in-view-anim"

export const Footer = () => {
    return (
        <footer className="flex flex-col gap-25 pt-37.5 pb-12">
            <Container>
                <LayerInViewAnim offsetY={40} delay={0} amount={0.1}>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 md:gap-0">
                        <div className="spacer" />
                        <LayerInViewAnim delay={0} className="md:col-span-2 flex flex-col md:flex-row items-center gap-2">
                            <Image src="/logo.png" alt="Logo" width={200} height={202} />
                            <p className="heading md:heading">Buldak</p>
                        </LayerInViewAnim>
                        <LayerInViewAnim delay={0.2}>
                            <p className="body-low md:text-center">
                                Spicy chicken & Korean foods
                            </p>
                        </LayerInViewAnim>
                    </div>

                    <div className="mt-6 md:mt-12 grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-0">
                        <div className="spacer" />

                        <div className="col-span-2 pr-4">
                            <iframe
                                className="w-full h-150"
                                frameBorder="0"
                                style={{ border: 0 }}
                                allowFullScreen
                                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBVizdQeh3udy11xDc5Ao2YStR2gLc-rfc&q=XQPP%2BRW%2C%20Addis%20Ababa%201000&maptype=roadmap&zoom=14"
                            />
                        </div>

                        <div className="pl-0 md:pl-4 flex flex-col gap-7.5">
                            <LayerInViewAnim as="h2" scale={0.85} offsetY={18} based="physics" className="font-sans! text-black! lowercase">
                                Contacts
                            </LayerInViewAnim>

                            <LayerInViewAnim as="p" based="time" className="body-low text-black!">
                                served daily from 8 AM to 8 PM at behind skylight hotel
                            </LayerInViewAnim>

                            <div className="flex gap-2.5">
                                <LayerInViewAnim scale={0.85} offsetY={18}>
                                    <Link href="https://www.tiktok.com/@buldakdoro" target="_blank">
                                        <Logo.tiktok />
                                    </Link>
                                </LayerInViewAnim>
                                <LayerInViewAnim scale={0.85} offsetY={18}>
                                    <Link href="https://www.instagram.com/buldakdoro" target="_blank">
                                        <Logo.instagram />
                                    </Link>
                                </LayerInViewAnim>
                            </div>

                            <div>
                                <LayerInViewAnim as="p" scale={0.85} offsetY={18} based="physics" className="nav-link text-black! black-link">
                                    +251978561111
                                </LayerInViewAnim>
                                <LayerInViewAnim as="p" scale={0.85} offsetY={18} based="physics" className="nav-link text-black! black-link">
                                    info@buldakdoro.com
                                </LayerInViewAnim>
                            </div>

                            <LayerInViewAnim scale={0.85} offsetY={18} based="physics">
                                <Link href="/menu" className="nav-link text-primary!">
                                    Menu <span className="-ml-1 text-[12px]">{17}</span>
                                </Link>
                            </LayerInViewAnim>
                        </div>
                    </div>

                    <p className="body-normal text-gray! mt-4 md:mt-16"> © 2026 Buldak</p>

                </LayerInViewAnim>
            </Container >
        </footer >
    )
}