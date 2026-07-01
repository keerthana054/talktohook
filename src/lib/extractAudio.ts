// src/lib/extractAudio.ts
//
// Extracts audio from a video buffer using the `ffmpeg-static` package,
// which bundles a precompiled ffmpeg binary and exposes it as a simple
// default string export (the path to the binary). This is compatible with
// Next.js 16's Turbopack bundler, unlike @ffmpeg-installer/ffmpeg which
// uses dynamic require() calls that Turbopack can't resolve at build time.

import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

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
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static binary not found. Make sure ffmpeg-static is installed.");
  }

  const tmpDir = os.tmpdir();
  const uniqueId = `talktohook_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const ext = path.extname(originalFileName) || ".mp4";
  const videoPath = path.join(tmpDir, `${uniqueId}${ext}`);
  const audioPath = path.join(tmpDir, `${uniqueId}.mp3`);

  await fs.writeFile(videoPath, videoBuffer);

  try {
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath!, [
        "-i", videoPath,
        "-vn",               // no video
        "-ac", "1",          // mono
        "-ar", "16000",      // 16kHz -- optimal for speech transcription
        "-ab", "32k",        // low bitrate keeps the file small
        "-f", "mp3",
        "-y",                // overwrite output if it exists
        audioPath,
      ]);

      let stderr = "";
      ffmpeg.stderr.on("data", (data) => { stderr += data.toString(); });
      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
        }
      });
      ffmpeg.on("error", (err) => {
        reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
      });
    });
  } finally {
    // Clean up the video temp file immediately.
    await fs.unlink(videoPath).catch(() => {});
  }

  return audioPath;
}

/**
 * Deletes a temp file. Call in a finally block in your route handler.
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  await fs.unlink(filePath).catch(() => {});
}