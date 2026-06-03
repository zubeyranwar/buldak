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
export type HotspotStatus = 'available' | 'booked' | 'inactive'

export interface PanoramaHotspot {
    key: string
    type: HotspotType
    yaw: number
    pitch: number
    tableNumber?: string
    tableId?: string
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
    /** Single selected key (editor use) */
    selectedKey?: string | null
    /** Multi-selected table IDs (booking picker use) */
    selectedTableIds?: Set<string>
    scenes?: PhotoSphereScene[]
    activeSceneId?: string
    onSceneChange?: (sceneId: string) => void
    theme?: Partial<PhotoSphereViewerTheme>
    width?: number | string
    height?: number | string
    onExitReady?: (playExit: () => Promise<void>) => void
    disableIntro?: boolean
}

const DEFAULT_THEME: PhotoSphereViewerTheme = {
    available: '#a8c5a0',
    booked: '#ef4444',
    inactive: '#6b7280',
    selected: '#3b82f6',
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

// ── Table marker HTML — clean table-based, no chair progress bar ──────────────

function buildTableMarkerHtml(
    hotspot: PanoramaHotspot,
    theme: PhotoSphereViewerTheme,
    isSelected: boolean,
): string {
    const status = hotspot.status ?? 'available'

    const bg = isSelected
        ? theme.selected
        : status === 'available'
            ? theme.available
            : status === 'booked'
                ? theme.booked
                : theme.inactive

    const border = isSelected ? '#fff' : 'rgba(255,255,255,0.35)'
    const shadow = isSelected
        ? `0 2px 16px rgba(0,0,0,0.45), 0 0 0 3px ${theme.selected}`
        : '0 2px 12px rgba(0,0,0,0.4)'

    const label = status === 'booked'
        ? 'Booked'
        : status === 'inactive'
            ? 'N/A'
            : isSelected
                ? 'Your table'
                : 'Available'

    const labelColor = isSelected
        ? 'rgba(255,255,255,0.95)'
        : status === 'available'
            ? 'rgba(255,255,255,0.8)'
            : 'rgba(255,255,255,0.7)'

    return `
<div style="
    background:${bg};
    border: 2.5px solid ${border};
    box-shadow: ${shadow};
    border-radius: 10px;
    padding: 8px 12px 10px;
    min-width: 68px;
    cursor: ${status === 'booked' || status === 'inactive' ? 'not-allowed' : 'pointer'};
    user-select: none;
    position: relative;
    font-family: 'DM Sans', system-ui, sans-serif;
    text-align: center;
    transition: transform 0.15s ease;
">
    <div style="
        font-size: 13px;
        font-weight: 800;
        color: ${theme.text};
        letter-spacing: 0.04em;
        line-height: 1;
        margin-bottom: 4px;
    ">T-${hotspot.tableNumber ?? '?'}</div>
    <div style="
        font-size: 10px;
        font-weight: 600;
        color: ${labelColor};
        letter-spacing: 0.05em;
        text-transform: uppercase;
        line-height: 1;
    ">${label}</div>
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
</div>`
}

// ── Nav marker HTML ───────────────────────────────────────────────────────────

function buildNavMarkerHtml(label: string, isFullyBooked: boolean): string {
    if (isFullyBooked) {
        return `
<div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;gap:4px;opacity:0.45;cursor:not-allowed;">
    <img src="/direction.png" style="width:52px;height:52px;filter:grayscale(1) drop-shadow(0 4px 16px rgba(0,0,0,0.5));" />
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
        width: 52px; height: 52px;
        cursor: pointer;
        filter: drop-shadow(0 4px 16px rgba(0,0,0,0.7));
        transition: transform 0.15s ease, opacity 0.15s ease;
        opacity: 0.88;
    "
    onmouseenter="this.style.transform='scale(1.2)';this.style.opacity='1'"
    onmouseleave="this.style.transform='scale(1)';this.style.opacity='0.88'"
/>`
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

let _introPlayed = false


export function PhotoSphereViewer({
    imageUrl = '',
    hotspots = [],
    editorMode = null,
    onPanoramaClick,
    onHotspotClick,
    selectedKey = null,
    selectedTableIds,
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
    const [currentSceneId, setCurrentSceneId] = useState<string | undefined>(
        activeSceneId ?? scenes?.[0]?.sceneId
    )

    const editorModeRef = useRef(editorMode)
    const onPanoramaClickRef = useRef(onPanoramaClick)
    const onHotspotClickRef = useRef(onHotspotClick)
    const onExitReadyRef = useRef(onExitReady)
    const hotspotsRef = useRef(hotspots)
    const selectedKeyRef = useRef(selectedKey)
    const selectedTableIdsRef = useRef(selectedTableIds)
    const themeRef = useRef(theme)
    const scenesRef = useRef(scenes)
    const currentSceneIdRef = useRef<string | undefined>(activeSceneId ?? scenes?.[0]?.sceneId)
    const tourRef = useRef<any>(null)


    useEffect(() => { editorModeRef.current = editorMode }, [editorMode])
    useEffect(() => { onPanoramaClickRef.current = onPanoramaClick }, [onPanoramaClick])
    useEffect(() => { onHotspotClickRef.current = onHotspotClick }, [onHotspotClick])
    useEffect(() => { onExitReadyRef.current = onExitReady }, [onExitReady])
    useEffect(() => { hotspotsRef.current = hotspots }, [hotspots])
    useEffect(() => { selectedKeyRef.current = selectedKey }, [selectedKey])
    useEffect(() => { selectedTableIdsRef.current = selectedTableIds }, [selectedTableIds])
    useEffect(() => { themeRef.current = theme }, [theme])
    useEffect(() => { scenesRef.current = scenes }, [scenes])

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

    const drawMarkers = useCallback((forSceneId?: string) => {
        const markers = markersRef.current
        if (!markers) return

        const activeId = forSceneId ?? currentSceneIdRef.current
        if (scenesRef.current && scenesRef.current.length > 0 && !activeId) return
        const sceneHotspots = scenesRef.current && scenesRef.current.length > 0
            ? (scenesRef.current.find(s => s.sceneId === activeId)?.hotspots ?? [])
            : hotspotsRef.current

        const bookedSceneIds = buildBookedSceneIds(scenesRef.current)
        const multiSelected = selectedTableIdsRef.current

        markers.clearMarkers()
        sceneHotspots.forEach(h => {
            if (h.type === 'table') {
                // Multi-selection (booking picker) takes priority over single selectedKey (editor)
                const isSelected = multiSelected
                    ? !!(h.tableId && multiSelected.has(h.tableId))
                    : h.key === selectedKeyRef.current

                markers.addMarker({
                    id: h.key,
                    position: { yaw: h.yaw, pitch: h.pitch },
                    html: buildTableMarkerHtml(h, themeRef.current, isSelected),
                    anchor: 'bottom center',
                    style: { cursor: h.status === 'booked' || h.status === 'inactive' ? 'not-allowed' : 'pointer' },
                })
            } else if (h.type === 'navigate') {
                const isFullyBooked = !!(h.targetSceneId && bookedSceneIds.has(h.targetSceneId))
                markers.addMarker({
                    id: h.key,
                    position: { yaw: h.yaw, pitch: h.pitch },
                    html: buildNavMarkerHtml(h.targetSceneLabel ?? h.targetSceneId ?? '', isFullyBooked),
                    anchor: 'center center',
                    data: { isFullyBooked, targetSceneId: h.targetSceneId }, // ← add targetSceneId here
                    style: { cursor: isFullyBooked ? 'not-allowed' : 'pointer' },
                })
            }
        })
    }, [buildBookedSceneIds, currentSceneId])

    const handleReady = useCallback((instance: Viewer) => {
        viewerRef.current = instance
        markersRef.current = instance.getPlugin(MarkersPlugin) as InstanceType<typeof MarkersPlugin>

        instance.addEventListener('click', (e: any) => {
            if (e.marker) return
            if (!editorModeRef.current) return
            onPanoramaClickRef.current?.({ yaw: e.data.yaw, pitch: e.data.pitch })
        })

        const markers = instance.getPlugin(MarkersPlugin) as InstanceType<typeof MarkersPlugin>
        if (markers) {
            markers.addEventListener('select-marker', (e: any) => {
                if (e.marker?.data?.isFullyBooked) return
                if (e.marker?.data?.targetSceneId) {
                    if (tourRef.current) {
                        tourRef.current.setCurrentNode(e.marker.data.targetSceneId)
                    } else {
                        onHotspotClickRef.current?.(e.marker.id)
                    }
                    return
                }
                onHotspotClickRef.current?.(e.marker.id)
            })
        }

        const tour = instance.getPlugin(VirtualTourPlugin) as any
        tourRef.current = tour
        console.log('[tour] methods:', Object.keys(tour ?? {}))

        if (tour) {
            tour.addEventListener('node-changed', (e: any) => {
                const newSceneId: string = e.node.id
                setCurrentSceneId(newSceneId)
                currentSceneIdRef.current = newSceneId
                onSceneChange?.(newSceneId)
                drawMarkers(newSceneId)
            })

            // ← ADD: wait for the plugin to settle then sync the real starting node
            setTimeout(() => {
                const startId = tour.getCurrentNode?.()?.id ?? currentSceneIdRef.current
                currentSceneIdRef.current = startId
                setCurrentSceneId(startId)
                drawMarkers(startId)
            }, 300)
        }

        instance.addEventListener('panorama-loaded', () => {
            setTimeout(() => {
                const tour = instance.getPlugin(VirtualTourPlugin) as any
                const sceneId = tour?.getCurrentNode?.()?.id ?? currentSceneIdRef.current
                currentSceneIdRef.current = sceneId  // ← keep ref in sync
                drawMarkers(sceneId)
            }, 150)
        })

        if (!disableIntro && !_introPlayed) {
            _introPlayed = true
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
        // ← ADD THIS: draw markers immediately on first load
    }, [disableIntro, drawMarkers])

    // Redraw whenever selection, hotspot status, or scene changes
    useEffect(() => {
        if (!viewerReady) return
        drawMarkers(currentSceneId)
    }, [hotspots, selectedKey, selectedTableIds, viewerReady, currentSceneId, drawMarkers])

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
                .map(h => ({ nodeId: h.targetSceneId! })),
        }))
        plugins.push([VirtualTourPlugin, {
            nodes,
            startNodeId: activeSceneId ?? scenes[0]?.sceneId,
            renderMode: '3d',
        }])
    }

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
                src={
                    scenes && scenes.length > 0
                        ? (scenes.find(s => s.sceneId === activeSceneId)?.panoramaUrl ?? scenes[0]?.panoramaUrl ?? '')
                        : imageUrl
                }
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