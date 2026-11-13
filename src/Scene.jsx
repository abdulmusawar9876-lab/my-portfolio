import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles, Stars } from '@react-three/drei'

const scrollT = () =>
  window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)

function Rig() {
  useFrame((state) => {
    const t = scrollT()
    const { x, y } = state.pointer
    const cam = state.camera
    cam.position.x += (x * 0.8 - cam.position.x) * 0.05
    cam.position.y += (y * 0.5 - cam.position.y) * 0.05
    cam.position.z += (7 + t * 3 - cam.position.z) * 0.05
    cam.lookAt(0, 0, 0)
  })
  return null
}

function Hero() {
  const group = useRef()
  const ring1 = useRef()
  const ring2 = useRef()
  const orbit = useRef()

  useFrame((state, dt) => {
    const t = scrollT()
    const w = state.viewport.width
    const targetX = (w / 4) * Math.cos(t * Math.PI * 3)
    group.current.position.x += (targetX - group.current.position.x) * 0.05
    group.current.rotation.y += dt * 0.25
    ring1.current.rotation.x += dt * 0.4
    ring1.current.rotation.y += dt * 0.2
    ring2.current.rotation.y += dt * 0.6
    ring2.current.rotation.z += dt * 0.3
    orbit.current.rotation.y += dt * 0.5
  })

  const sats = [
    { a: 0, y: 0.6, c: '#00cec9' },
    { a: 1.05, y: -0.8, c: '#6c5ce7' },
    { a: 2.1, y: 1.1, c: '#ff6bcb' },
    { a: 3.15, y: -0.3, c: '#00cec9' },
    { a: 4.2, y: 0.9, c: '#ffd166' },
    { a: 5.25, y: -1.1, c: '#6c5ce7' },
  ]

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
        <mesh>
          <sphereGeometry args={[1.3, 96, 96]} />
          <MeshDistortMaterial color="#6c5ce7" distort={0.45} speed={2.2} roughness={0.15} metalness={0.7} />
        </mesh>
      </Float>

      <mesh ref={ring1}>
        <torusGeometry args={[2.1, 0.02, 16, 120]} />
        <meshStandardMaterial color="#00cec9" emissive="#00cec9" emissiveIntensity={1.5} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.5, 0.015, 16, 120]} />
        <meshStandardMaterial color="#ff6bcb" emissive="#ff6bcb" emissiveIntensity={1.2} />
      </mesh>

      <group ref={orbit}>
        {sats.map((s, i) => (
          <mesh key={i} position={[Math.cos(s.a) * 2.9, s.y, Math.sin(s.a) * 2.9]}>
            <icosahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color={s.c} emissive={s.c} emissiveIntensity={1} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default function Scene() {
  return (
    <div className="canvas-wrap">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#05060a']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={60} color="#6c5ce7" />
        <pointLight position={[-6, -3, 4]} intensity={50} color="#00cec9" />
        <pointLight position={[0, 4, -4]} intensity={30} color="#ff6bcb" />
        <Stars radius={60} depth={50} count={2500} factor={3} fade speed={1} />
        <Sparkles count={120} scale={14} size={2} speed={0.4} color="#9ad" />
        <Hero />
        <Rig />
      </Canvas>
    </div>
  )
}