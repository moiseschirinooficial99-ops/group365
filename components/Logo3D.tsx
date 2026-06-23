'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface Logo3DProps {
  size?: number
  autoRotate?: boolean
  imageFilter?: string
  blendMode?: string
}

export default function Logo3D({
  size = 320,
  autoRotate = true,
  imageFilter = 'drop-shadow(0 20px 40px rgba(201,168,76,0.25))',
  blendMode = 'lighten',
}: Logo3DProps) {
  return (
    <div style={{ width: size, height: size, perspective: '1200px' }} className="relative z-10">
      <motion.div
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
        animate={autoRotate ? { rotateY: [0, 360] } : {}}
        transition={autoRotate ? { duration: 14, repeat: Infinity, ease: 'linear' } : {}}
        whileHover={!autoRotate ? { rotateY: 25, scale: 1.05, transition: { duration: 0.4 } } : {}}
      >
        <Image
          src="/logo.png"
          alt="GROUP 360 INICIATIVAS"
          width={size}
          height={size}
          quality={100}
          priority
          style={{
            objectFit: 'contain',
            width: '100%',
            height: '100%',
            filter: imageFilter,
            mixBlendMode: blendMode as any,
          }}
        />
      </motion.div>
    </div>
  )
}
