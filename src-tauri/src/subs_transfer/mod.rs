use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::ffi::OsStr;
use std::fs::create_dir_all;
use std::iter::once;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::{Arc, OnceLock};

use matroska::{self, Attachment, Track, Tracktype};
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncRead, BufReader};
use tokio::process::Command;
use tokio::sync::{Mutex, broadcast};
use tokio::task::JoinSet;

use crate::AppState;

struct ScoredObject<T> {
    obj: T,
    score: usize,
}

pub struct SubtitleTransfer {
    pub source: String,
    pub target: String,
    pub copy_fonts: bool,
    pub copy_target_subtitles: bool,
    pub exclude_target_audio_languages: Vec<String>,
    pub include_target_audio_languages: Vec<String>,
    pub sushi: bool,
    pub sushi_args: Vec<String>,
    pub sushi_auto_args: bool,
    pub sushi_audio_languages: Vec<String>,
    pub sushi_audio_names: Vec<String>,
    pub sushi_subtitle_languages: Vec<String>,
    pub sushi_subtitle_names: Vec<String>,
}

// impl Default for TransferOptions {
//     fn default() -> TransferOptions {
//         TransferOptions {
//
//         }
//     }
// }

impl SubtitleTransfer {
    pub async fn transfer<F: Fn(String) -> () + Send + Sync + 'static>(
        &self,
        on_message: Arc<F>,
        cancellation_token: &mut broadcast::Receiver<()>,
    ) {
        let source_path = PathBuf::from(self.source.clone());
        let target_path = PathBuf::from(self.target.clone());

        let source_metadata = match matroska::open(self.source.clone()) {
            Ok(value) => value,
            Err(err) => {
                on_message(err.to_string());
                return;
            }
        };

        let target_metadata = match matroska::open(self.target.clone()) {
            Ok(value) => value,
            Err(err) => {
                on_message(err.to_string());
                return;
            }
        };

        let mut subtitles_id: Option<u64> = None;
        let mut subtitles_suffix: String = String::from("ass");
        let mut source_audio_id: Option<u64> = None;
        let mut target_audio_id: Option<u64> = None;

        //let output_dir_path = source_path.parent().unwrap().join("output");
        //match create_dir_all(&output_dir_path) {
        //    Err(err) => {
        //        on_message(err.to_string());
        //        return;
        //    }
        //    Ok(_) => (),
        //}

        if self.sushi {
            let mut subtitle_candidates: Vec<ScoredObject<&Track>> =
                scored_tracks_of_type(&source_metadata.tracks, Tracktype::Subtitle);

            let subtitle_matchers: [Box<dyn Fn(&ScoredObject<&Track>) -> usize + Send>; 2] = [
                Box::new(|obj: &ScoredObject<&Track>| {
                    let mut scor: usize = 0;
                    for (i, name) in self.sushi_subtitle_names.iter().enumerate() {
                        match &obj.obj.name {
                            None => (),
                            Some(track_name) => {
                                if track_name.contains(name) {
                                    scor = self.sushi_subtitle_names.len() - i;
                                }
                            }
                        };
                    }
                    return scor;
                }),
                Box::new(|obj: &ScoredObject<&Track>| {
                    let mut scor: usize = 0;
                    for (i, lang) in self.sushi_subtitle_languages.iter().enumerate() {
                        match &obj.obj.language {
                            None => (),
                            Some(track_lang) => {
                                if track_lang.to_string().eq(lang) {
                                    scor = self.sushi_subtitle_languages.len() - i;
                                }
                            }
                        };
                    }
                    return scor;
                }),
            ];

            match pick_best_match(&mut subtitle_candidates, subtitle_matchers.iter()) {
                None => (),
                Some(track) => {
                    match subtitles_codec_suffixes().get(track.codec_id.as_str()) {
                        Some(value) => subtitles_suffix = String::from(*value),
                        None => (),
                    }

                    subtitles_id = Some(track.number - 1);
                }
            }

            let audio_matchers: [Box<dyn Fn(&ScoredObject<&Track>) -> usize + Send>; 2] = [
                Box::new(|obj: &ScoredObject<&Track>| {
                    let mut scor: usize = 0;
                    for (i, name) in self.sushi_audio_names.iter().enumerate() {
                        match &obj.obj.name {
                            None => (),
                            Some(track_name) => {
                                if track_name.contains(name) {
                                    scor = self.sushi_audio_names.len() - i;
                                }
                            }
                        };
                    }
                    return scor;
                }),
                Box::new(|obj: &ScoredObject<&matroska::Track>| {
                    let mut scor: usize = 0;
                    for (i, lang) in self.sushi_audio_languages.iter().enumerate() {
                        match &obj.obj.language {
                            None => (),
                            Some(track_lang) => {
                                if track_lang.to_string().eq(lang) {
                                    scor = self.sushi_audio_languages.len() - i;
                                }
                            }
                        };
                    }
                    return scor;
                }),
            ];

            let mut source_audio_candidates: Vec<ScoredObject<&Track>> =
                scored_tracks_of_type(&source_metadata.tracks, Tracktype::Audio);

            match pick_best_match(&mut source_audio_candidates, audio_matchers.iter()) {
                None => (),
                Some(track) => source_audio_id = Some(track.number - 1),
            }

            let mut target_audio_candidates: Vec<ScoredObject<&Track>> =
                scored_tracks_of_type(&target_metadata.tracks, Tracktype::Audio);

            match pick_best_match(&mut target_audio_candidates, audio_matchers.iter()) {
                None => (),
                Some(track) => target_audio_id = Some(track.number - 1),
            }

            let mut sushi_out_filename: PathBuf = target_path.clone();
            sushi_out_filename.set_extension(format!(
                "{}.sushi.{}",
                sushi_out_filename.extension().unwrap().to_str().unwrap(),
                subtitles_suffix
            ));
            let sushi_out_path = source_path
                .parent()
                .unwrap()
                .join(sushi_out_filename.file_name().unwrap().to_str().unwrap());

            let mut sushi_args: Vec<String> = vec![
                String::from("--src"),
                self.source.clone(),
                String::from("--dst"),
                self.target.clone(),
                String::from("-o"),
                String::from(sushi_out_path.to_str().unwrap()),
            ];

            match subtitles_id {
                None => (),
                Some(id) => {
                    sushi_args.extend([String::from("--src-script"), id.to_string()]);
                }
            }

            match source_audio_id {
                None => (),
                Some(id) => sushi_args.extend([String::from("--src-audio"), id.to_string()]),
            }

            match target_audio_id {
                None => (),
                Some(id) => sushi_args.extend([String::from("--dst-audio"), id.to_string()]),
            }

            sushi_args.extend(self.sushi_args.iter().cloned());

            on_message(sushi_args.join(", "));
            if !self
                .run_sushi(sushi_args, on_message.clone(), cancellation_token)
                .await
            {
                // TODO sushi error
                return;
            }
        }

        if self.copy_fonts {
            let font_mimes: &HashSet<&str> = font_mime_types();
            let source_font_attachments: Vec<(usize, &Attachment)> = source_metadata
                .attachments
                .iter()
                .enumerate()
                .filter(|(_, attachment)| font_mimes.contains(&attachment.mime_type.as_str()))
                .collect();

            if source_font_attachments.len() > 0 {
                //let mut mux_args: Vec<String> = once(String::from("--attachments"))
                //    .chain(vec![
                //        source_font_attachments
                //            .iter()
                //            .map(|(i, _)| (i + 1).to_string())
                //            .collect::<Vec<String>>()
                //            .join(","),
                //        String::from("--no-audio"),
                //        String::from("--no-video"),
                //        String::from("--no-subtitles"),
                //        String::from("--no-buttons"),
                //        String::from("--no-track-tags"),
                //        String::from("--no-chapters"),
                //        String::from("--no-global-tags"),
                //        self.source.clone(),
                //    ])
                //    .collect();

                //if self.exclude_target_audio_languages.len() > 0 {
                //    let audio_tracks_to_exclude: Vec<&matroska::Track> = target_metadata
                //        .tracks
                //        .iter()
                //        .filter(|track| {
                //            track.tracktype == matroska::Tracktype::Audio
                //                && track.language.is_some()
                //                && self
                //                    .exclude_target_audio_languages
                //                    .contains(&track.language.as_ref().unwrap().to_string())
                //        })
                //        .collect();

                //    if audio_tracks_to_exclude.len() > 0 {
                //        mux_args.extend(
                //            once(String::from("--audio-tracks")).chain(
                //                audio_tracks_to_exclude
                //                    .iter()
                //                    .map(|track| format!("!{}", track.number - 1)),
                //            ),
                //        );
                //    }
                //}

                //let mux_output_path: String = String::from(
                //    output_dir_path
                //        .join(target_path.file_name().unwrap())
                //        .iter()
                //        .collect::<PathBuf>()
                //        .to_str()
                //        .unwrap(),
                //);

                //mux_args.extend(vec![
                //    String::from("--no-attachments"),
                //    self.target.clone(),
                //    String::from("-o"),
                //    mux_output_path,
                //]);

                //on_message(mux_args.join(", "));
                //if !self
                //    .run_mkvmerge(mux_args, on_message, cancellation_token)
                //    .await
                //{
                //    // TODO mkvmerge error
                //    return;
                //};

                let fonts_output_dir_path: PathBuf = source_path.parent().unwrap().join("fonts");

                match create_dir_all(&fonts_output_dir_path) {
                    Err(err) => {
                        on_message(err.to_string());
                        return;
                    }
                    Ok(_) => (),
                }

                let extract_args: Vec<String> =
                    vec![self.source.clone(), String::from("attachments")]
                        .into_iter()
                        .chain(source_font_attachments.iter().map(|font| {
                            format!(
                                "{}:{}",
                                font.0 + 1,
                                fonts_output_dir_path.join(&font.1.name).to_str().unwrap()
                            )
                        }))
                        .collect();
                if !self
                    .run_mkvextract(extract_args, on_message, cancellation_token)
                    .await
                {
                    // TODO mkvextract error
                    return;
                }
            }
        }
    }

    async fn run_sushi<I, F: Fn(String) -> () + Send + Sync + 'static>(
        &self,
        args: I,
        on_message: Arc<F>,
        cancellation_token: &mut broadcast::Receiver<()>,
    ) -> bool
    where
        I: IntoIterator,
        I::Item: AsRef<OsStr>,
    {
        return run_command("sushi", args, on_message, cancellation_token).await;
    }

    async fn run_mkvmerge<I, F: Fn(String) -> () + Send + Sync + 'static>(
        &self,
        args: I,
        on_message: Arc<F>,
        cancellation_token: &mut broadcast::Receiver<()>,
    ) -> bool
    where
        I: IntoIterator,
        I::Item: AsRef<OsStr>,
    {
        return run_command("mkvmerge", args, on_message, cancellation_token).await;
    }

    async fn run_mkvextract<I, F: Fn(String) -> () + Send + Sync + 'static>(
        &self,
        args: I,
        on_message: Arc<F>,
        cancellation_token: &mut broadcast::Receiver<()>,
    ) -> bool
    where
        I: IntoIterator,
        I::Item: AsRef<OsStr>,
    {
        return run_command("mkvextract", args, on_message, cancellation_token).await;
    }
}

