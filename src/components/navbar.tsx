import Image from "next/image"
import Link from "next/link"
import { Logo } from "./logo"
import { Button } from "./ui/button"

export const Navbar = () => {
    return (
        <nav>
            <div className="flex justify-between items-center">
                <Link href="/menu" className="nav-link text-primary!">Menu <span className="-ml-1 text-[12px]">{17}</span></Link>
                <div className="flex gap-2 items-center">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={60}
                        height={62}
                    />
                    <h2>Buldak</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                        {Logo.tiktok}
                        {Logo.instagram}
                    </div>
                    <Button className="text-white">Reserve Table ➜</Button>
                </div>
            </div>
        </nav >
    )
}
