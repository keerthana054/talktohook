// src/lib/extractAudio.ts
//
// Extracts audio from a video buffer using fluent-ffmpeg + the bundled
// ffmpeg binary from @ffmpeg-installer/ffmpeg. This replaces the original
// version that shelled out to a system `ffmpeg` binary, which isn't
// available on Vercel's serverless functions.
//
// The npm package bundles a precompiled ffmpeg binary for each platform
// (Linux x64 for Vercel, macOS arm64/x64 for local dev) and exposes its
// path via ffmpegInstaller.path -- fluent-ffmpeg then uses that path
// instead of looking for ffmpeg on $PATH.

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

// Point fluent-ffmpeg at the bundled binary, not the system one.
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Takes a raw video buffer, writes it to a temp file, extracts audio as
 * a mono 16kHz mp3 (small and cheap for transcription), and returns the
 * path to the audio temp file.
 *
 * Always call cleanupTempFile() on the returned path in a finally block.
 */
export async function extractAudioFromVideo(
  videoBuffer: Buffer,
  originalFileName: string
): Promise<string> {
  const tmpDir = os.tmpdir();
  const uniqueId = `talktohook_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Write the incoming video buffer to a temp file so ffmpeg can read it.
  const ext = path.extname(originalFileName) || ".mp4";
  const videoPath = path.join(tmpDir, `${uniqueId}${ext}`);
  const audioPath = path.join(tmpDir, `${uniqueId}.mp3`);

  await fs.writeFile(videoPath, videoBuffer);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioChannels(1)        // mono
        .audioFrequency(16000)   // 16kHz -- optimal for speech transcription
        .audioBitrate("32k")     // low bitrate keeps the file small
        .format("mp3")
        .on("error", (err) => reject(new Error(`ffmpeg error: ${err.message}`)))
        .on("end", () => resolve())
        .save(audioPath);
    });
  } finally {
    // Clean up the video temp file immediately -- we only need the audio.
    await fs.unlink(videoPath).catch(() => {});
  }

  return audioPath;
}

/**
 * Deletes a temp file created by extractAudioFromVideo. Call this in a
 * finally block in your route handler so it always runs even if the
 * transcription or hook generation fails.
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  await fs.unlink(filePath).catch(() => {
    // Silently ignore -- if the file was already cleaned up or never
    // created, there's nothing useful to do here.
  });
}