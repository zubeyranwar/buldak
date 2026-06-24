import Image from "next/image"
import { Container } from "./container"
import { Logo } from "./logo"
import Link from "next/link"
import { LayerInViewAnim } from "./layer-in-view-anim"
// import { CodeBy } from "./code-by"

export const Footer = () => {
    return (
        <footer className="flex flex-col gap-25 pt-37.5 pb-12">
            <Container>
                <LayerInViewAnim offsetY={40} delay={0} amount={0.1}>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 md:gap-0">
                        <div className="spacer" />
                        <LayerInViewAnim delay={0} className="md:col-span-2 flex flex-col md:flex-row items-center gap-4">
                            <Image src="/buldak-logo.png" alt="Logo" width={300} height={300} />
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
                                src="https://gebeta.app/embed/map?t=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..jEY4ULafnQ4zlKRJ.8pMDtHmh1KcqMTlV8h5NEzNjkfY-undtF_qoru8Q9pOWt5m9_YmAIItT-rhvGhTSGXisMrYGs3WCrMs0XaAljLNVP--5QIMQZhoSEtZRY7JJtXtVj4LWsfZMdm-hVxMUURr5Bv9QBpObxYD1nvw6QnAiLPviQrzpscRPXugW9G36lgkaRkiz9IsVMP9BEazRmwfan-ed6LBguXm-idF0Ird-Va4FQgqStfhOoJ5UcRky0dmRv3SVCCitFwLk-G3JUkNlkvggTqf171do5CcAZBAs3j75yLrtHeTGPqi5RlwjnZRSlS4ZG0rR_C0YzkRfCOm8Bn0qJilx4gC47Jd0GS1Upv3PdEiFWOPsZZeZSY4X0GGKuMKbhb6kMPNVUzoad1F7qgOb1TuVTfwDe3LZ0mCdMppNgsLjrEkJBtW5cBIPclmhz8UaaUNzxbt1GpQny6HJkkFQ_2Tdu3YuiZY1T5v3_LIfxDyZJSnwt5x81Uk8l5Kff6j8nX1exHxR-ip5kSfd2hBv1llZyaqzNLTVQREKi1dm4mn3QHvWY1p4v-1SlXo3VUEsgWBOM0QqcZbFu2r_djMrcYhGppdU8GsWPMnlwEpT2r3pYhuO9p6Q3FoNA9V3-S2Wt7D_Upn-RdLdvn-6dAa7V07TmUnDOZDWkmdCUsdm3Idr1m1yDGXDouO7dLdqEyElhZPaAk_rj5zPEsxI70Mv9LnnHgM5cC6Tv1g8yuLJMRbhXkXPPBx4A9V3Uh6paX78-VcHmHvSU-reXt6JaZQHcuge4LTGn8c-StNyPYt4MDxvp1tby41XvqEAdztoGm8UL5tkO9RyzxnRl_m-3071xv0a1_6G5x8y8PDMoHOXlDbNVkEEpLFoPhj_PRJxfPOoV1G6I5oK7lVhK_F76sri2sJwGy2ccZzrQKe7jLTc0Q0JVrUlbWQSrLNcybaI2XeFUGQGYcusZvLQJaiEyxkh-gRYgEwDUeKvhsT09ZZx10FfUfI84_RW4xTGLsmoLApn18EAJa-c8rhE5Pc17AQkMQCqfk3vGqbLuMLG3hJNEMvVKRTuQRJU9OJVxoaRZhCQujXMV7ZvECJHfYOwfK92Fuw7BSJ5cOpEpLqaZZ-TlODgptjvtDNYVmU8hjwk_hEKJyuhKQQNVxfhHOldHksGF7fv9wmJbZpAbs7onkng7E1xFdroWiORluAdzZAOCuZXNCL0M2yFOhlqpMC4TLepZP32A6K7SUeVsUciHVwc3xcdVBWrnB32E_op6PcDCi7rrXwh5HYDQ6Kte7Y7GjItaiNsdiu5ouwdFixwaJhcsdwnmlfal46l4SWZJvV6kF9OjbQdGQiS-53ysiXXVWmnCC1bIA520RA7g-7Tw4UPbiZUTM1_6JcPpTepr4p23GrCOB36fKPwlxMbbNsppvvYmttq2RsFeIPXZ4g9YrP2cCP0VmEGBitCaEGCQZYbrIpFOYTix50lh0xJCA94E1ZrLpBK6SHNmYlmKyytH8NlI6uqwPA.-NseBKFAtWfzkiEBxnSo_w"
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
                                served daily from 5 AM to 8 PM at behind skylight hotel
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

                    <div className="mt-4 md:mt-16 flex justify-between items-center">
                        {/* <CodeBy /> */}
                        <p className="text-gray!">© 2026 Buldak</p>
                    </div>
                </LayerInViewAnim>
            </Container >
        </footer >
    )
}