async fn run_command<I, F: Fn(String) -> () + Send + Sync + 'static>(
    program: &str,
    args: I,
    on_message: Arc<F>,
    cancellation_token: &mut broadcast::Receiver<()>,
) -> bool
where
    I: IntoIterator,
    I::Item: AsRef<OsStr>,
{
    let command = Command::new(program)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .args(args)
        .kill_on_drop(true)
        .spawn();
    return match command {
        Ok(mut child) => {
            let stdout = child.stdout.take().unwrap();
            let stderr = child.stderr.take().unwrap();

            let mut set = JoinSet::new();
            set.spawn(read_stream(stdout, on_message.clone()));
            set.spawn(read_stream(stderr, on_message.clone()));

            return tokio::select! {
                _ = cancellation_token.recv() => {
                    match child.kill().await {
                        Ok(_) => (),
                        Err(err) => {on_message(err.to_string())}
                    }
                    set.abort_all();
                    false
                },
                result = child.wait() => {
                    set.join_all().await;
                    matches!(result, Ok(status) if status.success())
                },
            };
        }
        Err(err) => {
            on_message(err.to_string());
            false
        }
    };
}

async fn read_stream<R, F: Fn(String) -> ()>(readable: R, on_read: Arc<F>)
where
    R: AsyncRead + Unpin,
{
    let reader = BufReader::new(readable);
    let mut lines = reader.lines();
    while let Ok(Some(line)) = lines.next_line().await {
        on_read(line);
    }
}

