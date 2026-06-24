'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Box, Logo } from '@/components/logo'

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
    <Image
      src="/buldak-home.webp"
      alt="Buldak Restaurant"
      fill
      priority
      className="absolute object-cover object-[center_40%]"
    />

    <section className="relative h-full flex flex-col items-center text-center px-6 pb-[4.5rem] -mt-1">
      {/* Orange box — sits in the bottom ~60% */}
      <Box
        className="absolute inset-x-0 bottom-0 w-full pointer-events-none z-10"
        style={{ color: 'var(--primary-dark, #c94a20)', height: '62%' }}
      />

      {/* Ray sits right at the top of the orange box, jagged edge faces down into orange */}
      <div
        className="absolute left-0 w-full pointer-events-none z-20"
        style={{ top: 'calc(38% - 60px)', height: '80px' }}
      >
        <Logo.ray
          width="100%"
          height="80"
          preserveAspectRatio="none"
          style={{ color: 'var(--primary-dark, #c94a20)' }}
        />
      </div>

      <img
        src="/bubbles.svg"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none select-none opacity-25 -left-2.5 top-[18px] w-[140px] z-10"
      />

      <img
        src="/bubbles.svg"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none select-none opacity-[0.18] scale-x-[-1] -right-2.5 bottom-[130px] w-[120px] z-10"
      />

      <div className="absolute top-4 right-4 z-30">
        <div className="relative flex items-center justify-center">
          <Logo.shape
            width={120}
            height={120}
            style={{ color: 'var(--color-secondary)' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className="text-xs">Saturday</span>
            <span className="font-black text-black text-base">JUL 19</span>
          </div>
        </div>
      </div>

      <div className="relative z-30 flex flex-col items-center w-full pt-[44%]">
        <p className="text-[0.68rem] tracking-[0.22em] uppercase text-white! mb-[1.45rem] leading-[1.4]">
          We&apos;re Celebrating
        </p>

        <div className="relative inline-flex items-center justify-center mb-1">
          <Logo.texture
            className="ann-texture absolute pointer-events-none select-none scale-x-[-1]"
            height="800"
            width="400"
          />
          <Logo.texture
            className="ann-texture absolute -left-6 pointer-events-none select-none"
            height="800"
            width="340"
          />
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
            <span className="text-[0.6rem] font-semibold tracking-[0.18em] uppercase text-[rgba(253,244,236,0.6)]">
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
            <div className="inline-flex items-center gap-2 rounded-full font-bold text-[0.9rem] px-7 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
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