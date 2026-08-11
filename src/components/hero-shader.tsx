'use client'

import { useEffect, useRef } from 'react'

export function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function syncSize() {
      if (!canvas) return
      const w = canvas.clientWidth || 1280
      const h = canvas.clientHeight || 720
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize)
      resizeObserver.observe(canvas)
    }
    syncSize()

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext
    if (!gl) return

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;
    
    // Create a very subtle, slow-moving grain/noise effect for texture
    float noise = fraction(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    
    // Soft, ethereal gradient shift
    vec3 color1 = vec3(0.97, 0.98, 0.98); // #f8f9fa equivalent
    vec3 color2 = vec3(0.94, 0.95, 0.96); // subtle grey
    
    float wave = sin(uv.x * 2.0 + u_time * 0.2) * cos(uv.y * 2.0 + u_time * 0.1);
    vec3 finalColor = mix(color1, color2, wave * 0.1 + 0.1);
    
    // Add micro-texture
    finalColor += (noise - 0.5) * 0.01;
    
    gl_FragColor = vec4(finalColor, 1.0);
}

float fraction(float x) { return x - floor(x); }
`

    function cs(type: number, src: string) {
      const s = gl.createShader(type)
      if (!s) throw new Error("Could not create shader")
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 }
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvas.width
        mouse.y = ny * canvas.height
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)

    let animationFrameId: number

    function render(t: number) {
      if (typeof ResizeObserver === 'undefined') syncSize()
      if (!canvas || !gl) return
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (uTime) gl.uniform1f(uTime, t * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animationFrameId = requestAnimationFrame(render)
    }
    
    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      if (resizeObserver && canvas) {
        resizeObserver.unobserve(canvas)
      }
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
