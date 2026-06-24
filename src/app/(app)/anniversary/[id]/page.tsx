'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Box, Logo } from '@/components/logo'
import { motion } from "motion/react"

interface Guest {
  id: string
  name: string
  isConfirmed: boolean
}

export default function Anniversary({ params }: { params: Promise<{ id: string }> }) {
  const [guest, setGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolvedId, setResolvedId] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setResolvedId(p.id))
  }, [params])

  useEffect(() => {
    if (!resolvedId) return
    fetch(`/api/anniversary/${resolvedId}`)
      .then((r) => r.json())
      .then((data) => {
        setGuest(data)
        setConfirmed(data.isConfirmed)
      })
      .catch(() => setError('Could not load invitation.'))
      .finally(() => setLoading(false))
  }, [resolvedId])

  async function handleConfirm() {
    if (!resolvedId) return
    setConfirming(true)
    try {
      const res = await fetch(`/api/anniversary/${resolvedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isConfirmed: true }),
      })
      if (!res.ok) throw new Error()
      setConfirmed(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <>
      <section className="relative w-full overflow-hidden h-screen">
        <div className='h-[40%]'>
          <Image
            src="/buldak-home.webp"
            alt="Buldak Restaurant"
            fill
            priority
            className="absolute object-cover object-[center_90%]"
          />
        </div>

        {/* Date badge — scales down on mobile */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Logo.shape
                width={140}
                height={140}
                className="md:!w-[200px] md:!h-[200px]"
                style={{ color: 'var(--color-secondary)', display: 'block' }}
              />
            </motion.div>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
              <p className="text-xs md:text-sm">Saturday</p>
              <p className="font-black text-blank text-sm md:text-base">JUN 27</p>
            </div>
          </div>
        </div>

        <section className="relative h-full flex flex-col items-center text-center px-4 md:px-6 pb-[4.5rem] -mt-1">
          <Box
            className="absolute inset-0 w-full h-full pointer-events-none z-0 "
            style={{ color: 'var(--primary-dark, #c94a20)' }}
            preserveAspectRatio="none"
          />

          <div
            className="absolute top-0 left-0 w-full z-[9999] pointer-events-none md:block"
            style={{ marginTop: '-1px' }}
          >
            <Logo.ray
              width="100%"
              height="80"
              preserveAspectRatio="none"
              style={{ color: 'white' }}
            />
          </div>

          <img
            src="/bubbles.svg"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none opacity-25 -left-2.5 top-[18px] w-[200px] md:w-[340px] z-10"
          />
          <img
            src="/bubbles.svg"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none opacity-25 scale-x-[-1] -right-1 bottom-[330px] w-[200px] md:w-[340px] z-10"
          />

          <div className="relative z-10 flex flex-col items-center w-full pt-12 md:pt-16">
            <p className="text-[0.68rem] tracking-[0.22em] uppercase text-white! mb-[1.45rem] leading-[1.4]">
              We&apos;re Celebrating
            </p>

            <div className="relative inline-flex items-center justify-center mb-1">
              <motion.div
                className="ann-texture absolute pointer-events-none select-none"
                animate={{ x: [0, -8, 0, 8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Logo.texture
                  className="scale-x-[-1] w-[200px] h-[400px] md:w-[400px] md:h-[800px]"
                />
              </motion.div>

              <motion.div
                className="ann-texture absolute -left-6 pointer-events-none select-none"
                animate={{ x: [0, 8, 0, -8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Logo.texture
                  className='w-[200px] h-[400px] md:w-[340px] md:h-[800px]'
                  height="800"
                  width="340"
                />
              </motion.div>

              <span
                className="relative z-10 font-black text-primary! tracking-wide leading-none"
                style={{ fontSize: 'clamp(2.2rem, 8.5vw, 4.5rem)' }}
              >
                1 YEAR
              </span>
            </div>

            <h1 className="ann-headline mt-4 mb-[0.9rem] text-white!">
              ANNIVERSARY
            </h1>

            <p className="leading-[1.72] max-w-[270px] mb-[1.4rem] text-white!">
              We will have fun together
            </p>

            <div className="w-full max-w-[300px] border-t border-dashed border-[rgba(253,244,236,0.32)] mb-4" />

            {!loading && guest && (
              <div className="flex flex-col items-center gap-[3px] mb-4">
                <span className="text-[0.6rem] font-semibold uppercase text-white">
                  Invited Guest
                </span>
                <span className="ann-headline text-[#F9C740]">
                  {guest.name}
                </span>
              </div>
            )}

            {error && (
              <p className="text-[0.82rem] bg-black/20 text-white rounded-lg px-4 py-[0.45rem] mb-3">
                {error}
              </p>
            )}

            <div>
              {loading ? (
                <div className="ann-skeleton" />
              ) : confirmed ? (
                <div className="inline-flex text-white! items-center gap-2 rounded-full font-bold text-[0.9rem] px-7 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  You&apos;re confirmed — see you there!
                </div>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="inline-flex items-center gap-2 rounded-full cursor-pointer font-bold text-[0.95rem] tracking-[0.04em] px-8 py-[0.7rem] border-2 border-[rgba(253,244,236,0.78)] bg-transparent text-white disabled:opacity-60"
                >
                  {confirming ? (
                    <span className="ann-spinner" aria-label="Confirming…" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Confirm My Attendance
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      </section>
    </>
  )
}