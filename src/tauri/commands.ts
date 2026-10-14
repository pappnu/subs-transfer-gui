import { invoke } from "@tauri-apps/api/core";

export interface TransferSubtitlesArgs {
  sourcePath: string;
  targetPath: string;
  copyFonts: boolean;
  copyTargetSubtitles: boolean;
  excludeTargetAudioLanguages: string[];
  includeTargetAudioLanguages: string[];
  sushi: boolean;
  sushiArgs: string[];
  sushiAutoArgs: boolean;
  sushiAudioLanguages: string[];
  sushiAudioNames: string[];
  sushiSubtitleLanguages: string[];
  sushiSubtitleNames: string[];
}

export async function transferSubtitles(options: TransferSubtitlesArgs) {
  const res = await invoke("transfer_subtitles", { ...options });
  console.log("command res:", res);
}

export async function cancelTransfer() {
  await invoke("cancel_transfer");
}
