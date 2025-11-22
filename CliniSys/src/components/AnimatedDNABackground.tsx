import { useEffect, useRef } from 'react';

interface Molecule {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function AnimatedDNABackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Create molecules
    const molecules: Molecule[] = [];
    const numMolecules = 12;
    const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981'];

    for (let i = 0; i < numMolecules; i++) {
      molecules.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Animation loop
    let animationId: number;

    const animate = () => {
      // Clear canvas with semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw molecules
      molecules.forEach((molecule) => {
        // Update position
        molecule.x += molecule.vx;
        molecule.y += molecule.vy;

        // Bounce off walls
        if (molecule.x - molecule.radius < 0 || molecule.x + molecule.radius > canvas.width) {
          molecule.vx *= -1;
          molecule.x = Math.max(molecule.radius, Math.min(canvas.width - molecule.radius, molecule.x));
        }
        if (molecule.y - molecule.radius < 0 || molecule.y + molecule.radius > canvas.height) {
          molecule.vy *= -1;
          molecule.y = Math.max(molecule.radius, Math.min(canvas.height - molecule.radius, molecule.y));
        }

        // Draw glowing molecule
        const gradient = ctx.createRadialGradient(molecule.x, molecule.y, 0, molecule.x, molecule.y, molecule.radius * 3);
        gradient.addColorStop(0, molecule.color + '40');
        gradient.addColorStop(1, molecule.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          molecule.x - molecule.radius * 3,
          molecule.y - molecule.radius * 3,
          molecule.radius * 6,
          molecule.radius * 6
        );

        // Draw molecule core
        ctx.fillStyle = molecule.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(molecule.x, molecule.y, molecule.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw connections between nearby molecules (DNA strands effect)
      const connectionDistance = 150;
      molecules.forEach((molecule1, i) => {
        molecules.forEach((molecule2, j) => {
          if (i < j) {
            const dx = molecule2.x - molecule1.x;
            const dy = molecule2.y - molecule1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
              const opacity = (1 - distance / connectionDistance) * 0.3;
              const avgColor = '#3b82f6'; // Blue color for connections

              ctx.strokeStyle = avgColor + Math.floor(opacity * 255)
                .toString(16)
                .padStart(2, '0');
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(molecule1.x, molecule1.y);
              ctx.lineTo(molecule2.x, molecule2.y);
              ctx.stroke();
            }
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 245, 250, 0.98) 100%)',
      }}
    />
  );
}
