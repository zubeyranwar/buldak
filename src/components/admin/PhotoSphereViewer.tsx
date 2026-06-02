'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin'
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin'
import { utils } from '@photo-sphere-viewer/core'
import type { Viewer } from '@photo-sphere-viewer/core'

import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import '@photo-sphere-viewer/virtual-tour-plugin/index.css'



// ── Types ─────────────────────────────────────────────────────────────────────

export type HotspotType = 'table' | 'navigate'
export type HotspotStatus = 'available' | 'partial' | 'booked' | 'inactive'

export interface PanoramaHotspot {
    key: string
    type: HotspotType
    yaw: number
    pitch: number
    tableNumber?: string
    bookedChairs?: number
    totalChairs?: number
    status?: HotspotStatus
    targetSceneId?: string
    targetSceneLabel?: string
}

export interface PhotoSphereScene {
    sceneId: string
    label: string
    panoramaUrl: string
    hotspots: PanoramaHotspot[]
    defaultYaw?: number
    defaultPitch?: number
}

export interface PhotoSphereViewerTheme {
    available: string
    partial: string
    booked: string
    inactive: string
    selected: string
    text: string
}

export interface PhotoSphereViewerProps {
    imageUrl?: string
    hotspots?: PanoramaHotspot[]
    editorMode?: 'table' | 'navigate' | null
    onPanoramaClick?: (coords: { yaw: number; pitch: number }) => void
    onHotspotClick?: (key: string) => void
    selectedKey?: string | null
    scenes?: PhotoSphereScene[]
    activeSceneId?: string
    onSceneChange?: (sceneId: string) => void
    theme?: Partial<PhotoSphereViewerTheme>
    width?: number | string
    height?: number | string
    /** Called once viewer is ready — receives a function you can call to play the exit animation */
    onExitReady?: (playExit: () => Promise<void>) => void
    /** Skip the intro animation (e.g. in editor mode) */
    disableIntro?: boolean
}

const DEFAULT_THEME: PhotoSphereViewerTheme = {
    available: '#a8c5a0',
    partial: '#f59e0b',
    booked: '#ef4444',
    inactive: '#6b7280',
    selected: '#7c3aed',
    text: '#ffffff',
}

// ── Intro / exit animation values ─────────────────────────────────────────────

const ANIM = {
    pitch: { start: -Math.PI / 2, end: 0 },
    yaw: { start: Math.PI / 2, end: 0 },
    zoom: { start: 0, end: 50 },
    maxFov: { start: 130, end: 90 },
    fisheye: { start: 2, end: 0 },
}

// ── Marker HTML ───────────────────────────────────────────────────────────────

function buildMarkerHtml(
    hotspot: PanoramaHotspot,
    theme: PhotoSphereViewerTheme,
    isSelected: boolean,
): string {
    const status = hotspot.status ?? 'available'
    const bg = isSelected ? theme.selected
        : status === 'available' ? theme.available
            : status === 'partial' ? theme.partial
                : status === 'booked' ? theme.booked
                    : theme.inactive

    const booked = hotspot.bookedChairs ?? 0
    const total = hotspot.totalChairs ?? 0
    const pct = total > 0 ? Math.round((booked / total) * 100) : 0
    const border = isSelected ? '#fff' : 'rgba(255,255,255,0.4)'
    const shadow = isSelected
        ? `0 2px 12px rgba(0,0,0,0.4),0 0 0 3px ${theme.selected}`
        : '0 2px 12px rgba(0,0,0,0.4)'

    return `
<div style="background:${bg};border:2.5px solid ${border};box-shadow:${shadow};border-radius:10px;padding:7px 10px 10px;min-width:72px;cursor:pointer;user-select:none;position:relative;font-family:'DM Sans',system-ui,sans-serif;">
  <div style="font-size:12px;font-weight:700;color:${theme.text};letter-spacing:0.03em;line-height:1;margin-bottom:${total > 0 ? '5px' : '0'}">T-${hotspot.tableNumber ?? '?'}</div>
  ${total > 0 ? `
  <div style="display:flex;align-items:center;gap:5px;">
    <div style="flex:1;height:4px;background:rgba(0,0,0,0.25);border-radius:2px;overflow:hidden;">
      <div style="width:${pct}%;height:100%;background:rgba(255,255,255,0.85);border-radius:2px;"></div>
    </div>
    <span style="font-size:10px;color:rgba(255,255,255,0.9);font-weight:600;white-space:nowrap;">${booked}/${total}</span>
  </div>` : ''}
  <div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${bg};"></div>
</div>`
}

