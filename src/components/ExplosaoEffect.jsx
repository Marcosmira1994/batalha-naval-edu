import styles from './ExplosaoEffect.module.css';

// 8 direções em que as partículas se espalham
const DIRECOES = [
  { dx: 0,    dy: -1   },  // N
  { dx: 0.71, dy: -0.71 }, // NE
  { dx: 1,    dy: 0    },  // E
  { dx: 0.71, dy: 0.71 },  // SE
  { dx: 0,    dy: 1    },  // S
  { dx: -0.71,dy: 0.71 },  // SW
  { dx: -1,   dy: 0    },  // W
  { dx: -0.71,dy: -0.71 }, // NW
];

const CORES = ['#ff6600', '#ffcc00', '#ff4400', '#ffaa00', '#ff6600', '#ffdd00', '#ff5500', '#ffbb00'];

// delay: ms de atraso antes de iniciar (para explosões em cadeia no afundamento)
export default function ExplosaoEffect({ delay = 0 }) {
  const distancia = 38; // px que as partículas viajam

  return (
    <div className={styles.container} aria-hidden>
      {/* Flash branco */}
      <div
        className={styles.flash}
        style={{ animationDelay: `${delay}ms` }}
      />

      {/* 8 partículas */}
      {DIRECOES.map((dir, i) => (
        <div
          key={i}
          className={styles.particula}
          style={{
            '--dx': `${dir.dx * distancia}px`,
            '--dy': `${dir.dy * distancia}px`,
            background: CORES[i],
            animationDelay: `${delay}ms`,
          }}
        />
      ))}

      {/* Fumaça */}
      <div
        className={styles.fumaca}
        style={{ animationDelay: `${delay + 80}ms` }}
      />
    </div>
  );
}
