import { EnvState, CrossingState, PlayMode } from '../types';
import { FIXED_COLORS, PALETTE } from '../constants';
import { audioService } from '../services/audioService';

// Helpers
function drawLightCone(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, l: number, c: string, env: EnvState, d: number = 1) {
    if (env.nightIntensity < 0.2) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
    const g = ctx.createRadialGradient(0, 0, 5, l * 0.8, 0, l * 1.2);
    g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.lineTo(l, -w * 1.5); ctx.lineTo(l, w * 1.5); ctx.lineTo(0, w / 2); ctx.fill();
    ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, frameCount: number, l: boolean = false, e: 'smile' | 'dot' = 'smile') {
    ctx.save(); ctx.translate(x, y); if (l) ctx.scale(-1, 1);
    const o = s * 0.3, sz = s * 0.15;
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(o, -sz, sz * 1.6, 0, Math.PI * 2); ctx.arc(-o, -sz, sz * 1.6, 0, Math.PI * 2); ctx.fill();
    const lx = Math.sin(frameCount * 0.05) * 2;
    ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(o + lx, -sz, sz * 0.7, 0, Math.PI * 2); ctx.arc(-o + lx, -sz, sz * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'black'; ctx.lineWidth = 2; ctx.beginPath();
    if (e === 'smile') ctx.arc(0, s * 0.15, s * 0.25, 0.2, Math.PI - 0.2);
    else ctx.ellipse(0, s * 0.2, s * 0.15, s * 0.1, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,100,100,0.3)'; ctx.beginPath(); ctx.arc(o + 2, s * 0.1, s * 0.15, 0, Math.PI * 2); ctx.arc(-o - 2, s * 0.1, s * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawPandaFace(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, l: boolean = false) {
    ctx.save(); ctx.translate(x, y); if (l) ctx.scale(-1, 1);
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(s * 0.6, -s * 0.8, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-s * 0.6, -s * 0.8, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.35, -s * 0.1, s * 0.25, s * 0.2, -0.2, 0, Math.PI * 2); ctx.ellipse(-s * 0.35, -s * 0.1, s * 0.25, s * 0.2, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.15, s * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.15, s * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(0, s * 0.2, s * 0.1, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, s * 0.3, s * 0.15, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.restore();
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#DDD'; ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#999'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(s * 0.3, 0, s * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.rotate(Math.PI / 2); }
    ctx.restore();
}

export class Cloud {
    x: number; y: number; speed: number; size: number;
    constructor(width: number, skyLine: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * (skyLine - 150);
        this.speed = 0.2 + Math.random() * 0.3;
        this.size = 0.5 + Math.random() * 0.8;
    }
    update(width: number) {
        this.x += this.speed;
        if (this.x > width + 150) this.x = -150;
    }
    draw(ctx: CanvasRenderingContext2D, env: EnvState) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.size, this.size);
        const b = env.isNight || env.weather === 'rain' ? 200 - env.nightIntensity * 100 : 255;
        ctx.fillStyle = `rgba(${b},${b},${b},0.8)`;
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.arc(25, -10, 35, 0, Math.PI * 2); ctx.arc(50, 0, 30, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

export class WeatherParticle {
    x: number; y: number; vy: number; vx: number; len: number = 0; s: number = 0; type: string;
    constructor(width: number, type: string) {
        this.type = type;
        this.x = Math.random() * width;
        this.y = -10;
        if (type === 'rain') {
            this.vy = 15 + Math.random() * 5; this.vx = -2 + Math.random() * 4; this.len = 20 + Math.random() * 20;
        } else {
            this.vy = 2 + Math.random() * 3; this.vx = Math.sin(Math.random() * Math.PI * 2) * 2; this.s = 3 + Math.random() * 4;
        }
    }
    update(frameCount: number) {
        this.y += this.vy; this.x += this.vx;
        if (this.type === 'snow') this.vx += Math.sin(frameCount * 0.1) * 0.1;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        if (this.type === 'rain') {
            ctx.strokeStyle = 'rgba(170,210,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.vx, this.y + this.len); ctx.stroke();
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

export class Particle {
    x: number; y: number; text: string; life: number; vy: number;
    constructor(x: number, y: number, text: string) {
        this.x = x; this.y = y; this.text = text; this.life = 1.0; this.vy = -2;
    }
    update() {
        this.y += this.vy; this.life -= 0.02;
    }
    draw(ctx: CanvasRenderingContext2D, env: EnvState) {
        ctx.save(); ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = env.isNight ? '#FFF' : '#333';
        ctx.font = 'bold 24px Arial'; ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

export class Vehicle {
    type: string; x: number; y: number; speed: number; width: number;
    markedForDeletion: boolean = false; color: string;
    bounce: number = 0; isStopped: boolean = false; wheelRot: number = 0;

    constructor(type: string, x: number, y: number, speed: number) {
        this.type = type; this.x = x; this.y = y; this.speed = speed; this.width = 100;
        this.color = FIXED_COLORS.cars[Math.floor(Math.random() * FIXED_COLORS.cars.length)];
        if (type.includes('shinkansen')) this.width = 800;
        else if (['rapit', 'kuroshio', 'special_rapid', 'medetai'].includes(type) || type.includes('local')) this.width = 600;
        else if (['truck', 'mixer', 'bus'].includes(type)) this.width = 130;
    }

    update(width: number, frameCount: number, playMode: PlayMode, crossing: CrossingState, others: Vehicle[]) {
        this.isStopped = false;
        if (playMode === 'auto') {
            const isTrain = this.type.includes('shinkansen') || this.type.includes('local') || ['rapit', 'kuroshio', 'special_rapid', 'medetai'].includes(this.type);
            if (!isTrain) {
                const stopLine = crossing.x - 80; const dist = stopLine - this.x;
                if ((crossing.state !== 'OPEN') && dist > 0 && dist < 100) this.isStopped = true;
                const ahead = others.find(e => {
                    const eTrain = e.type.includes('shinkansen') || e.type.includes('local') || ['rapit', 'kuroshio', 'special_rapid', 'medetai'].includes(e.type);
                    return !eTrain && e !== this && e.x > this.x && e.x - this.x < this.width + 30;
                });
                if (ahead) this.isStopped = true;
            }
        }
        if (!this.isStopped) {
            this.x += this.speed; this.wheelRot += this.speed * 0.1;
            this.bounce = Math.sin(frameCount * 0.3) * 2;
        }
        if (this.x > width + 1000) this.markedForDeletion = true;
    }

    honk(addParticle: (p: Particle) => void) {
        this.bounce = -20;
        audioService.playTone(this.type);
        const s = ["🎵", "🎶", "🎺", "Puu!", "Gatagoto"];
        const t = s[Math.floor(Math.random() * s.length)];
        addParticle(new Particle(this.x + 50, this.y - 20, t));
    }

    draw(ctx: CanvasRenderingContext2D, env: EnvState, frameCount: number) {
        ctx.save(); ctx.translate(this.x, this.y + this.bounce);
        if (this.type.includes('shinkansen')) this.drawShinkansen(ctx, env, frameCount);
        else if (this.type === 'rapit') this.drawRapit(ctx, env, frameCount);
        else if (this.type === 'kuroshio') this.drawKuroshio(ctx, env, frameCount);
        else if (this.type === 'special_rapid') this.drawSpecialRapid(ctx, env, frameCount);
        else if (this.type === 'medetai') this.drawMedetai(ctx, env, frameCount);
        else if (this.type.includes('local')) this.drawLocal(ctx, env, frameCount);
        else this.drawRoadVehicle(ctx, env, frameCount);
        ctx.restore();
    }

    // --- Private Draw Methods (Converted from original script) ---
    private drawTrainBase(ctx: CanvasRenderingContext2D, i: number, l: number, h: number, c: string, env: EnvState, f: () => void) {
        if (i === 0) drawLightCone(ctx, 30, 40, 30, 180, PALETTE.lightWarm, env);
        if (i === 2) drawLightCone(ctx, -l, 40, 20, 50, PALETTE.lightRed, env, -1);
        ctx.fillStyle = c; if (i === 0) f(); else ctx.fillRect(-l, 0, l, h);
    }
    private drawRoadVehicle(ctx: CanvasRenderingContext2D, env: EnvState, frameCount: number) {
        const w = this.width; drawLightCone(ctx, w, 35, 20, 100, PALETTE.lightWarm, env); drawLightCone(ctx, 0, 35, 15, 30, PALETTE.lightRed, env, -1);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(w / 2, 55, w / 2, 10, 0, 0, Math.PI * 2); ctx.fill();
        if (this.type === 'truck') {
            ctx.fillStyle = '#F39C12'; ctx.beginPath(); ctx.roundRect(w - 50, 10, 50, 40, 5); ctx.fill();
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.roundRect(0, 0, w - 55, 50, 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(10, 10, w - 75, 30); drawFace(ctx, w - 10, 25, 18, frameCount, false);
        } else if (this.type === 'mixer') {
            ctx.fillStyle = '#3498DB'; ctx.beginPath(); ctx.roundRect(w - 50, 10, 50, 40, 5); ctx.fill();
            ctx.fillStyle = '#95A5A6'; ctx.beginPath(); ctx.ellipse((w - 60) / 2 + 10, 25, (w - 70) / 2, 20, 0, 0, Math.PI * 2); ctx.fill();
            ctx.save(); ctx.translate((w - 60) / 2 + 10, 25); ctx.rotate(this.wheelRot * -0.5); ctx.fillStyle = '#7F8C8D'; ctx.fillRect(-20, -10, 40, 20); ctx.restore();
            drawFace(ctx, w - 10, 25, 18, frameCount, false);
        } else if (this.type === 'bus') {
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.roundRect(0, 0, w, 50, 8); ctx.fill();
            ctx.fillStyle = env.isNight ? PALETTE.window.night : '#87CEEB'; for (let i = 10; i < w - 20; i += 30) ctx.fillRect(i, 5, 25, 20);
            drawFace(ctx, w, 35, 20, frameCount, false);
        } else {
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.roundRect(0, 15, 100, 35, 10); ctx.fill();
            ctx.fillStyle = '#87CEEB'; ctx.beginPath(); ctx.roundRect(20, -5, 60, 35, 8); ctx.fill();
            if (this.type === 'police') { ctx.fillStyle = '#FFF'; ctx.fillRect(0, 15, 100, 15); ctx.fillStyle = '#000'; ctx.fillRect(0, 30, 100, 20); ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(50, -10, 6, 0, Math.PI * 2); ctx.fill(); }
            if (this.type === 'ambulance') { ctx.fillStyle = 'white'; ctx.fill(); ctx.fillStyle = 'red'; ctx.fillRect(45, 20, 10, 20); ctx.fillRect(35, 25, 30, 10); ctx.beginPath(); ctx.arc(50, -10, 6, 0, Math.PI * 2); ctx.fill(); }
            drawFace(ctx, 90, 30, 20, frameCount, false);
        }
        drawWheel(ctx, 25, 50, 12, this.wheelRot); drawWheel(ctx, w - 25, 50, 12, this.wheelRot); if (this.type === 'truck' || this.type === 'bus') drawWheel(ctx, w - 50, 50, 12, this.wheelRot);
    }
    private drawShinkansen(ctx: CanvasRenderingContext2D, env: EnvState, frameCount: number) {
        const l = 250, g = 10, bc = this.type === 'shinkansen_yellow' ? FIXED_COLORS.drYellow : FIXED_COLORS.shinkansenE5, sc = this.type === 'shinkansen_yellow' ? FIXED_COLORS.drYellowStripe : FIXED_COLORS.shinkansenE5Stripe, wc = env.isNight ? PALETTE.window.night : '#333';
        for (let i = 0; i < 3; i++) {
            ctx.save(); ctx.translate(-(i * (l + g)), 0);
            this.drawTrainBase(ctx, i, l, 50, bc, env, () => {
                ctx.beginPath(); ctx.moveTo(-l, 0); ctx.lineTo(0, 0); ctx.quadraticCurveTo(80, 10, 100, 50); ctx.lineTo(-l, 50); ctx.fill();
                drawFace(ctx, 60, 35, 18, frameCount, false); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(30, 15, 25, 8, -0.2, 0, Math.PI * 2); ctx.fill();
            });
            if (i === 2) { ctx.fillStyle = bc; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-l, 0); ctx.lineTo(-l - 20, 50); ctx.lineTo(0, 50); ctx.fill(); }
            ctx.fillStyle = sc; ctx.fillRect(-l, 25, (i === 0 ? 100 : l), 5); ctx.fillStyle = wc;
            const wc2 = 5, ws = l / wc2; for (let j = 0; j < wc2; j++) { if (i === 0 && j > 3) continue; ctx.fillRect(-l + 10 + j * ws, 15, 30, 10); }
            if (i < 2) { ctx.fillStyle = '#333'; ctx.fillRect(-g - 5, 30, 10, 10); } ctx.restore();
        }
    }
    private drawRapit(ctx: CanvasRenderingContext2D, env: EnvState, frameCount: number) {
        const l = 180, g = 10, h = 55, wc = env.isNight ? PALETTE.window.night : '#87CEEB';
        for (let i = 0; i < 3; i++) {
            ctx.save(); ctx.translate(-(i * (l + g)), 0);
            this.drawTrainBase(ctx, i, l, h, FIXED_COLORS.rapitBlue, env, () => {
                ctx.beginPath(); ctx.moveTo(-l, 0); ctx.lineTo(20, 0); ctx.bezierCurveTo(60, 0, 70, 20, 70, 55); ctx.lineTo(-l, 55); ctx.fill();
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(40, 15, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = env.isNight ? '#FFF' : '#FFD700'; ctx.beginPath(); ctx.arc(55, 15, 5, 0, Math.PI * 2); ctx.fill(); drawFace(ctx, 40, 35, 18, frameCount, false);
            });
            ctx.fillStyle = wc; const c = 4, s = l / c; for (let j = 0; j < c; j++) { if (i === 0 && j > 2) continue; ctx.beginPath(); ctx.arc(-l + 25 + j * s, 20, 12, 0, Math.PI * 2); ctx.fill(); }
            drawWheel(ctx, -l + 30, h, 12, this.wheelRot); drawWheel(ctx, (i === 0 ? 0 : -10), h, 12, this.wheelRot); if (i < 2) { ctx.fillStyle = '#333'; ctx.fillRect(-g - 5, 30, 10, 10); } ctx.restore();
        }
    }
    private drawKuroshio(ctx: CanvasRenderingContext2D, env: EnvState, frameCount: number) {
        const l = 180, g = 10, h = 55, wc = env.isNight ? PALETTE.window.night : '#333';
        for (let i = 0; i < 3; i++) {
            ctx.save(); ctx.translate(-(i * (l + g)), 0);
            this.drawTrainBase(ctx, i, l, h, FIXED_COLORS.kuroshioWhite, env, () => {
                ctx.beginPath(); ctx.moveTo(-l, 0); ctx.lineTo(10, 0); ctx.quadraticCurveTo(40, 0, 40, 55); ctx.lineTo(-l, 55); ctx.fill(); drawPandaFace(ctx, 40, 25, 20, false);
            });
            ctx.fillStyle = FIXED_COLORS.kuroshioTeal; ctx.fillRect(-l, 45, (i === 0 ? l + 10 : l), 5); ctx.fillStyle = wc; const c = 4, s = l / c; for (let j = 0; j < c; j++) { if (i === 0 && j > 2) continue; ctx.fillRect(-l + 10 + j * s, 15, 25, 15); }
            drawWheel(ctx, -l + 30, h, 12, this.wheelRot); drawWheel(ctx, (i === 0 ? 0 : -10), h, 12, this.wheelRot); if (i < 2) { ctx.fillStyle = '#333'; ctx.fillRect(-g - 5, 30, 10, 10); } ctx.restore();
        }
    }
    private drawSpecialRapid(ctx: CanvasRenderingContext2D, env: EnvState, frameCount: number) {
        const l = 180, g = 10, h = 55, wc = env.isNight ? PALETTE.window.night : '#87CEEB';
        for (let i = 0; i < 3; i++) {
            ctx.save(); ctx.translate(-(i * (l + g)), 0);
            this.drawTrainBase(ctx, i, l, h, FIXED_COLORS.specialRapidSilver, env, () => {
                ctx.beginPath(); ctx.moveTo(-l, 0); ctx.lineTo(10, 0); ctx.quadraticCurveTo(30, 5, 30, 55); ctx.lineTo(-l, 55); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(10, 5, 20, 20); drawFace(ctx, 30, 35, 18, frameCount, false);
            });
            ctx.fillStyle = FIXED_COLORS.specialRapidBrown; ctx.fillRect(-l, 35, (i === 0 ? l + 20 : l), 4); ctx.fillStyle = FIXED_COLORS.specialRapidBlue; ctx.fillRect(-l, 39, (i === 0 ? l + 20 : l), 4); ctx.fillStyle = wc;
            const c = 3, s = l / c; for (let j = 0; j < c; j++) { if (i === 0 && j > 1) continue; ctx.fillRect(-l + 15 + j * s, 10, 35, 18); }
            drawWheel(ctx, -l + 30, h, 12, this.wheelRot); drawWheel(ctx, (i === 0 ? 0 : -10), h, 12, this.wheelRot); if (i < 2) { ctx.fillStyle = '#333'; ctx.fillRect(-g - 5, 30, 10, 10); } ctx.restore();
        }
    }
    private drawMedetai(ctx: CanvasRenderingContext2D, env: EnvState, frameCount: number) {
        const l = 180, g = 10, h = 55, wc = env.isNight ? PALETTE.window.night : '#FFF';
        for (let i = 0; i < 3; i++) {
            ctx.save(); ctx.translate(-(i * (l + g)), 0);
            this.drawTrainBase(ctx, i, l, h, FIXED_COLORS.medetaiPink, env, () => {
                ctx.beginPath(); ctx.roundRect(-l, 0, l + 20, h, [0, 15, 10, 0]); ctx.fill(); drawFace(ctx, 20, 30, 25, frameCount, false);
            });
            ctx.strokeStyle = FIXED_COLORS.medetaiRed; ctx.lineWidth = 1; for (let x = -l; x < (i === 0 ? 10 : 0); x += 15) { for (let y = 10; y < 50; y += 10) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI); ctx.stroke(); } }
            ctx.fillStyle = wc; const c = 3, s = l / c; for (let j = 0; j < c; j++) { ctx.beginPath(); ctx.arc(-l + 30 + j * s, 20, 10, 0, Math.PI * 2); ctx.fill(); }
            drawWheel(ctx, -l + 30, h, 12, this.wheelRot); drawWheel(ctx, (i === 0 ? 0 : -10), h, 12, this.wheelRot); if (i < 2) { ctx.fillStyle = '#333'; ctx.fillRect(-g - 5, 30, 10, 10); } ctx.restore();
        }
    }
    private drawLocal(ctx: CanvasRenderingContext2D, env: EnvState, frameCount: number) {
        const l = 180, g = 10, h = 55, isM = this.type === 'local_maroon', bc = isM ? FIXED_COLORS.maroon : FIXED_COLORS.localOrange, sc = isM ? '#FFF' : FIXED_COLORS.localOrangeStripe, wc = env.isNight ? PALETTE.window.night : '#87CEEB';
        for (let i = 0; i < 3; i++) {
            ctx.save(); ctx.translate(-(i * (l + g)), 0);
            this.drawTrainBase(ctx, i, l, h, bc, env, () => {
                ctx.beginPath(); ctx.roundRect(-l, 0, l + 20, h, [0, 20, 10, 0]); ctx.fill(); drawFace(ctx, 20, 30, 22, frameCount, false);
            });
            ctx.fillStyle = sc; if (isM) ctx.fillRect(-l, 5, (i === 0 ? l + 10 : l), 3); else ctx.fillRect(-l, 40, (i === 0 ? l + 20 : l), 8);
            ctx.fillStyle = wc; const c = 3, w = 40, s = (l - (w * c)) / (c + 1);
            for (let j = 0; j < c; j++) { if (isM) { ctx.strokeStyle = '#C0C0C0'; ctx.lineWidth = 2; ctx.strokeRect(-l + s + j * (w + s), 10, w, 20); } ctx.fillRect(-l + s + j * (w + s), 10, w, 20); }
            ctx.fillStyle = '#CCC'; ctx.fillRect(-l + s - 5, 10, 5, 40); drawWheel(ctx, -l + 30, h, 12, this.wheelRot); drawWheel(ctx, (i === 0 ? 0 : -10), h, 12, this.wheelRot);
            if (i < 2) { ctx.fillStyle = '#333'; ctx.fillRect(-g - 5, 30, 10, 10); } ctx.restore();
        }
    }
}
