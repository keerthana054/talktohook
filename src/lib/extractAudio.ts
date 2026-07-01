// We shell out to the ffmpeg CLI directly instead of using an npm wrapper
// library, because the most popular wrapper (fluent-ffmpeg) is deprecated
// and unmaintained. The ffmpeg CLI itself is extremely stable, so this is
// actually the more reliable long-term choice.
//
// IMPORTANT: this requires ffmpeg to be installed on the machine running
// this code. On your local machine:
//   - Mac:    brew install ffmpeg
//   - Windows: download from https://ffmpeg.org/download.html and add to PATH
//   - Linux:  sudo apt install ffmpeg
// On most hosting platforms (e.g. Vercel's default serverless functions)
// ffmpeg is NOT pre-installed, so this step will need extra setup when you
// deploy later (we'll handle that in Phase 4). For now, local development
// is the only target.

import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

/**
 * Extracts mono, 16kHz audio (the format Whisper-style transcription APIs
 * want) from a video file buffer, and returns the path to the resulting
 * temporary .mp3 file. Caller is responsible for deleting the temp file
 * after use (see cleanupTempFile below).
 */
export async function extractAudioFromVideo(
  videoBuffer: Buffer,
  originalFileName: string
): Promise<string> {
  const tempDir = os.tmpdir();
  const sessionId = randomUUID();
  const inputExt = path.extname(originalFileName) || ".mp4";
  const inputPath = path.join(/* turbopackIgnore: true */ tempDir, `TalkToHook-input-${sessionId}${inputExt}`);
  const outputPath = path.join(/* turbopackIgnore: true */ tempDir, `TalkToHook-audio-${sessionId}.mp3`);

  // Write the uploaded video to a temp file so ffmpeg can read it.
  await fs.writeFile(inputPath, videoBuffer);

  await new Promise<void>((resolve, reject) => {
    // -vn          drop the video stream, we only want audio
    // -ac 1        mono (smaller file, transcription doesn't need stereo)
    // -ar 16000    16kHz sample rate (standard for speech models)
    // -b:a 64k     low bitrate, keeps file small since we just need clear speech
    const ffmpeg = spawn("ffmpeg", [
      "-y", // overwrite output if it exists
      "-i", inputPath,
      "-vn",
      "-ac", "1",
      "-ar", "16000",
      "-b:a", "64k",
      outputPath,
    ]);

    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", (err) => {
      reject(new Error(`Failed to start ffmpeg. Is it installed and on your PATH? Original error: ${err.message}`));
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}. stderr:\n${stderr}`));
      }
    });
  });

  // Clean up the input file now that we have the extracted audio.
  await fs.unlink(inputPath).catch(() => {
    /* best effort, ignore if already gone */
  });

  return outputPath;
}

/** Deletes a temp file, ignoring errors if it's already gone. */
export async function cleanupTempFile(filePath: string): Promise<void> {
  await fs.unlink(filePath).catch(() => {});
}
