// Spring physics utilities for custom animations
export interface SpringConfig {
  tension: number
  friction: number
  mass: number
}

export interface SpringState {
  position: number
  velocity: number
}

export class SpringAnimation {
  private config: SpringConfig
  private state: SpringState
  private target: number
  private onUpdate: (position: number) => void
  private onComplete?: () => void
  private animationId?: number

  constructor(
    config: SpringConfig,
    initialPosition: number,
    onUpdate: (position: number) => void,
    onComplete?: () => void,
  ) {
    this.config = config
    this.state = { position: initialPosition, velocity: 0 }
    this.target = initialPosition
    this.onUpdate = onUpdate
    this.onComplete = onComplete
  }

  setTarget(target: number) {
    this.target = target
  }

  setVelocity(velocity: number) {
    this.state.velocity = velocity
  }

  start() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    const animate = (time: number) => {
      const deltaTime = 16 / 1000 // Assume 60fps

      // Spring physics calculation
      const displacement = this.state.position - this.target
      const springForce = -this.config.tension * displacement
      const dampingForce = -this.config.friction * this.state.velocity
      const acceleration = (springForce + dampingForce) / this.config.mass

      this.state.velocity += acceleration * deltaTime
      this.state.position += this.state.velocity * deltaTime

      this.onUpdate(this.state.position)

      // Check if animation is complete
      const isSettled = Math.abs(displacement) < 1 && Math.abs(this.state.velocity) < 50

      if (!isSettled) {
        this.animationId = requestAnimationFrame(animate)
      } else {
        this.state.position = this.target
        this.state.velocity = 0
        this.onUpdate(this.target)
        this.onComplete?.()
      }
    }

    this.animationId = requestAnimationFrame(animate)
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = undefined
    }
  }
}