fn scored_tracks_of_type(
    tracks: &Vec<matroska::Track>,
    track_type: matroska::Tracktype,
) -> Vec<ScoredObject<&matroska::Track>> {
    return tracks
        .iter()
        .filter(|track| track.tracktype == track_type)
        .map(|track| ScoredObject {
            obj: track,
            score: 0,
        })
        .collect();
}

fn score<T, F: Fn(&ScoredObject<T>) -> usize>(objs: &mut Vec<ScoredObject<T>>, predicate: F) {
    for obj in objs {
        obj.score = predicate(obj);
    }
}

fn score_and_sort_descending<T, F: Fn(&ScoredObject<T>) -> usize>(
    objs: &mut Vec<ScoredObject<T>>,
    predicate: F,
) {
    score(objs, predicate);
    objs.sort_by(|a, b| b.score.cmp(&a.score));
    for obj in objs {
        obj.score = 0;
    }
}

fn pick_best_match<T, F: Fn(&ScoredObject<T>) -> usize, I: Iterator<Item = F>>(
    objs: &mut Vec<ScoredObject<T>>,
    predicates: I,
) -> Option<&mut T> {
    if objs.len() > 0 {
        for predicate in predicates {
            score_and_sort_descending(objs, predicate);
        }
        return Some(&mut objs[0].obj);
    }
    return None;
}

