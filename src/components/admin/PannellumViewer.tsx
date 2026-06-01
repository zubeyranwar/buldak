'use client'

/**
 * PannellumViewer.tsx
 *
 * Isolated 360° sphere component — no Payload, no reservation logic.
 * Drop-in replacement for KonvaCanvas in the panorama editor.
 *
 * Props:
 *   imageUrl          — equirectangular panorama image URL
 *   hotspots          — array of hotspot descriptors to render
 *   editorMode        — 'table' | 'navigate' | null (null = read-only/live view)
 *   onPanoramaClick   — fires with { yaw, pitch } when user clicks empty sphere (editor only)
 *   onHotspotClick    — fires with hotspot key when user clicks a hotspot pin
 *   selectedKey       — currently selected hotspot key (highlights it)
 *   theme             — color overrides (optional)
 */

import React, { useEffect, useRef, useCallback, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type HotspotType = 'table' | 'navigate'

export type HotspotStatus = 'available' | 'partial' | 'booked' | 'inactive'

export interface PanoramaHotspot {
    /** Unique key within a scene, e.g. "table:T4" or "nav:patio" */
    key: string
    type: HotspotType

    /** Sphere coordinates */
    yaw: number
    pitch: number

    // — table hotspot fields —
    tableNumber?: string
    bookedChairs?: number
    totalChairs?: number
    status?: HotspotStatus

    // — navigate hotspot fields —
    targetSceneId?: string
    targetSceneLabel?: string
}

export interface PannellumViewerTheme {
    available: string    // e.g. '#a8c5a0'
    partial: string      // e.g. '#f59e0b'
    booked: string       // e.g. '#ef4444'
    inactive: string     // e.g. '#9ca3af'
    navigate: string     // e.g. '#3b82f6'
    selected: string     // e.g. '#7c3aed'
    text: string         // e.g. '#ffffff'
}

export interface PannellumViewerProps {
    imageUrl: string
    hotspots?: PanoramaHotspot[]
    editorMode?: 'table' | 'navigate' | null
    onPanoramaClick?: (coords: { yaw: number; pitch: number }) => void
    onHotspotClick?: (key: string) => void
    selectedKey?: string | null
    theme?: Partial<PannellumViewerTheme>
    width?: number | string
    height?: number | string
}

// ── Default theme ─────────────────────────────────────────────────────────────

const DEFAULT_THEME: PannellumViewerTheme = {
    available: '#a8c5a0',
    partial: '#f59e0b',
    booked: '#ef4444',
    inactive: '#6b7280',
    navigate: '#3b82f6',
    selected: '#7c3aed',
    text: '#ffffff',
}

// ── Hotspot HTML builder ──────────────────────────────────────────────────────
// Pannellum custom hotspots receive a DOM div — we build the inner HTML here.

function buildTableHotspotEl(
    hotspot: PanoramaHotspot,
    theme: PannellumViewerTheme,
    isSelected: boolean,
): HTMLDivElement {
    const div = document.createElement('div')
    div.className = 'pnlm-table-hotspot'

    const status = hotspot.status ?? 'available'
    const bg = isSelected
        ? theme.selected
        : status === 'available' ? theme.available
            : status === 'partial' ? theme.partial
                : status === 'booked' ? theme.booked
                    : theme.inactive

    const booked = hotspot.bookedChairs ?? 0
    const total = hotspot.totalChairs ?? 0
    const pct = total > 0 ? Math.round((booked / total) * 100) : 0

    div.innerHTML = `
        <div class="pnlm-hs-inner" style="
            background: ${bg};
            border: 2.5px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.35)'};
            box-shadow: 0 2px 12px rgba(0,0,0,0.35), ${isSelected ? `0 0 0 3px ${theme.selected}` : 'none'};
            border-radius: 10px;
            padding: 7px 10px 6px;
            min-width: 68px;
            cursor: pointer;
            user-select: none;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            position: relative;
        ">
            <div style="
                font-family: 'DM Sans', system-ui, sans-serif;
                font-size: 12px;
                font-weight: 700;
                color: ${theme.text};
                letter-spacing: 0.03em;
                line-height: 1;
                margin-bottom: 4px;
            ">T-${hotspot.tableNumber ?? '?'}</div>

            ${total > 0 ? `
            <div style="
                display: flex;
                align-items: center;
                gap: 5px;
            ">
                <div style="
                    flex: 1;
                    height: 4px;
                    background: rgba(0,0,0,0.25);
                    border-radius: 2px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${pct}%;
                        height: 100%;
                        background: rgba(255,255,255,0.85);
                        border-radius: 2px;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <span style="
                    font-family: 'DM Sans', system-ui, sans-serif;
                    font-size: 10px;
                    color: rgba(255,255,255,0.9);
                    white-space: nowrap;
                    font-weight: 600;
                ">${booked}/${total}</span>
            </div>` : ''}

            <div style="
                position: absolute;
                bottom: -7px;
                left: 50%;
                transform: translateX(-50%);
                width: 0; height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 7px solid ${bg};
            "></div>
        </div>
    `
    return div
}

function buildNavHotspotEl(
    hotspot: PanoramaHotspot,
    theme: PannellumViewerTheme,
    isSelected: boolean,
): HTMLDivElement {
    const div = document.createElement('div')
    div.className = 'pnlm-nav-hotspot'

    div.innerHTML = `
        <div class="pnlm-hs-inner" style="
            background: ${isSelected ? theme.selected : theme.navigate};
            border: 2.5px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.35)'};
            box-shadow: 0 2px 12px rgba(0,0,0,0.35);
            border-radius: 999px;
            padding: 6px 12px;
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 5px;
        ">
            <span style="font-size: 14px; line-height: 1;">➜</span>
            <span style="
                font-family: 'DM Sans', system-ui, sans-serif;
                font-size: 11px;
                font-weight: 700;
                color: ${theme.text};
                letter-spacing: 0.05em;
                text-transform: uppercase;
            ">${hotspot.targetSceneLabel ?? hotspot.targetSceneId ?? '?'}</span>
        </div>
    `
    return div
}

// ── Crosshair overlay (editor placement mode) ─────────────────────────────────

function EditorCrosshair({ mode }: { mode: 'table' | 'navigate' }) {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* Crosshair lines */}
            <div style={{
                position: 'absolute',
                top: '50%', left: 0, right: 0,
                height: 1,
                background: 'rgba(255,255,255,0.25)',
                transform: 'translateY(-50%)',
            }} />
            <div style={{
                position: 'absolute',
                left: '50%', top: 0, bottom: 0,
                width: 1,
                background: 'rgba(255,255,255,0.25)',
                transform: 'translateX(-50%)',
            }} />

            {/* Mode badge */}
            <div style={{
                position: 'absolute',
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                background: mode === 'table' ? 'rgba(168,197,160,0.92)' : 'rgba(59,130,246,0.92)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: 999,
                fontFamily: 'DM Sans, system-ui, sans-serif',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                whiteSpace: 'nowrap',
            }}>
                {mode === 'table' ? '⊕ Click to place table hotspot' : '➜ Click to place navigation hotspot'}
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PannellumViewer({
    imageUrl,
    hotspots = [],
    editorMode = null,
    onPanoramaClick,
    onHotspotClick,
    selectedKey = null,
    theme: themeOverride,
    width = '100%',
    height = 500,
}: PannellumViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<any>(null)
    const theme = { ...DEFAULT_THEME, ...themeOverride }

    // Track whether Pannellum script is loaded
    const [pnlmReady, setPnlmReady] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ── Load Pannellum from CDN ────────────────────────────────────────────────
    useEffect(() => {
        // Inject CSS once
        if (!document.getElementById('pannellum-css')) {
            const link = document.createElement('link')
            link.id = 'pannellum-css'
            link.rel = 'stylesheet'
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/pannellum/2.5.6/pannellum.min.css'
            document.head.appendChild(link)
        }

        // Inject JS once
        if ((window as any).pannellum) {
            setPnlmReady(true)
            return
        }
        if (document.getElementById('pannellum-js')) {
            // Script tag exists but not loaded yet — wait
            const existing = document.getElementById('pannellum-js') as HTMLScriptElement
            existing.addEventListener('load', () => setPnlmReady(true))
            existing.addEventListener('error', () => setError('Failed to load Pannellum'))
            return
        }
        const script = document.createElement('script')
        script.id = 'pannellum-js'
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pannellum/2.5.6/pannellum.min.js'
        script.onload = () => setPnlmReady(true)
        script.onerror = () => setError('Failed to load Pannellum viewer library')
        document.head.appendChild(script)
    }, [])

    // ── Init / reinit viewer whenever image or ready state changes ────────────
    useEffect(() => {
        if (!pnlmReady || !containerRef.current || !imageUrl) return
        const pnlm = (window as any).pannellum
        if (!pnlm) return

        // Destroy previous instance
        if (viewerRef.current) {
            try { viewerRef.current.destroy() } catch { }
            viewerRef.current = null
        }

        try {
            const viewer = pnlm.viewer(containerRef.current, {
                type: 'equirectangular',
                panorama: imageUrl,
                autoLoad: true,
                showControls: true,
                mouseZoom: true,
                keyboardZoom: false,
                hfov: 100,
                minHfov: 50,
                maxHfov: 120,
                compass: false,
                showFullscreenCtrl: true,
                showZoomCtrl: true,
                hotSpotDebug: false,
                hotSpots: [], // we manage hotspots manually for full DOM control
            })
            viewerRef.current = viewer
        } catch (e) {
            setError('Could not initialize panorama viewer.')
        }
    }, [pnlmReady, imageUrl])

    // ── Handle click on panorama (place hotspot) ──────────────────────────────
    useEffect(() => {
        if (!viewerRef.current || !editorMode || !onPanoramaClick) return
        const viewer = viewerRef.current
        const container = containerRef.current
        if (!container) return

        const handleClick = (e: MouseEvent) => {
            // Ignore if clicking on an existing hotspot
            if ((e.target as HTMLElement).closest('.pnlm-hs-inner')) return

            try {
                const coords = viewer.mouseEventToCoords(e)
                // coords[0] = pitch, coords[1] = yaw
                onPanoramaClick({ pitch: coords[0], yaw: coords[1] })
            } catch {
                // mouseEventToCoords can throw if viewer not ready
            }
        }

        container.addEventListener('click', handleClick)
        return () => container.removeEventListener('click', handleClick)
    }, [pnlmReady, editorMode, onPanoramaClick])

    // ── Render hotspots into the Pannellum container ──────────────────────────
    // We do this manually (not via Pannellum's hotSpots config) so we get
    // full React-controlled DOM with live status colors.
    const hotspotContainerRef = useRef<HTMLDivElement | null>(null)

    const renderHotspots = useCallback(() => {
        const viewer = viewerRef.current
        const container = containerRef.current
        if (!viewer || !container) return

        // Get or create our overlay container
        let overlay = hotspotContainerRef.current
        if (!overlay) {
            overlay = document.createElement('div')
            overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;'
            container.style.position = 'relative'
            container.appendChild(overlay)
            hotspotContainerRef.current = overlay
        }

        // Clear existing pins
        overlay.innerHTML = ''

        hotspots.forEach(hotspot => {
            const isSelected = hotspot.key === selectedKey
            const el = hotspot.type === 'navigate'
                ? buildNavHotspotEl(hotspot, theme, isSelected)
                : buildTableHotspotEl(hotspot, theme, isSelected)

            el.style.cssText = 'position:absolute;pointer-events:auto;transform:translate(-50%,-100%);'

            // Project sphere coords to screen coords
            const updatePosition = () => {
                try {
                    const pos = viewer.sphereToScreen(hotspot.yaw, hotspot.pitch)
                    if (pos) {
                        el.style.left = `${pos.x}px`
                        el.style.top = `${pos.y}px`
                        el.style.display = 'block'
                        // Hide if behind the viewer
                        const hfov = viewer.getHfov()
                        el.style.opacity = '1'
                    }
                } catch {
                    el.style.display = 'none'
                }
            }

            el.addEventListener('click', (e) => {
                e.stopPropagation()
                onHotspotClick?.(hotspot.key)
            })

            overlay!.appendChild(el)
            updatePosition()
        })

        // Keep positions updated as user pans
        const rafLoop = () => {
            if (!overlay || !viewer) return
            overlay.querySelectorAll<HTMLDivElement>('[class^="pnlm-"]').forEach((el, i) => {
                const hs = hotspots[i]
                if (!hs) return
                try {
                    const pos = viewer.sphereToScreen(hs.yaw, hs.pitch)
                    if (pos) {
                        el.style.left = `${pos.x}px`
                        el.style.top = `${pos.y}px`
                    }
                } catch { }
            })
            animFrameRef.current = requestAnimationFrame(rafLoop)
        }

        cancelAnimationFrame(animFrameRef.current!)
        animFrameRef.current = requestAnimationFrame(rafLoop)
    }, [hotspots, selectedKey, theme, onHotspotClick])

    const animFrameRef = useRef<number>(null)

    // Trigger hotspot rerender whenever viewer is ready or hotspots/selection change
    useEffect(() => {
        if (!pnlmReady || !viewerRef.current) return

        // Small delay to let Pannellum finish its own load
        const timeout = setTimeout(renderHotspots, 300)
        return () => clearTimeout(timeout)
    }, [pnlmReady, hotspots, selectedKey, renderHotspots])

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animFrameRef.current!)
            if (viewerRef.current) {
                try { viewerRef.current.destroy() } catch { }
            }
        }
    }, [])

    // ── Render ────────────────────────────────────────────────────────────────

    if (error) {
        return (
            <div style={{
                width, height,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#111827', color: '#ef4444',
                borderRadius: 8, fontFamily: 'system-ui',
                fontSize: 13, gap: 8,
            }}>
                ⚠ {error}
            </div>
        )
    }

    if (!imageUrl) {
        return (
            <div style={{
                width, height,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#111827', color: '#6b7280',
                borderRadius: 8, fontFamily: 'DM Sans, system-ui',
                fontSize: 13, flexDirection: 'column', gap: 8,
            }}>
                <span style={{ fontSize: 32 }}>🌐</span>
                <span>No panorama image set</span>
                <span style={{ fontSize: 11, color: '#4b5563' }}>Upload an equirectangular 360° photo to get started</span>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', width, height, borderRadius: 8, overflow: 'hidden' }}>
            {/* Pannellum mounts here */}
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%' }}
            />

            {/* Editor crosshair overlay */}
            {editorMode && <EditorCrosshair mode={editorMode} />}

            {/* Loading state */}
            {!pnlmReady && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: '#0f172a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94a3b8', fontFamily: 'DM Sans, system-ui', fontSize: 13,
                    flexDirection: 'column', gap: 10,
                }}>
                    <div style={{
                        width: 28, height: 28,
                        border: '2.5px solid #334155',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <span>Loading panorama viewer…</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            )}
        </div>
    )
}

export default PannellumViewer