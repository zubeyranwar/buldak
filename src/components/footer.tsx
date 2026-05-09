import Image from "next/image"
import { Container } from "./container"
import { Logo } from "./logo"
import Link from "next/link"
import { LayerInViewAnim } from "./layer-in-view-anim"

export const Footer = () => {
    return (
        <footer className="flex flex-col gap-25 pt-37.5 pb-12">
            <Container>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 md:gap-0">
                    <div className="spacer" />
                    <LayerInViewAnim delay={0} className="md:col-span-2 flex flex-col md:flex-row items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={200}
                            height={202}
                        />
                        <p className="heading md:heading">Buldak</p>
                    </LayerInViewAnim>
                    <LayerInViewAnim delay={0.2}>
                        <p className="body-low md:text-center">
                            Cold-pressed juices, smoothies & bowls
                        </p>
                    </LayerInViewAnim>
                </div>
                <div className="mt-6 md:mt-0 grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-0">
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
                        <LayerInViewAnim scale={0.85} offsetY={18} based="physics">
                            <h2 className="font-sans! text-black! lowercase">Contacts</h2>
                        </LayerInViewAnim>
                        <LayerInViewAnim>
                            <p className="body-low text-black!">served daily from 8 AM to 8 PM at behind skylight hotel</p>
                        </LayerInViewAnim>
                        <LayerInViewAnim scale={0.85} offsetY={18} based="physics" className="flex gap-2.5">
                            <Logo.tiktok />
                            <Logo.instagram />
                        </LayerInViewAnim>
                        <div>
                            <LayerInViewAnim scale={0.85} offsetY={18} based="physics">
                                <p className="nav-link text-black! black-link">+17364528200</p>
                            </LayerInViewAnim>
                            <LayerInViewAnim scale={0.85} offsetY={18} based="physics">
                                <p className="nav-link text-black! black-link">info@buldak.com</p>
                            </LayerInViewAnim>

                        </div>
                        <Link href="/menu" className="nav-link text-primary!">Menu <span className="-ml-1 text-[12px]">{17}</span></Link>
                    </div>
                </div>
                <p className="body-normal text-gray! mt-4 md:mt-0">© 2026 Buldak </p>
            </Container>
        </footer>
    )
}
