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
                                src="https://gebeta.app/embed/map?t=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..tlV6YPdZRUsKy0zY.5y4k8rE4PbuN-i3hJQUlZL7MDVFfosskFlpB9kxgaUDOYDVg1HsndYQTbskjQy4rzF45OoDtZ9GFDDa-nzWhawmrKDI-iLudVEd-wqyNhT5UvUKw9aO70lC9W_vSUp3GB74bKI-0TOYO9lQ82_YaL2l6k6SC9Sbn93le_LzhvfDSqGhRU2RBao__N4IrQ6EV2ILPYPJeGGDqte815AWMePikoGcK86Ou_7jLSwn5IcNli80aB2-Bd4ulT5yC4kKn9L_1RcD40YI2Y2vtiFf2G8nuHzUhmMGsG4wxMAo7kupBt10BNGrtUa_dbFdFzgZRDXb7ekbJZ8Sbyxo2ZD_XvEYn1GK2Wr_vjUOHjDT5H6fKfnw82STBFvytsCuHY5CbZTFr6FiRlFVLDdu4tAnOm-iMOLeHbzohGEIi_jRgRm690_1KAqbs7v7VZAYHKM9ph_Ex9pE6nIDPXg8_Y2vX84gwJUrEcGSPVhIXhgoV9pPdR19eQVw5O_k0fPIJVCpHUyYdKKPNu2PTXEApePO-tYlRT_DPNugjza3I8nh2PFlWpaSLW246dJaz_DWz9X6GYEV63nW4SYmAZGWOiGFncy5BXs3A5NNOnc3f06_GawXZyCVuZnQ-rMpsFX1SKuYjCkuK1SZILiZBNaBYfIl0WvseyBv6xIUdcMcGqYA16NeQ3YdkMEJiplQ2FKDmLxgrYxU_0pZxHozf7tqKiU0zC_DphUUj-JmIVhS07mZTwOG5fdiMeafIpfBpnanyFiDzU9xu6ocdfWeTiXL6SJemMLcBd-Xv2q-ctenC9_OUsjjZDf96h-Is6PVgiUy9fxYS3HHK1SoaGa8NrzZlFmBlWnDAAnBCswSG8LLQVOycasNGtAhv9w6QyCMJHlmiGJGvqbiMIUPKykcEL1scBNyDzjefI74D1AxQ0A7SW1frX3xN7J_pDFB6ZwjxR8Dh3nIio5RdV7SOw9ZGDdEGy-V-CA5bfxCm4LxMZMw654xGb8PicnLtpAm3qJF9FO3XjGIQoVIhyEXxi6itobOf2vx5W-5h8nXt31Rzp9OhX65-GrMm3RcsMb7M6Ju9Ior1s73jZ5YeNhGMTWqizbtOhut667DnOuUEXPn3SsDEsl3jgTt4eQEPFoTA_DKtDHaWj5hRPBJk9cvqmflBpjEpdirSKpYtEuI3Owt5esWIvu9MxgJ9XETQDrU5yUJttBQGOX6EXi_-0LxAmp0iA61Rj7J8DH0ctvu5c9CCR8swpB4vXNSZ8zqNBahpAYFfLsUZeT9V1hyZh8uChT0SouzHsXRkVLHMBa7QuYP6W1mJRc1cc24h0fDA4-DMRHdtBH1lpZ6XoPh9tH3ldG28JH9zPUotssnqYRsO4T4X3GFMEiF8EDSMjPOujKSWewJ3YmTbDRrrwWnsBFdVWlbZ0dlEWgYVBXq54paSCMCUUD-FBab12CfF2Y0N71uA3eKtZ_w5vfGUzB1CylOcxtgW.ZVBCNIrav1eK-JMgLjX4eA"
                                width="600"
                                height="450"
                                // style="border:0;border-radius:8px"
                                // allowfullscreen
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