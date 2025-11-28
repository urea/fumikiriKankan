import { GameSettings, EnvState, CrossingState } from '../types';
import { Vehicle, Cloud, Particle, WeatherParticle } from './entities';
import { PALETTE, FIXED_COLORS } from '../constants';
import { audioService } from '../services/audioService';

export class FumikiriGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private settings: GameSettings;
    
    // Game State
    private entities: Vehicle[] = [];
    private particles: Particle[] = [];
    private clouds: Cloud[] = [];
    private weatherParticles: WeatherParticle[] = [];
    private frameCount: number = 0;
    private crossing: CrossingState = { state: 'OPEN', timer: 0, angle: -Math.PI / 2, x: 0, isAlarmOn: false };
    private env: EnvState = { time: 0, cycleDuration: 3600, isNight: false, nightIntensity: 0, weather: 'clear', weatherTimer: 0 };
    
    // Layout
    private width: number = 0;
    private height: number = 0;
    private skyLine: number = 0;
    private elevatedTrackY: number = 0;
    private groundTrackY: number = 0;
    private roadY: number = 0;
    
    private animationId: number = 0;

    constructor(canvas: HTMLCanvasElement, settings: GameSettings) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.settings = settings;
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    }

    public resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.skyLine = this.height * 0.35;
        this.elevatedTrackY = this.height * 0.25;
        this.groundTrackY = this.height * 0.55;
        this.roadY = this.height * 0.85;
        this.crossing.x = this.width * 0.35;
    }

    public updateSettings(newSettings: GameSettings) {
        // Reset crossing if mode changed to tap to prevent stuck closed crossing
        if (this.settings.playMode !== newSettings.playMode && newSettings.playMode === 'tap') {
            this.crossing.state = 'OPEN';
            this.crossing.angle = -Math.PI / 2;
            this.crossing.isAlarmOn = false;
        }
        
        // Handle weather change reset
        if (this.settings.weatherMode !== newSettings.weatherMode) {
             if (newSettings.weatherMode !== 'auto') {
                 this.env.weather = newSettings.weatherMode;
                 this.weatherParticles = [];
             }
        }

        this.settings = newSettings;
    }

    public start() {
        this.loop();
    }

    public destroy() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.resize.bind(this));
    }

    public handleTap(x: number, y: number) {
        // Check for clicks on entities (honk)
        let clickedVehicle = false;
        for (let ent of this.entities) {
            if (x > ent.x && x < ent.x + ent.width && y > ent.y && y < ent.y + 100) {
                ent.honk(p => this.particles.push(p));
                clickedVehicle = true;
                break;
            }
        }

        if (this.settings.playMode === 'tap' && !clickedVehicle) {
            if (y < this.elevatedTrackY + 50) this.spawnShinkansen();
            else if (y < this.roadY - 50) this.spawnLocalTrain();
            else this.spawnVehicle();
        } else if (this.settings.playMode === 'auto' && !clickedVehicle && this.entities.length > 0) {
             const randomEntity = this.entities[Math.floor(Math.random() * this.entities.length)];
             randomEntity.honk(p => this.particles.push(p));
        }
    }

    private spawnVehicle() {
        const t = ['car', 'car', 'car', 'police', 'ambulance', 'truck', 'truck', 'mixer', 'bus'];
        const type = t[Math.floor(Math.random() * t.length)];
        const speed = 3 + Math.random() * 2.5;
        this.entities.push(new Vehicle(type, -150, this.roadY - 30, speed));
    }

    private spawnLocalTrain() {
        const kt = ['rapit', 'kuroshio', 'special_rapid', 'medetai', 'local_maroon'];
        if (this.settings.playMode === 'auto') {
            if (this.entities.some(e => kt.includes(e.type) || e.type.includes('local'))) return;
        }
        const type = kt[Math.floor(Math.random() * kt.length)];
        let speed = 4;
        if (type === 'rapit' || type === 'special_rapid') speed = 7;
        if (type === 'kuroshio') speed = 6;
        if (type === 'medetai') speed = 3.5;
        this.entities.push(new Vehicle(type, -700, this.groundTrackY - 55, speed));
    }

    private spawnShinkansen() {
        if (this.settings.playMode === 'auto') {
            if (this.entities.some(e => e.type.includes('shinkansen'))) return;
        }
        const type = Math.random() < 0.3 ? 'shinkansen_yellow' : 'shinkansen_e5';
        this.entities.push(new Vehicle(type, -900, this.elevatedTrackY - 50, 15));
    }

    private updateEnvironment() {
        if (this.settings.timeMode === 'auto') {
            this.env.time = (this.frameCount % this.env.cycleDuration) / this.env.cycleDuration;
            this.env.nightIntensity = Math.pow(Math.sin(Math.PI * this.env.time), 2);
        } else if (this.settings.timeMode === 'day') {
            this.env.nightIntensity = Math.max(0, this.env.nightIntensity - 0.02);
        } else {
            this.env.nightIntensity = Math.min(1, this.env.nightIntensity + 0.02);
        }
        this.env.isNight = this.env.nightIntensity > 0.3;

        if (this.settings.weatherMode === 'auto') {
            this.env.weatherTimer++;
            if (this.env.weatherTimer > 1200) {
                this.env.weatherTimer = 0;
                const r = Math.random();
                if (r < 0.5) this.env.weather = 'clear';
                else if (r < 0.8) this.env.weather = 'rain';
                else this.env.weather = 'snow';
                this.weatherParticles = [];
            }
        } else {
            this.env.weather = this.settings.weatherMode;
        }

        if (this.env.weather !== 'clear') {
            const count = this.env.weather === 'rain' ? 5 : 2;
            for (let i = 0; i < count; i++) this.weatherParticles.push(new WeatherParticle(this.width, this.env.weather));
        }
    }

    private update() {
        this.frameCount++;
        this.updateEnvironment();

        if (this.clouds.length < 5) this.clouds.push(new Cloud(this.width, this.skyLine));
        this.clouds.forEach(c => c.update(this.width));

        this.weatherParticles.forEach(p => p.update(this.frameCount));
        this.weatherParticles = this.weatherParticles.filter(p => p.y < this.height + 50);

        if (this.settings.playMode === 'auto') {
            if (Math.random() < 0.012) this.spawnVehicle();
            if (Math.random() < 0.003 && this.crossing.state === 'OPEN') this.spawnLocalTrain();
            if (Math.random() < 0.005) this.spawnShinkansen();
        }

        // Crossing Logic
        if (this.settings.playMode === 'auto') {
            const localTrain = this.entities.find(e => !e.type.includes('shinkansen') && !['car', 'truck', 'bus', 'police', 'ambulance', 'mixer'].includes(e.type));
            if (localTrain) {
                const dist = localTrain.x - this.crossing.x;
                if (dist < -800 && dist > -850 && this.crossing.state === 'OPEN') { this.crossing.state = 'WARNING'; this.crossing.timer = 80; }
                if (dist > 800 && (this.crossing.state === 'CLOSED' || this.crossing.state === 'CLOSING')) { this.crossing.state = 'OPENING'; }
            }
            switch (this.crossing.state) {
                case 'WARNING': this.crossing.timer--; if (this.frameCount % 15 === 0) this.crossing.isAlarmOn = !this.crossing.isAlarmOn; if (this.crossing.timer <= 0) this.crossing.state = 'CLOSING'; break;
                case 'CLOSING': this.crossing.angle += 0.05; if (this.crossing.angle >= 0) { this.crossing.angle = 0; this.crossing.state = 'CLOSED'; } if (this.frameCount % 15 === 0) this.crossing.isAlarmOn = !this.crossing.isAlarmOn; break;
                case 'CLOSED': if (this.frameCount % 15 === 0) this.crossing.isAlarmOn = !this.crossing.isAlarmOn; break;
                case 'OPENING': this.crossing.angle -= 0.05; this.crossing.isAlarmOn = false; if (this.crossing.angle <= -Math.PI / 2) { this.crossing.angle = -Math.PI / 2; this.crossing.state = 'OPEN'; } break;
            }
        }

        this.entities.forEach(e => e.update(this.width, this.frameCount, this.settings.playMode, this.crossing, this.entities));
        this.entities = this.entities.filter(e => !e.markedForDeletion);
        this.entities.sort((a, b) => a.y - b.y);

        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);
    }

    private getEnvColor(key: 'sky' | 'grass' | 'road' | 'sleeper' | 'structure') {
        const c = PALETTE[key];
        const c1 = c.day;
        const c2 = c.night;
        const t = this.env.nightIntensity;
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        return `rgb(${r},${g},${b})`;
    }

    private drawCrossingPost(x: number, y: number) {
        this.ctx.save(); this.ctx.translate(x, y);
        this.ctx.fillStyle = '#2C3E50'; this.ctx.fillRect(-6, -90, 12, 90);
        this.ctx.fillStyle = '#F1C40F'; this.ctx.fillRect(-12, -15, 24, 15);
        this.ctx.fillStyle = '#333'; this.ctx.fillRect(-25, -90, 50, 20);
        const lightColor = (on: boolean) => on ? FIXED_COLORS.warning : (this.env.isNight ? '#330000' : '#550000');
        if (this.crossing.state !== 'OPEN') {
            this.ctx.fillStyle = lightColor(this.crossing.isAlarmOn); this.ctx.beginPath(); this.ctx.arc(-15, -80, 7, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.fillStyle = lightColor(!this.crossing.isAlarmOn); this.ctx.beginPath(); this.ctx.arc(15, -80, 7, 0, Math.PI * 2); this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#333'; this.ctx.beginPath(); this.ctx.arc(-15, -80, 7, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.beginPath(); this.ctx.arc(15, -80, 7, 0, Math.PI * 2); this.ctx.fill();
        }
        this.ctx.strokeStyle = '#F1C40F'; this.ctx.lineWidth = 6; this.ctx.beginPath(); this.ctx.moveTo(-20, -115); this.ctx.lineTo(20, -95); this.ctx.moveTo(20, -115); this.ctx.lineTo(-20, -95); this.ctx.stroke();
        this.ctx.restore();
    }

    private drawBarrier(x: number, y: number) {
        this.ctx.save(); this.ctx.translate(x - 30, y - 30); this.ctx.rotate(this.crossing.angle);
        this.ctx.fillStyle = '#F1C40F'; this.ctx.fillRect(0, -6, 140, 12);
        this.ctx.fillStyle = '#000'; for (let i = 20; i < 140; i += 40) this.ctx.fillRect(i, -6, 20, 12);
        this.ctx.restore();
    }

    private draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = this.getEnvColor('sky'); this.ctx.fillRect(0, 0, this.width, this.height);
        this.clouds.forEach(c => c.draw(this.ctx, this.env));
        this.ctx.fillStyle = this.getEnvColor('grass'); this.ctx.fillRect(0, this.skyLine, this.width, this.height - this.skyLine);
        this.ctx.fillStyle = this.getEnvColor('road'); this.ctx.fillRect(0, this.roadY, this.width, 90);
        this.ctx.strokeStyle = this.env.isNight ? '#888' : '#FFF'; this.ctx.setLineDash([30, 30]); this.ctx.lineWidth = 4;
        this.ctx.beginPath(); this.ctx.moveTo(0, this.roadY + 45); this.ctx.lineTo(this.width, this.roadY + 45); this.ctx.stroke(); this.ctx.setLineDash([]);

        const structColor = this.getEnvColor('structure');
        this.ctx.fillStyle = structColor; for (let x = 50; x < this.width; x += 250) this.ctx.fillRect(x, this.elevatedTrackY, 60, this.skyLine - this.elevatedTrackY + 50);
        this.ctx.fillStyle = structColor; this.ctx.fillRect(0, this.elevatedTrackY, this.width, 25);

        this.entities.filter(e => e.type.includes('shinkansen')).forEach(e => e.draw(this.ctx, this.env, this.frameCount));

        this.ctx.strokeStyle = structColor; this.ctx.lineWidth = 6; this.ctx.beginPath(); this.ctx.moveTo(0, this.elevatedTrackY + 5); this.ctx.lineTo(this.width, this.elevatedTrackY + 5); this.ctx.stroke();
        this.ctx.fillStyle = FIXED_COLORS.railMetal; this.ctx.fillRect(0, this.groundTrackY - 10, this.width, 80);
        this.ctx.fillStyle = this.getEnvColor('sleeper'); for (let x = 0; x < this.width; x += 30) this.ctx.fillRect(x, this.groundTrackY, 8, 60);
        this.ctx.fillStyle = FIXED_COLORS.railMetal; this.ctx.fillRect(0, this.groundTrackY + 10, this.width, 6); this.ctx.fillRect(0, this.groundTrackY + 45, this.width, 6);

        this.drawCrossingPost(this.crossing.x, this.groundTrackY - 40);
        this.entities.filter(e => !e.type.includes('shinkansen') && !['car', 'truck', 'bus', 'police', 'ambulance', 'mixer'].includes(e.type)).forEach(e => e.draw(this.ctx, this.env, this.frameCount));
        this.drawCrossingPost(this.crossing.x, this.groundTrackY + 70); this.drawBarrier(this.crossing.x, this.groundTrackY + 70);
        this.entities.filter(e => ['car', 'truck', 'bus', 'police', 'ambulance', 'mixer'].includes(e.type)).forEach(e => e.draw(this.ctx, this.env, this.frameCount));

        this.weatherParticles.forEach(p => p.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx, this.env));

        if (this.env.nightIntensity > 0.1) {
            this.ctx.fillStyle = `rgba(0, 0, 50, ${this.env.nightIntensity * 0.3})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    private loop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }
}