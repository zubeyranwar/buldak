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

const NAV_MARKER_HTML = `
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

    // Keep latest callback refs so event listeners never go stale
    const editorModeRef = useRef(editorMode)
    const onPanoramaClickRef = useRef(onPanoramaClick)
    const onHotspotClickRef = useRef(onHotspotClick)
    const onExitReadyRef = useRef(onExitReady)
    const hotspotsRef = useRef(hotspots)
    const selectedKeyRef = useRef(selectedKey)
    const themeRef = useRef(theme)

    useEffect(() => { editorModeRef.current = editorMode }, [editorMode])
    useEffect(() => { onPanoramaClickRef.current = onPanoramaClick }, [onPanoramaClick])
    useEffect(() => { onHotspotClickRef.current = onHotspotClick }, [onHotspotClick])
    useEffect(() => { onExitReadyRef.current = onExitReady }, [onExitReady])
    useEffect(() => { hotspotsRef.current = hotspots }, [hotspots])
    useEffect(() => { selectedKeyRef.current = selectedKey }, [selectedKey])
    useEffect(() => { themeRef.current = theme }, [theme])

    // ── Helper: draw all markers from refs (used by panorama-loaded event) ────
    const drawMarkers = useCallback(() => {
        const markers = markersRef.current
        if (!markers) return
        markers.clearMarkers()
        hotspotsRef.current.forEach(h => {
            if (h.type === 'table') {
                markers.addMarker({
                    id: h.key,
                    position: { yaw: h.yaw, pitch: h.pitch },
                    html: buildMarkerHtml(h, themeRef.current, h.key === selectedKeyRef.current),
                    anchor: 'bottom center',
                    style: { cursor: 'pointer' },
                })
            } else if (h.type === 'navigate') {
                markers.addMarker({
                    id: h.key,
                    position: { yaw: h.yaw, pitch: h.pitch },
                    html: NAV_MARKER_HTML,
                    anchor: 'center center',
                    style: { cursor: 'pointer' },
                })
            }
        })
    }, [])

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

        // marker click → selection
        const markers = instance.getPlugin(MarkersPlugin) as InstanceType<typeof MarkersPlugin>
        if (markers) {
            markers.addEventListener('select-marker', (e: any) => {
                onHotspotClickRef.current?.(e.marker.id)
            })
        }

        // virtual tour scene change
        const tour = instance.getPlugin(VirtualTourPlugin) as any
        if (tour) {
            tour.addEventListener('node-changed', (e: any) => {
                onSceneChange?.(e.node.id)
            })
        }

        // Re-draw markers after each panorama finishes loading (scene switches)
        instance.addEventListener('panorama-loaded', () => {
            // Small delay so the panorama texture is fully rendered first
            setTimeout(drawMarkers, 150)
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

    // ── Sync markers via useEffect (hotspot/selection changes) ────────────────
    useEffect(() => {
        if (!viewerReady) return
        drawMarkers()
    }, [hotspots, selectedKey, viewerReady, theme.available, theme.booked, theme.partial, theme.selected, drawMarkers])

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