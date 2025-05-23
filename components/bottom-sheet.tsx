"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface BottomSheetProps {
  children: React.ReactNode
  snapPoint: "closed" | "half" | "full"
  onSnapPointChange: (snapPoint: "closed" | "half" | "full") => void
  onClose: () => void
  className?: string
}

interface SpringConfig {
  tension: number
  friction: number
  mass: number
}

const SPRING_CONFIG: SpringConfig = {
  tension: 300,
  friction: 30,
  mass: 1,
}

export default function BottomSheet({ children, snapPoint, onSnapPointChange, onClose, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [lastTime, setLastTime] = useState(0)
  const animationRef = useRef<number>()

  // Calculate snap points based on window height
  const getSnapPoints = useCallback(() => {
    const windowHeight = window.innerHeight
    return {
      closed: windowHeight - 80, // Show only handle
      half: windowHeight * 0.5, // Half screen
      full: 100, // Almost full screen with some margin
    }
  }, [])

  // Spring animation function
  const animateToPosition = useCallback(
    (targetY: number) => {
      if (!sheetRef.current) return

      let currentPosition = currentY
      let currentVelocity = velocity
      const startTime = performance.now()

      const animate = (time: number) => {
        const deltaTime = (time - (animationRef.current ? time - 16 : startTime)) / 1000

        // Spring physics calculation
        const displacement = currentPosition - targetY
        const springForce = -SPRING_CONFIG.tension * displacement
        const dampingForce = -SPRING_CONFIG.friction * currentVelocity
        const acceleration = (springForce + dampingForce) / SPRING_CONFIG.mass

        currentVelocity += acceleration * deltaTime
        currentPosition += currentVelocity * deltaTime

        // Apply position
        if (sheetRef.current) {
          sheetRef.current.style.transform = `translateY(${currentPosition}px)`
        }

        // Continue animation if not settled
        const isSettled = Math.abs(displacement) < 1 && Math.abs(currentVelocity) < 50
        if (!isSettled) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setCurrentY(targetY)
          if (sheetRef.current) {
            sheetRef.current.style.transform = `translateY(${targetY}px)`
          }
        }
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      animationRef.current = requestAnimationFrame(animate)
    },
    [currentY, velocity],
  )

  // Update position based on snap point
  useEffect(() => {
    const snapPoints = getSnapPoints()
    const targetY = snapPoints[snapPoint]

    if (!isDragging) {
      animateToPosition(targetY)
    }

    // Update backdrop opacity
    if (backdropRef.current) {
      const opacity = snapPoint === "closed" ? 0 : snapPoint === "half" ? 0.3 : 0.5
      backdropRef.current.style.opacity = opacity.toString()
      backdropRef.current.style.pointerEvents = snapPoint === "closed" ? "none" : "auto"
    }

    // Body scroll lock
    if (snapPoint === "full") {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [snapPoint, isDragging, animateToPosition, getSnapPoints])

  // Determine closest snap point based on position and velocity
  const getClosestSnapPoint = useCallback(
    (y: number, vel: number) => {
      const snapPoints = getSnapPoints()
      const points = [
        { name: "full" as const, y: snapPoints.full },
        { name: "half" as const, y: snapPoints.half },
        { name: "closed" as const, y: snapPoints.closed },
      ]

      // If velocity is significant, predict where user wants to go
      if (Math.abs(vel) > 500) {
        if (vel > 0) {
          // Moving down - prefer closed or half
          return y > snapPoints.half ? "closed" : "half"
        } else {
          // Moving up - prefer full or half
          return y < snapPoints.half ? "full" : "half"
        }
      }

      // Find closest point by distance
      let closest = points[0]
      let minDistance = Math.abs(y - points[0].y)

      for (const point of points) {
        const distance = Math.abs(y - point.y)
        if (distance < minDistance) {
          minDistance = distance
          closest = point
        }
      }

      return closest.name
    },
    [getSnapPoints],
  )

  // Mouse/Touch event handlers
  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true)
    setDragStartY(clientY)
    setLastY(clientY)
    setLastTime(performance.now())
    setVelocity(0)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleMove = useCallback(
    (clientY: number) => {
      if (!isDragging || !sheetRef.current) return

      const deltaY = clientY - dragStartY
      const snapPoints = getSnapPoints()
      const baseY = snapPoints[snapPoint]
      const newY = Math.max(snapPoints.full, Math.min(snapPoints.closed, baseY + deltaY))

      // Calculate velocity
      const now = performance.now()
      const timeDelta = now - lastTime
      if (timeDelta > 0) {
        const vel = ((clientY - lastY) / timeDelta) * 1000 // pixels per second
        setVelocity(vel)
      }
      setLastY(clientY)
      setLastTime(now)

      setCurrentY(newY)
      sheetRef.current.style.transform = `translateY(${newY}px)`
    },
    [isDragging, dragStartY, snapPoint, lastY, lastTime, getSnapPoints],
  )

  const handleEnd = useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)
    const closestSnapPoint = getClosestSnapPoint(currentY, velocity)
    onSnapPointChange(closestSnapPoint)
  }, [isDragging, currentY, velocity, getClosestSnapPoint, onSnapPointChange])

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handleStart(e.clientY)
    },
    [handleStart],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientY)
    },
    [handleMove],
  )

  const handleMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleStart(e.touches[0].clientY)
    },
    [handleStart],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientY)
    },
    [handleMove],
  )

  const handleTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Setup global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (snapPoint === "closed") return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowUp":
          e.preventDefault()
          if (snapPoint === "half") onSnapPointChange("full")
          else if (snapPoint === "closed") onSnapPointChange("half")
          break
        case "ArrowDown":
          e.preventDefault()
          if (snapPoint === "full") onSnapPointChange("half")
          else if (snapPoint === "half") onSnapPointChange("closed")
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [snapPoint, onClose, onSnapPointChange])

  // Initialize position
  useEffect(() => {
    const snapPoints = getSnapPoints()
    setCurrentY(snapPoints[snapPoint])
  }, [snapPoint, getSnapPoints])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const snapPoints = getSnapPoints()
      const targetY = snapPoints[snapPoint]
      setCurrentY(targetY)
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${targetY}px)`
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [snapPoint, getSnapPoints])

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black transition-opacity duration-300 z-40"
        style={{ opacity: 0, pointerEvents: "none" }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed left-0 right-0 bottom-0 bg-background rounded-t-xl shadow-2xl z-50 touch-none",
          "border-t border-border",
          className,
        )}
        style={{
          height: "100vh",
          transform: `translateY(${currentY}px)`,
          transition: isDragging ? "none" : undefined,
        }}
      >
        {/* Handle */}
        <div
          className="flex items-center justify-center py-4 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Close button (visible when half or full open) */}
        {snapPoint !== "closed" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Close bottom sheet"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ height: "calc(100vh - 60px)" }}>
          {children}
        </div>
      </div>
    </>
  )
}
