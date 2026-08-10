const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');

function createDetailedBibleIcon(size, isMaskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const scale = size / 512;

  // Background - Dark Rich Gothic Emerald / Divine Light Gradient
  const bgGrad = ctx.createRadialGradient(size/2, size/2, 10*scale, size/2, size/2, size*0.7);
  bgGrad.addColorStop(0, '#1c2e24');
  bgGrad.addColorStop(0.6, '#0f1d16');
  bgGrad.addColorStop(1, '#050a07');

  if (isMaskable) {
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);
  } else {
    const rx = size * 0.22;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, rx);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Subtle Gold Border
    ctx.lineWidth = 4 * scale;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.stroke();
  }

  // Sunburst / Divine Light Rays from Top Left
  ctx.save();
  ctx.globalAlpha = 0.28;
  const rayGrad = ctx.createLinearGradient(0, 0, size, size);
  rayGrad.addColorStop(0, '#fef08a');
  rayGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = rayGrad;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.85, 0);
  ctx.lineTo(size, size * 0.75);
  ctx.lineTo(0, size * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const cx = size / 2;
  const cy = size / 2 + 15 * scale;

  // Outer Cross Glow
  ctx.save();
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 35 * scale;

  // Golden Cross
  const crossGrad = ctx.createLinearGradient(cx - 30*scale, cy - 180*scale, cx + 30*scale, cy - 30*scale);
  crossGrad.addColorStop(0, '#fffbeb');
  crossGrad.addColorStop(0.3, '#fde047');
  crossGrad.addColorStop(0.8, '#d97706');
  crossGrad.addColorStop(1, '#92400e');

  // Vertical beam
  ctx.fillStyle = crossGrad;
  ctx.fillRect(cx - 14*scale, cy - 180*scale, 28*scale, 140*scale);
  // Horizontal beam
  ctx.fillRect(cx - 50*scale, cy - 145*scale, 100*scale, 26*scale);
  ctx.restore();

  // Cross Highlights & Center Radiance
  ctx.save();
  const radGrad = ctx.createRadialGradient(cx, cy - 132*scale, 0, cx, cy - 132*scale, 50*scale);
  radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  radGrad.addColorStop(0.35, 'rgba(254, 240, 138, 0.7)');
  radGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(cx, cy - 132*scale, 50*scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Open Holy Bible Base
  ctx.save();
  ctx.translate(cx, cy);

  // Book Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 25 * scale;
  ctx.shadowOffsetY = 15 * scale;

  // Leather Cover / Stand
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.roundRect(-160*scale, -50*scale, 320*scale, 170*scale, 12*scale);
  ctx.fill();

  // Pages - Left & Right
  const pageGradLeft = ctx.createLinearGradient(-150*scale, 0, 0, 0);
  pageGradLeft.addColorStop(0, '#d1d5db');
  pageGradLeft.addColorStop(0.8, '#fef3c7');
  pageGradLeft.addColorStop(1, '#f3f4f6');

  const pageGradRight = ctx.createLinearGradient(0, 0, 150*scale, 0);
  pageGradRight.addColorStop(0, '#f3f4f6');
  pageGradRight.addColorStop(0.2, '#fef3c7');
  pageGradRight.addColorStop(1, '#d1d5db');

  // Left Page
  ctx.fillStyle = pageGradLeft;
  ctx.beginPath();
  ctx.moveTo(-150*scale, -40*scale);
  ctx.quadraticCurveTo(-75*scale, -60*scale, -5*scale, -25*scale);
  ctx.lineTo(-5*scale, 105*scale);
  ctx.quadraticCurveTo(-75*scale, 75*scale, -150*scale, 95*scale);
  ctx.closePath();
  ctx.fill();

  // Right Page
  ctx.fillStyle = pageGradRight;
  ctx.beginPath();
  ctx.moveTo(150*scale, -40*scale);
  ctx.quadraticCurveTo(75*scale, -60*scale, 5*scale, -25*scale);
  ctx.lineTo(5*scale, 105*scale);
  ctx.quadraticCurveTo(75*scale, 75*scale, 150*scale, 95*scale);
  ctx.closePath();
  ctx.fill();

  // Spine Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-6*scale, -30*scale, 12*scale, 135*scale);

  // Red Ribbon Bookmark
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(0, -25*scale);
  ctx.quadraticCurveTo(30*scale, 40*scale, 20*scale, 130*scale);
  ctx.lineTo(5*scale, 120*scale);
  ctx.lineTo(-5*scale, 130*scale);
  ctx.quadraticCurveTo(15*scale, 40*scale, 0, -25*scale);
  ctx.fill();

  // Decorative scripture lines on pages
  ctx.fillStyle = 'rgba(120, 53, 15, 0.28)';
  for (let i = 0; i < 6; i++) {
    // Left text lines
    ctx.fillRect(-130*scale, (-20 + i * 18)*scale, 100*scale, 3*scale);
    // Right text lines
    ctx.fillRect(30*scale, (-20 + i * 18)*scale, 100*scale, 3*scale);
  }

  // Glowing Dove in Flight (Right Top)
  ctx.restore();
  ctx.save();
  ctx.translate(cx + 95*scale, cy - 85*scale);
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 22*scale;
  ctx.fillStyle = '#ffffff';

  // Body & Wings of Dove
  ctx.beginPath();
  ctx.ellipse(0, 0, 14*scale, 7*scale, -Math.PI/6, 0, Math.PI*2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-2*scale, -2*scale);
  ctx.quadraticCurveTo(-20*scale, -30*scale, -35*scale, -20*scale);
  ctx.quadraticCurveTo(-15*scale, -10*scale, 0, 0);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(2*scale, 2*scale);
  ctx.quadraticCurveTo(20*scale, 25*scale, 32*scale, 15*scale);
  ctx.quadraticCurveTo(15*scale, 5*scale, 0, 0);
  ctx.fill();
  ctx.restore();

  // App Title '聖' in Gold Seal at top right
  ctx.save();
  ctx.translate(size - 55*scale, 55*scale);
  ctx.fillStyle = 'rgba(5, 150, 105, 0.95)';
  ctx.beginPath();
  ctx.arc(0, 0, 24*scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(24*scale)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('聖', 0, 1*scale);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

fs.writeFileSync('public/icon-192.png', createDetailedBibleIcon(192));
fs.writeFileSync('public/icon-512.png', createDetailedBibleIcon(512));
fs.writeFileSync('public/maskable-icon-512.png', createDetailedBibleIcon(512, true));
fs.writeFileSync('public/apple-touch-icon.png', createDetailedBibleIcon(180));

console.log('Detailed PWA Icons generated successfully!');
