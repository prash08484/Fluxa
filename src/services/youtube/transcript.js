/**
 * YouTube transcript fetcher.
 *
 * Uses the public caption track (no API key). Two known limitations to be
 * honest about:
 *   1. Videos without captions / with captions disabled → throws.
 *   2. YouTube changes their internal HTML occasionally and the scraper can
 *      break for days at a time. UI must offer a "paste transcript manually"
 *      fallback.
 *
 * No retries here. Caller (the API route) decides what to do on failure.
 */

import { YoutubeTranscript } from "youtube-transcript";

const URL_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;

export function isYouTubeUrl(s) {
  return URL_RE.test(s ?? "");
}

/**
 * Fetch + concatenate transcript for a YouTube URL.
 * Returns { transcript, segmentCount, languages? }.
 * Throws on any failure — message is suitable for surfacing to the user.
 */
export async function fetchYouTubeTranscript(url) {
  if (!isYouTubeUrl(url)) {
    throw new Error("Not a YouTube URL.");
  }

  let segments;
  try {
    segments = await YoutubeTranscript.fetchTranscript(url);
  } catch (err) {
    // Normalise the library's named errors into friendly messages.
    const name = err?.constructor?.name ?? "";
    if (name.includes("Disabled")) {
      throw new Error("This video has captions disabled. Paste the transcript manually instead.");
    }
    if (name.includes("Unavailable")) {
      throw new Error("Video unavailable or private. Check the URL is correct.");
    }
    if (name.includes("NotAvailable") && name.includes("Language")) {
      throw new Error("No transcript available in a supported language.");
    }
    if (name.includes("TooManyRequest")) {
      throw new Error("YouTube rate-limited the request. Try again in a minute.");
    }
    throw new Error(`Couldn't fetch transcript: ${err?.message ?? err}`);
  }

  if (!segments || segments.length === 0) {
    throw new Error("Transcript came back empty.");
  }

  const transcript = segments.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim();
  return {
    transcript,
    segmentCount: segments.length,
  };
}
