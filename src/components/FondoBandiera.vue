<script setup lang="ts">
import { useId } from 'vue'

// Union Jack a sole linee, deformata come un telo in prospettiva:
// la geometria delle schermate in design/schermate/.
function generaBandiera() {
  const punto = (u: number, v: number) => {
    const s = u / 60
    const t = v / 30
    const x = -30 + s * 450 + 25 * (t - 0.5) * (1 - s)
    const alto = 470 + s * 220
    const basso = 900 - s * 110
    const y = alto + t * (basso - alto) + 35 * Math.sin(3 * s + 0.3) * (1 - 0.5 * s)
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  }
  const linea = (u0: number, v0: number, u1: number, v1: number) => {
    const punti: string[] = []
    for (let i = 0; i <= 32; i++) {
      punti.push(punto(u0 + ((u1 - u0) * i) / 32, v0 + ((v1 - v0) * i) / 32))
    }
    return 'M' + punti.join(' L')
  }
  const croce: string[] = []
  const diagonali: string[] = []
  for (let k = -3; k <= 3; k++) {
    croce.push(linea(0, 15 + k, 60, 15 + k))
    croce.push(linea(30 + k, 0, 30 + k, 30))
  }
  for (const d of [-2.5, -1.25, 0, 1.25, 2.5]) {
    const c = d * Math.sqrt(5)
    let v0 = Math.max(0, -c / 2)
    let v1 = Math.min(30, (60 - c) / 2)
    diagonali.push(linea(2 * v0 + c, v0, 2 * v1 + c, v1))
    v0 = Math.max(0, c / 2)
    v1 = Math.min(30, (60 + c) / 2)
    diagonali.push(linea(60 + c - 2 * v0, v0, 60 + c - 2 * v1, v1))
  }
  const bordo = [linea(0, 0, 60, 0), linea(0, 30, 60, 30), linea(0, 0, 0, 30), linea(60, 0, 60, 30)]
  return { croce: croce.join(' '), diagonali: diagonali.join(' '), bordo: bordo.join(' ') }
}

const bandiera = generaBandiera()
const id = useId()
const bagliore = `${id}-bagliore`
const sfuma = `${id}-sfuma`
const maschera = `${id}-maschera`
</script>

<template>
  <div class="fondo">
    <svg
      class="bandiera"
      aria-hidden="true"
      viewBox="-20 420 430 430"
      preserveAspectRatio="xMinYMax meet"
    >
      <defs>
        <radialGradient :id="bagliore" cx="40" cy="730" r="260" gradientUnits="userSpaceOnUse">
          <stop class="bandiera-bagliore" offset="0" stop-opacity="0.55" />
          <stop class="bandiera-bagliore" offset="1" stop-opacity="0" />
        </radialGradient>
        <linearGradient :id="sfuma" x1="0" y1="430" x2="0" y2="650" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="black" />
          <stop offset="1" stop-color="white" />
        </linearGradient>
        <mask :id="maschera" maskUnits="userSpaceOnUse" x="-40" y="380" width="480" height="540">
          <rect x="-40" y="380" width="480" height="540" :fill="`url(#${sfuma})`" />
        </mask>
      </defs>
      <rect x="-40" y="380" width="480" height="540" :fill="`url(#${bagliore})`" />
      <g :mask="`url(#${maschera})`" fill="none" stroke-linecap="round">
        <path class="bandiera-bordo" :d="bandiera.bordo" />
        <path class="bandiera-diagonali" :d="bandiera.diagonali" />
        <path class="bandiera-croce" :d="bandiera.croce" />
      </g>
    </svg>
    <slot />
  </div>
</template>