fn font_mime_types() -> &'static HashSet<&'static str> {
    static MAP: OnceLock<HashSet<&str>> = OnceLock::new();
    return MAP.get_or_init(|| {
        HashSet::from([
            "application/x-truetype-font",
            "application/vnd.ms-opentype",
            "application/vnd.ms-fontobject",
            "application/x-font-ttf",
            "application/x-font-truetype",
            "application/x-font-opentype",
            "font/sfnt",
            "font/otf",
            "font/ttf",
            "font/woff",
            "font/woff2",
        ])
    });
}

fn subtitles_codec_suffixes() -> &'static HashMap<&'static str, &'static str> {
    static MAP: OnceLock<HashMap<&str, &str>> = OnceLock::new();
    return MAP.get_or_init(|| HashMap::from([("S_TEXT/ASS", "ass"), ("S_TEXT/UTF8", "srt")]));
}

#[tauri::command]
pub async fn transfer_subtitles(
    app_handle: AppHandle,
    state: State<'_, Mutex<AppState>>,
    source_path: String,
    target_path: String,
    copy_fonts: bool,
    copy_target_subtitles: bool,
    exclude_target_audio_languages: Vec<String>,
    include_target_audio_languages: Vec<String>,
    sushi: bool,
    sushi_args: Vec<String>,
    sushi_auto_args: bool,
    sushi_audio_languages: Vec<String>,
    sushi_audio_names: Vec<String>,
    sushi_subtitle_languages: Vec<String>,
    sushi_subtitle_names: Vec<String>,
) -> Result<(), String> {
    let (tx, mut rx) = broadcast::channel::<()>(1);
    let mut rx2 = rx.resubscribe();
    let mut state_lock = state.lock().await;
    match state_lock.subs_transfer_cancellation {
        Some(_) => return Err("A transfer is already active".to_string()),
        None => {
            state_lock.subs_transfer_cancellation = Some(tx);
        }
    };
    drop(state_lock);

    let transfer_opts = SubtitleTransfer {
        source: source_path,
        target: target_path,
        copy_fonts,
        copy_target_subtitles,
        exclude_target_audio_languages,
        include_target_audio_languages,
        sushi,
        sushi_args,
        sushi_auto_args,
        sushi_audio_languages,
        sushi_audio_names,
        sushi_subtitle_languages,
        sushi_subtitle_names,
    };

    tokio::select! {
        _ = rx.recv() => {return Err("Transfer canceled".to_string());},
        _ = transfer_opts
        .transfer(
            Arc::new(move |msg| app_handle.emit("transfer-status", msg).unwrap()),
            &mut rx2,
        ) => ()
    }

    let mut state_lock = state.lock().await;
    match state_lock.subs_transfer_cancellation {
        Some(_) => {
            state_lock.subs_transfer_cancellation = None;
        }
        None => (),
    };

    return Ok(());
}

#[tauri::command]
pub async fn cancel_transfer(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    let mut state_lock = state.lock().await;
    match &state_lock.subs_transfer_cancellation {
        Some(value) => {
            let _ = value.send(());
            state_lock.subs_transfer_cancellation = None;
        }
        None => (),
    };
    return Ok(());
}
