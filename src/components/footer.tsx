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
                                src="https://gebeta.app/embed/map?t=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..PF-1IRpEOBKR1OOX.8TJy-UwaUiOdgKUffHVOG1XmhTb1KB3T6nBhSiDIKwqa0wfxoWkQ-HAczDNfiwEE2kR5fvU94WGEkQg7TbrSR9Vu_mI2T9i4U-ieW8YQaIlntrqOxCyIAPuHoj3DO55MBOC2mBMKH4Sjm8XFxyKWHfvg76IjR9GEfeZEi_qZWIR6iiMBf53iD7DsX9GMt2Awg1SCGSMZn0MDb1BCIK_R5D9V7SdSsLMg3BuPcZAzPa2105HHVv093zhZp8-vSGbdLgCwgZ-yK-dHjcdw-nw5__jYih4BhPsy34UH3kJ0fUfJFXhP6IGTYaLzk71Yxw3TJsecKPlDtUqNssnCZhk_6zwOoA5wa0puHWnM7aMESc_r9y831DCq3cNG4fVxKcnZqrYn9sgh_huuCYeEJFbRrufTvn0fqwAMLhzRb2IzPSnU9BCS1QjWsQFwenUWJvsCrGRW3HORIxqwDezZdY_scRZWOjldOnf8q8Smolnw3AW-dZg8NL3JeNTJ7KfqJXaK-RSGv-wy4d_KZj65iZsepB9CTHMOp-emzjoZo6OtVisYyTG62tWUAxJkP31PlnhAlqZeoxFIP48VrG1XERZefiaRS7Py2OpVM_hoO-msSsTDbKgSAe1bfVSk1f6nfuN3Yyg0wCEvVbaE6oWJiM7PvFlQ3lqtVD9a33mVsttTQYMxXrjtflgYL3jeLQ6KdoAYZxOnENFbILQ1IT_c2IDQtcmc-Av3qmeWZAJF8vUlWQe0aXlf0NR_E1e3Usvuunt18SBtRPngdwBjRK7A_maiMp3E3fHhmSsWYzhS0wL3c79Ukc339ECPpZvjPROgXYMgpXv8hcd-r3dxDuTc4v4xtrNkh5YmJlDyE_p9vVWlbDMgSoPz_ZKFrrQ6CH98Egf4Fo5008Jclz8WqFM2eRAlHikEF3Vmf0R8dQAkpD2dfDoYKfJzOdGiseiaLQb7Ih8S6atUfxZtN3qUqURsA28YWd8EqL4Dr2NI_cwjowGqnOkC63GJGXdA2-_WZUQx3BJ-5XH2UcxC6ZUCVhDwHkaBXAB-5Qx3kxTX25nzbM7UJqJ9GDkX3IhgPPfPViJmwySA-B4kqLRKuX-g9-4wrFk7dgUrVLK0KE0bKoRTQkH1wB1KRBoXzx6Nn8SPUu1EFnVNIcc3F5EkmNdmDqj2fKo-AmQbwneyjftFIjLb3xgYr_LBpg2k52aNtm8UWkkdaFOQ_pp8BZmp5wPCEdq4p1gzaVY-qUBc_utCJpCBN2NGA45XDpnf_IXT8abmxEB6l2-RTp45yJSGpbrwV3XTW1kdzWnSzVn4ZeQhvtbzpm96hbvwRfnBtp93Refqr5RyKtKpcLIXV7i5WrlEJ5i7pk_mi3nrLXA6JA2OnzGXzwYym7yPidkQCg-6T60i65wWJUu8uG3wtlK5LZZ0-LfmmdYjL-8Eds-UwsHW_b5dHZsXPNmXuvWFna3Z_gn06OGqGH9BaQnJSD5ZfjpihnncRQxWH4E_gRgBntUN4jLyP_TnDKguMBVmwoW0bFH7_EbaHbmoDTH7OiEx_8f2D-f5VoeD5tFUpT2tP1Le45CsKV7Q.-ViPnxZGVg2nJfGvrMdYMA"
                                width="600"
                                height="450"
                                loading="lazy"
                            ></iframe>
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
                                <a href="tel:+251978561111">
                                    <LayerInViewAnim
                                        as="p"
                                        scale={0.85}
                                        offsetY={18}
                                        based="physics"
                                        className="nav-link text-black! black-link"
                                    >
                                        +251978561111
                                    </LayerInViewAnim>
                                </a>

                                <a href="mailto:info@buldakdoro.com">
                                    <LayerInViewAnim
                                        as="p"
                                        scale={0.85}
                                        offsetY={18}
                                        based="physics"
                                        className="nav-link text-black! black-link"
                                    >
                                        info@buldakdoro.com
                                    </LayerInViewAnim>
                                </a>
                            </div>

                            <LayerInViewAnim scale={0.85} offsetY={18} based="physics">
                                <Link href="/menu" className="nav-link text-primary!">
                                    Menu <span className="-ml-1 text-[12px]">{""}</span>
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