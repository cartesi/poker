import { Howl } from "howler";
import { GameManager } from "./GameManager";
import { GameVars } from "./GameVars";

// audiosprite --e "mp3,ogg" --o ../assets/audio/audiosprite *.mp3 --f howler
export class AudioManager {

    public static sound: Howl;
    public static themeId: number;
    public static themeVolume: number;
    public static themeKey: string;
    public static loopedSounds: { [key: string]: number; };
    public static matchingID: number;

    public static init(): void {

        AudioManager.sound.mute(GameVars.gameData.muted);
        AudioManager.loopedSounds = {};
    }

    public static mute(): void {

        if (GameVars.gameData) {
            GameVars.gameData.muted = true;
            AudioManager.sound.mute();
        }
        
    }

    public static unmute(): void {

        if (GameVars.gameData) {
            GameVars.gameData.muted = false;
            AudioManager.sound.mute(false);
        } 
    }

    public static toggleAudioState(): void {

        GameVars.gameData.muted = !GameVars.gameData.muted;
        GameManager.writeGameData();
        AudioManager.sound.mute(GameVars.gameData.muted);
    }

    public static playSound(key: string, loop?: boolean, needStop?: boolean, volume?: number): void {

        loop = loop || false;
        volume = volume || 1;

        if (loop || needStop) {
            if (!AudioManager.loopedSounds[key]) {
                let id = AudioManager.sound.play(key);
                
                if (loop) {
                    AudioManager.sound.loop(loop, id);
                }
                
                AudioManager.sound.volume(volume, id);
                AudioManager.loopedSounds[key] = id;
            }     
        } else {

            let id = AudioManager.sound.play(key);
            AudioManager.sound.loop(loop, id);
            AudioManager.sound.volume(volume, id);
        }
       
    }

    public static stopSound(key: string): void {

        // AudioManager.sound.stop(AudioManager.loopedSounds[key]);
        AudioManager.sound.fade(1, 0, 500, AudioManager.loopedSounds[key]);
        AudioManager.loopedSounds[key] = null;
    }

    public static playMatching(key: string) {

        let id = AudioManager.sound.play(key);
        AudioManager.sound.loop(true, id);
        AudioManager.matchingID = id;
    }

    public static stopMatching(): void {

        if (AudioManager.matchingID) {
            AudioManager.sound.fade(1, 0, 500, AudioManager.matchingID);
            AudioManager.matchingID = null;
        }
    }


    public static playMusic(key: string, volume?: number): void {

        if (this.themeKey === key) {
            return;
        }

        if (AudioManager.themeId) {
            AudioManager.sound.fade(this.themeVolume, 0, 1500, AudioManager.themeId);
        }

        let id = AudioManager.sound.play(key);

        volume = volume || 1;
        
        AudioManager.sound.loop(true, id);
        AudioManager.sound.volume(volume, id);
        AudioManager.sound.fade(0, volume, 3000, id);

        AudioManager.themeId = id;
        AudioManager.themeKey = key;
        AudioManager.themeVolume = volume;
    }

    public static volumeMusic(volume: number): void {

        AudioManager.sound.volume(volume, AudioManager.themeId);
    }

    public static changeRate(key: string, rate: number): void {

        AudioManager.sound.rate(rate, AudioManager.loopedSounds[key], );
    }
}