// ── Nav marker HTML ───────────────────────────────────────────────────────────
// Fix 2: accepts isFullyBooked to render a dimmed variant with a FULL badge

function buildNavMarkerHtml(label: string, isFullyBooked: boolean): string {
    if (isFullyBooked) {
        return `
<div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;gap:4px;opacity:0.45;cursor:not-allowed;">
  <img
    src="/direction.png"
    style="width:52px;height:52px;filter:grayscale(1) drop-shadow(0 4px 16px rgba(0,0,0,0.5));"
  />
  <div style="
    background:#ef4444;color:#fff;font-size:9px;font-weight:800;
    letter-spacing:0.08em;padding:2px 7px;border-radius:999px;
    font-family:'DM Sans',system-ui,sans-serif;white-space:nowrap;
    box-shadow:0 1px 4px rgba(0,0,0,0.4);
  ">FULL</div>
</div>`
    }

    return `
<img
    src="/direction.png"
    style="
        width: 52px;
        height: 52px;
        cursor: pointer;
        filter: drop-shadow(0 4px 16px rgba(0,0,0,0.7));
        transition: transform 0.15s ease, opacity 0.15s ease;
        opacity: 0.88;
    "
    onmouseenter="this.style.transform='scale(1.2)';this.style.opacity='1'"
    onmouseleave="this.style.transform='scale(1)';this.style.opacity='0.88'"
/>`
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
// Fix 3: shown while the panorama image is still fetching/decoding

function PanoramaSkeleton({ width, height }: { width: number | string; height: number | string }) {
    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            width, height,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
            borderRadius: 8,
        }}>
            {/* Spinner */}
            <div style={{ position: 'relative', width: 52, height: 52 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.08)',
                    borderTopColor: '#a8c5a0',
                    animation: 'psv-spin 0.9s linear infinite',
                }} />
            </div>
            <span style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 12, fontFamily: 'DM Sans, system-ui',
                letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
                Loading panorama…
            </span>
            {/* Fake hotspot pills */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {['T-1', 'T-2', 'T-3'].map(label => (
                    <div key={label} style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1.5px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '6px 14px',
                        color: 'rgba(255,255,255,0.18)',
                        fontSize: 11, fontWeight: 700,
                        fontFamily: 'DM Sans, system-ui',
                        animation: 'psv-pulse 1.6s ease-in-out infinite',
                        animationDelay: `${['0s', '0.2s', '0.4s'][['T-1', 'T-2', 'T-3'].indexOf(label)]}`,
                    }}>
                        {label}
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes psv-spin  { to { transform: rotate(360deg); } }
                @keyframes psv-pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
            `}</style>
        </div>
    )
}

// ── Crosshair ─────────────────────────────────────────────────────────────────

function EditorCrosshair({ mode }: { mode: 'table' | 'navigate' }) {
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.2)', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.2)', transform: 'translateX(-50%)' }} />
            <div style={{
                position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                background: mode === 'table' ? 'rgba(168,197,160,0.92)' : 'rgba(59,130,246,0.92)',
                color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '4px 12px', borderRadius: 999,
                fontFamily: 'DM Sans, system-ui', backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
            }}>
                {mode === 'table' ? '⊕ Click to place table hotspot' : '➜ Click to place navigation hotspot'}
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PhotoSphereViewer({
    imageUrl = '',
    hotspots = [],
    editorMode = null,
    onPanoramaClick,
    onHotspotClick,
    selectedKey = null,
    scenes,
    activeSceneId,
    onSceneChange,
    theme: themeOverride,
    width = '100%',
    height = 500,
    onExitReady,
    disableIntro = false,
}: PhotoSphereViewerProps) {
    const theme = { ...DEFAULT_THEME, ...themeOverride }

    const viewerRef = useRef<Viewer | null>(null)
    const markersRef = useRef<InstanceType<typeof MarkersPlugin> | null>(null)
    const [viewerReady, setViewerReady] = useState(false)

    // Fix 1: track which scene is currently displayed
    const [currentSceneId, setCurrentSceneId] = useState<string | undefined>(
        activeSceneId ?? scenes?.[0]?.sceneId
    )

    // Fix 3: skeleton visibility
    const [panoramaLoaded, setPanoramaLoaded] = useState(false)

    // Keep latest callback refs so event listeners never go stale
    const editorModeRef = useRef(editorMode)
    const onPanoramaClickRef = useRef(onPanoramaClick)
    const onHotspotClickRef = useRef(onHotspotClick)
    const onExitReadyRef = useRef(onExitReady)
    const hotspotsRef = useRef(hotspots)
    const selectedKeyRef = useRef(selectedKey)
    const themeRef = useRef(theme)
    // Fix 1: keep scenes accessible inside stable callbacks
    const scenesRef = useRef(scenes)

    useEffect(() => { editorModeRef.current = editorMode }, [editorMode])
    useEffect(() => { onPanoramaClickRef.current = onPanoramaClick }, [onPanoramaClick])
    useEffect(() => { onHotspotClickRef.current = onHotspotClick }, [onHotspotClick])
    useEffect(() => { onExitReadyRef.current = onExitReady }, [onExitReady])
    useEffect(() => { hotspotsRef.current = hotspots }, [hotspots])
    useEffect(() => { selectedKeyRef.current = selectedKey }, [selectedKey])
    useEffect(() => { themeRef.current = theme }, [theme])
    useEffect(() => { scenesRef.current = scenes }, [scenes])

    // ── Fix 2 helper: build a set of scene IDs where all tables are booked/inactive ──
    const buildBookedSceneIds = useCallback((scenesToCheck: PhotoSphereScene[] | undefined): Set<string> => {
        const booked = new Set<string>()
        if (!scenesToCheck) return booked
        for (const scene of scenesToCheck) {
            const tables = scene.hotspots.filter(h => h.type === 'table')
            if (tables.length > 0 && tables.every(h => h.status === 'booked' || h.status === 'inactive')) {
                booked.add(scene.sceneId)
            }
        }
        return booked
    }, [])

    // ── Helper: draw markers for the specified scene (Fix 1) ──────────────────
    const drawMarkers = useCallback((forSceneId?: string) => {
        const markers = markersRef.current
        if (!markers) return

        // Fix 1: resolve the correct hotspot list
        const activeId = forSceneId ?? currentSceneId
        const sceneHotspots = scenesRef.current
            ? (scenesRef.current.find(s => s.sceneId === activeId)?.hotspots ?? [])
            : hotspotsRef.current

        // Fix 2: build fully-booked scene set
        const bookedSceneIds = buildBookedSceneIds(scenesRef.current)

        markers.clearMarkers()
        sceneHotspots.forEach(h => {
            if (h.type === 'table') {
                markers.addMarker({
                    id: h.key,
                    position: { yaw: h.yaw, pitch: h.pitch },
                    html: buildMarkerHtml(h, themeRef.current, h.key === selectedKeyRef.current),
                    anchor: 'bottom center',
                    style: { cursor: 'pointer' },
                })
            } else if (h.type === 'navigate') {
                // Fix 2: dim nav markers that point at fully-booked scenes
                const isFullyBooked = !!(h.targetSceneId && bookedSceneIds.has(h.targetSceneId))
                markers.addMarker({
                    id: h.key,
                    position: { yaw: h.yaw, pitch: h.pitch },
                    html: buildNavMarkerHtml(h.targetSceneLabel ?? h.targetSceneId ?? '', isFullyBooked),
                    anchor: 'center center',
                    // Fix 2: store fullness on the marker data for click guard below
                    data: { isFullyBooked },
                    style: { cursor: isFullyBooked ? 'not-allowed' : 'pointer' },
                })
            }
        })
    }, [buildBookedSceneIds, currentSceneId])

    // ── onReady — runs once ───────────────────────────────────────────────────
    const handleReady = useCallback((instance: Viewer) => {
        viewerRef.current = instance
        markersRef.current = instance.getPlugin(MarkersPlugin) as InstanceType<typeof MarkersPlugin>

        // sphere click → placement
        instance.addEventListener('click', (e: any) => {
            if (e.marker) return
            if (!editorModeRef.current) return
            onPanoramaClickRef.current?.({ yaw: e.data.yaw, pitch: e.data.pitch })
        })

        // marker click → selection (Fix 2: guard booked nav markers)
        const markers = instance.getPlugin(MarkersPlugin) as InstanceType<typeof MarkersPlugin>
        if (markers) {
            markers.addEventListener('select-marker', (e: any) => {
                if (e.marker?.data?.isFullyBooked) return   // Fix 2: swallow click
                onHotspotClickRef.current?.(e.marker.id)
            })
        }

        // virtual tour scene change (Fix 1: update currentSceneId + redraw immediately)
        const tour = instance.getPlugin(VirtualTourPlugin) as any
        if (tour) {
            tour.addEventListener('node-changed', (e: any) => {
                const newSceneId: string = e.node.id
                setCurrentSceneId(newSceneId)
                onSceneChange?.(newSceneId)
                // Fix 1: pass sceneId directly — don't wait for state to settle
                drawMarkers(newSceneId)
            })
        }

        // Fix 3: flip panoramaLoaded on first successful render; also redraw markers
        instance.addEventListener('panorama-loaded', () => {
            setPanoramaLoaded(true)          // Fix 3: hide skeleton
            setTimeout(() => drawMarkers(), 150)
        })

        // ── Intro animation (booking picker only, not editor) ─────────────────
        if (!disableIntro) {
            instance.setOptions({
                mousemove: false,
                mousewheel: false,
                maxFov: ANIM.maxFov.start,
                fisheye: ANIM.fisheye.start,
            } as any)
            instance.rotate({ yaw: ANIM.yaw.start, pitch: ANIM.pitch.start })
            instance.zoom(ANIM.zoom.start)

            setTimeout(() => {
                new (utils as any).Animation({
                    properties: ANIM,
                    duration: 2500,
                    easing: 'inOutQuad',
                    onTick: (p: any) => {
                        instance.setOptions({ fisheye: p.fisheye, maxFov: p.maxFov } as any)
                        instance.rotate({ yaw: p.yaw, pitch: p.pitch })
                        instance.zoom(p.zoom)
                    },
                }).then(() => {
                    instance.setOptions({ mousemove: true, mousewheel: true })
                })
            }, 400)
        }

        // ── Exit animation — exposed to parent via onExitReady ────────────────
        onExitReadyRef.current?.(() => new Promise<void>(resolve => {
            instance.setOptions({ mousemove: false, mousewheel: false })
            new (utils as any).Animation({
                properties: {
                    pitch: { start: instance.getPosition().pitch, end: ANIM.pitch.start },
                    yaw: { start: instance.getPosition().yaw, end: ANIM.yaw.start },
                    zoom: { start: instance.getZoomLevel(), end: ANIM.zoom.start },
                    maxFov: { start: ANIM.maxFov.end, end: ANIM.maxFov.start },
                    fisheye: { start: ANIM.fisheye.end, end: ANIM.fisheye.start },
                },
                duration: 1500,
                easing: 'inOutQuad',
                onTick: (p: any) => {
                    instance.setOptions({ fisheye: p.fisheye, maxFov: p.maxFov } as any)
                    instance.rotate({ yaw: p.yaw, pitch: p.pitch })
                    instance.zoom(p.zoom)
                },
            }).then(() => resolve())
        }))

        setViewerReady(true)
    }, [disableIntro, drawMarkers])

    // ── Sync markers via useEffect (hotspot/selection/scene changes) ──────────
    useEffect(() => {
        if (!viewerReady) return
        drawMarkers(currentSceneId)
    }, [hotspots, selectedKey, viewerReady, currentSceneId, theme.available, theme.booked, theme.partial, theme.selected, drawMarkers])

    // ── Build plugins list ────────────────────────────────────────────────────
    const plugins: any[] = [
        [MarkersPlugin, {}],
        [AutorotatePlugin, { autostartDelay: null, autostartOnIdle: false }],
    ]

    if (scenes && scenes.length > 0) {
        const nodes = scenes.map(scene => ({
            id: scene.sceneId,
            panorama: scene.panoramaUrl,
            name: scene.label,
            links: scene.hotspots
                .filter(h => h.type === 'navigate' && h.targetSceneId)
                .map(h => ({
                    nodeId: h.targetSceneId!,
                    position: { yaw: h.yaw, pitch: h.pitch },
                    name: h.targetSceneLabel ?? h.targetSceneId,
                })),
        }))
        plugins.push([VirtualTourPlugin, {
            nodes,
            startNodeId: activeSceneId ?? scenes[0]?.sceneId,
            renderMode: '3d',
        }])
    }

    // ── Empty state ───────────────────────────────────────────────────────────
    if (!imageUrl && (!scenes || scenes.length === 0)) {
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
                <span style={{ fontSize: 11, color: '#4b5563' }}>
                    Upload an equirectangular 360° photo to get started
                </span>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', width, height }}>
            <ReactPhotoSphereViewer
                src={scenes && scenes.length > 0
                    ? (scenes.find(s => s.sceneId === activeSceneId)?.panoramaUrl ?? scenes[0]?.panoramaUrl ?? '')
                    : imageUrl}
                height={typeof height === 'number' ? `${height}px` : height}
                width={typeof width === 'number' ? `${width}px` : width}
                defaultYaw={0}
                defaultPitch={0}
                navbar={['zoom', 'fullscreen']}
                plugins={plugins}
                onReady={handleReady}
                littlePlanet={false}
                touchmoveTwoFingers={false}
                mousewheel={true}
                moveInertia={true}
            />
            {editorMode && <EditorCrosshair mode={editorMode} />}
        </div>
    )
}

export default PhotoSphereViewer