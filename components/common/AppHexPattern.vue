<script setup lang="ts">
interface Props {
  variant?: 'scatter' | 'cluster' | 'sparse'
}
withDefaults(defineProps<Props>(), { variant: 'scatter' })

const SCATTER_HEXES = [
  {
    d: 'M805.5 143.102V403.976L572.5 539.266L339.5 403.976V143.102L572.5 6.73828L805.5 143.102Z',
    pulse: 1,
  },
  { d: 'M511 63.0479V181.44L405.5 242.843L300 181.44V63.0479L405.5 1.1582L511 63.0479Z', pulse: 2 },
  {
    d: 'M414 291.353V414.154L304.5 477.843L195 414.154V291.353L304.5 227.158L414 291.353Z',
    pulse: 3,
  },
  {
    d: 'M258 500.757V595.635L173.5 644.843L89 595.635V500.757L173.5 451.159L258 500.757Z',
    pulse: 1,
  },
  {
    d: 'M257.5 326.904V470.69L129.5 545.264L1.5 470.69V326.904L129.5 251.739L257.5 326.904Z',
    pulse: 2,
  },
  {
    d: 'M581 361.841V483.663L472.5 546.843L364 483.663V361.841L472.5 298.159L581 361.841Z',
    pulse: 3,
  },
  { d: 'M798 454.807V553.603L710 604.843L622 553.603V454.807L710 403.159L798 454.807Z', pulse: 1 },
  { d: 'M620 638.222V730.157L538 777.843L456 730.157V638.222L538 590.158L620 638.222Z', pulse: 2 },
  { d: 'M480 610.517V787.212L323 878.842L166 787.212V610.517L323 518.16L480 610.517Z', pulse: 3 },
]

// Honeycomb cluster, but sizes/positions are jittered off the perfect tessellation
// grid so it doesn't read as one flawless flower shape.
const CLUSTER_HEXES = [
  { d: 'M523.25 362.5V487.5L415 550L306.75 487.5V362.5L415 300L523.25 362.5Z', pulse: 1 },
  { d: 'M735.6 387.5V532.5L610 605L484.4 532.5V387.5L610 315L735.6 387.5Z', pulse: 2 },
  { d: 'M264.6 352.5V467.5L165 525L65.4 467.5V352.5L165 295L264.6 352.5Z', pulse: 3 },
  { d: 'M625.3 175V285L530 340L434.7 285V175L530 120L625.3 175Z', pulse: 1 },
  { d: 'M396.2 195V335L275 405L153.8 335V195L275 125L396.2 195Z', pulse: 2 },
  { d: 'M647.6 595V725L535 790L422.4 725V595L535 530L647.6 595Z', pulse: 3 },
  { d: 'M373.9 550V670L270 730L166.1 670V550L270 490L373.9 550Z', pulse: 1 },
]

// Varied sizes, but pulled close together into one dense knot instead of
// spreading across the whole canvas — same tight footprint as cluster/scatter,
// and roughly the same hex count so all three don't feel mismatched in weight.
const SPARSE_HEXES = [
  { d: 'M626.9 240V420L471 510L315.1 420V240L471 150L626.9 240Z', pulse: 1 },
  { d: 'M429.6 364V494L317 559L204.4 494V364L317 299L429.6 364Z', pulse: 2 },
  { d: 'M665.6 238.5V323.5L592 366L518.4 323.5V238.5L592 196L665.6 238.5Z', pulse: 3 },
  { d: 'M671.2 478.5V633.5L537 711L402.8 633.5V478.5L537 401L671.2 478.5Z', pulse: 1 },
  { d: 'M414.6 566V666L328 716L241.4 666V566L328 516L414.6 566Z', pulse: 2 },
  { d: 'M538.3 429.5V494.5L482 527L425.7 494.5V429.5L482 397L538.3 429.5Z', pulse: 3 },
  { d: 'M680.6 395V465L620 500L559.4 465V395L620 360L680.6 395Z', pulse: 1 },
  { d: 'M305 462.5V537.5L240 575L175 537.5V462.5L240 425L305 462.5Z', pulse: 2 },
  { d: 'M307.9 615V705L230 750L152.1 705V615L230 570L307.9 615Z', pulse: 3 },
]

const HEX_SETS = { scatter: SCATTER_HEXES, cluster: CLUSTER_HEXES, sparse: SPARSE_HEXES }
</script>

<template>
  <svg
    :class="['app-hex-pattern', `app-hex-pattern--${variant}`]"
    aria-hidden="true"
    viewBox="0 0 807 880"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      v-for="(hex, i) in HEX_SETS[variant]"
      :key="i"
      :class="['app-hex-pattern__shape', `app-hex-pattern__shape--pulse-${hex.pulse}`]"
      :d="hex.d"
      stroke-width="2"
    />
  </svg>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

.app-hex-pattern {
  display: block;
  width: 100%;
  height: auto;

  &__shape {
    fill: $color-white;
    stroke: $color-gray-900;
    transition: fill $transition-slow;
    transform-origin: center;

    &--pulse-1 {
      animation: app-hex-pattern-pulse 7s infinite ease-in-out;
    }
    &--pulse-2 {
      animation: app-hex-pattern-pulse 7s infinite ease-in-out 2.3s;
    }
    &--pulse-3 {
      animation: app-hex-pattern-pulse 7s infinite ease-in-out 4.6s;
    }

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes app-hex-pattern-pulse {
  0% {
    fill: $color-white;
    stroke: $color-gray-900;
    opacity: 0.6;
  }
  50% {
    fill: $color-primary-light;
    stroke: $color-primary-dark;
    opacity: 1;
  }
  100% {
    fill: $color-white;
    stroke: $color-gray-900;
    opacity: 0.6;
  }
}
</style>
