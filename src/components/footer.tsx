import Image from "next/image"
import { Container } from "./container"
import { Logo } from "./logo"
import Link from "next/link"

export const Footer = () => {
    return (
        <Container>
            <footer className="flex flex-col gap-25 pb-12">
                <div className="grid grid-cols-4 items-center">
                    <div />
                    <div className="col-span-2 flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={200}
                            height={202}
                        />
                        <p className="heading">Buldak</p>
                    </div>

                    <div>
                        <p className="body-low">
                            Cold-pressed juices, smoothies & bowls
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-4">
                    <div />

                    <div className="col-span-2 pr-4">
                        <iframe
                            className="w-full h-[600px]"
                            frameBorder="0"
                            style={{ border: 0 }}
                            allowFullScreen
                            src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBVizdQeh3udy11xDc5Ao2YStR2gLc-rfc&q=XQPP%2BRW%2C%20Addis%20Ababa%201000&maptype=roadmap&zoom=14"
                        />
                    </div>

                    <div className="pl-4 flex flex-col gap-7.5">
                        <h2 className="font-sans! text-black! lowercase">Contacts</h2>
                        <p className="body-low text-black!">served daily from 8 AM to 8 PM at behind skylight hotel</p>
                        <div className="flex gap-2.5">
                            {Logo.tiktok}
                            {Logo.instagram}
                        </div>
                        <div>
                            <p className="nav-link text-black! black-link">+17364528200</p>
                            <p className="nav-link text-black! black-link">info@buldak.com</p>
                        </div>
                        <Link href="/menu" className="nav-link text-primary!">Menu <span className="-ml-1 text-[12px]">{17}</span></Link>
                    </div>
                </div>
                <p className="body-normal text-gray!">© 2026 Buldak </p>
            </footer>
        </Container >
    )
}
