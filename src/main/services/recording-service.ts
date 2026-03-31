import { PvRecorder } from "@picovoice/pvrecorder-node";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import log from "electron-log";

export class RecordingService {
  private recorder: PvRecorder | null = null;
  private isRecording = false;
  private audioFrames: Int16Array[] = [];
  private silenceThreshold = 500;
  private silenceDuration = 0;
  private maxSilenceDuration = 5000; // 5 seconds of silence
  private shouldStop = false;

  setSilenceThreshold(value: number): void {
    this.silenceThreshold = value;
    log.info(`Silence threshold updated to ${value}`);
  }

  async startRecording(): Promise<string> {
    if (this.isRecording) {
      throw new Error("Already recording");
    }

    log.info("Starting audio recording...");
    this.audioFrames = [];
    this.silenceDuration = 0;
    this.isRecording = true;

    try {
      // Initialize recorder with 512 frame length (good for voice)
      this.recorder = new PvRecorder(512, -1);
      this.recorder.start();

      // Record until silence or manual stop
      while (this.isRecording && !this.shouldStop) {
        const frame = await this.recorder.read();
        this.audioFrames.push(frame);

        // Check for silence
        const maxAmplitude = Math.max(...Array.from(frame).map(Math.abs));
        
        if (maxAmplitude < this.silenceThreshold) {
          this.silenceDuration += 32; // Approx ms per frame
          
          if (this.silenceDuration >= this.maxSilenceDuration) {
            log.info("5 seconds of silence detected, stopping recording");
            break;
          }
        } else {
          this.silenceDuration = 0;
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      
      if (this.shouldStop) {
        log.info("Recording stopped by user (Escape key)");
      }

      // Save to WAV file
      const audioPath = await this.saveAudio();
      log.info(`Audio saved to: ${audioPath}`);
      
      return audioPath;
    } catch (error) {
      log.error("Error during recording:", error);
      throw error;
    } finally {
      this.stop();
    }
  }

  stop(): void {
    if (!this.isRecording) return;

    log.info("Stopping recording...");
    this.isRecording = false;
    this.shouldStop = false; // Reset for next recording

    if (this.recorder) {
      this.recorder.stop();
      this.recorder.release();
      this.recorder = null;
    }
  }

  forceStop(): void {
    log.info("Force stopping recording via escape key");
    this.shouldStop = true;
  }

  private async saveAudio(): Promise<string> {
    // Create data directory if it doesn't exist
    const dataDir = path.join(app.getPath("userData"), "recordings");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Generate filename
    const filename = `recording_${Date.now()}.wav`;
    const filepath = path.join(dataDir, filename);

    // Combine all frames
    const totalLength = this.audioFrames.reduce((acc, frame) => acc + frame.length, 0);
    const combinedAudio = new Int16Array(totalLength);
    let offset = 0;
    
    for (const frame of this.audioFrames) {
      combinedAudio.set(frame, offset);
      offset += frame.length;
    }

    // Create WAV file
    const wavBuffer = this.createWavBuffer(combinedAudio, 16000); // 16kHz sample rate
    fs.writeFileSync(filepath, Buffer.from(wavBuffer));

    return filepath;
  }

  private createWavBuffer(audioData: Int16Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // Audio format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(36, "data");
    view.setUint32(40, audioData.length * 2, true);

    // Audio data
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      view.setInt16(offset, audioData[i], true);
      offset += 2;
    }

    return buffer;
  }
}
