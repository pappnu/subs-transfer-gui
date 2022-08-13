const {spawn, execFile} = require('child_process');
const fs = require('fs');
const path = require('path');

const util = require('util');
const promisifiedExecFile = util.promisify(execFile);

const fontMIMETypes = [
    'application/x-truetype-font',
    'application/vnd.ms-opentype',
    'application/vnd.ms-fontobject',
    'application/x-font-ttf',
    'application/x-font-truetype',
    'application/x-font-opentype',
    'font/sfnt',
    'font/otf',
    'font/ttf',
    'font/woff',
    'font/woff2',
];

class MkvProcess {
    constructor(source, target) {
        this.source = source;
        this.target = target;

        this.abort = false;
    }

    abortProcess = () => {
        this.abort = true;
        if (this.childProcess) {
            this.childProcess.kill();
        }
    };

    sushiShift = async (
        extra_args = [],
        onData = (data) => {},
        onClose = (code) => {},
        sushiExecutable = 'sushi',
    ) => {
        this.abort = false;

        const executableParts = sushiExecutable.trim().split(' ');

        let argumentList =
            executableParts.length > 1 ? executableParts.slice(1) : [];
        argumentList.push('--src');
        argumentList.push(this.source);
        argumentList.push('--dst');
        argumentList.push(this.target);
        argumentList = argumentList.concat(extra_args);

        this.childProcess = spawn(sushiExecutable, argumentList);
        this.childProcess.stdout.on('data', (data) =>
            onData({type: 'error', value: data.toString()}),
        );
        this.childProcess.stderr.on('data', (data) =>
            onData({type: 'log', value: data.toString()}),
        );
        this.childProcess.on('close', onClose);
    };

    execMkvMerge = async (
        outputName,
        argumentList,
        onData = (data) => {},
        onClose = (code) => {},
        mkvMergeExecutable = 'mkvmerge',
    ) => {
        this.abort = false;

        let args = [];
        args.push('-o');
        args.push(outputName);
        args = args.concat(argumentList);

        this.childProcess = spawn(mkvMergeExecutable, args);
        this.childProcess.stdout.on('data', (data) =>
            onData({type: 'log', value: data.toString()}),
        );
        this.childProcess.stderr.on('data', (data) =>
            onData({type: 'error', value: data.toString()}),
        );
        this.childProcess.on('close', onClose);
    };

    processMkvs = async (
        settings,
        dataCallback,
        exitCallback,
        sushiExecutable = 'sushi',
        mkvMergeExecutable = 'mkvmerge',
    ) => {
        this.abort = false;

        let argumentList = [];
        let outputName = path.join(
            path.dirname(this.target),
            'output',
            path.basename(this.target),
        );

        let sourceAudioId;
        let sourceSubtitlesId;
        let targetAudioId;

        try {
            const sourceMkvInfo = await retrieveMkvInfo(
                this.source,
                true,
                mkvMergeExecutable,
            );
            const targetMkvInfo = await retrieveMkvInfo(
                this.target,
                true,
                mkvMergeExecutable,
            );

            if (settings.sushi && settings.autoSushiArgs) {
                const audioParams = settings.autoSushiAudio;
                const subtitlesParams = settings.autoSushiSubtitles;

                const audioLanguages = stringToList(audioParams.languages);
                const audioNames = stringToList(audioParams.names);
                const subtitlesLanguages = stringToList(
                    subtitlesParams.languages,
                );
                const subtitlesNames = stringToList(subtitlesParams.names);

                sourceAudioId = Math.min(
                    ...listIds(sourceMkvInfo.tracks, (item) => {
                        return (
                            item.type === 'audio' &&
                            audioLanguages.some((lang) =>
                                item.properties.language
                                    .toLowerCase()
                                    .includes(lang.toLowerCase()),
                            ) &&
                            (audioNames.length > 0 && item.properties.track_name
                                ? audioNames.some((name) =>
                                      item.properties.track_name
                                          .toLowerCase()
                                          .includes(name.toLowerCase()),
                                  )
                                : true)
                        );
                    }),
                );
                if (sourceAudioId === Infinity) {
                    sourceAudioId = undefined;
                }
                sourceSubtitlesId = Math.min(
                    ...listIds(sourceMkvInfo.tracks, (item) => {
                        return (
                            item.type === 'subtitles' &&
                            subtitlesLanguages.some((lang) =>
                                item.properties.language
                                    .toLowerCase()
                                    .includes(lang.toLowerCase()),
                            ) &&
                            (subtitlesNames.length > 0 &&
                            item.properties.track_name
                                ? subtitlesNames.some((name) =>
                                      item.properties.track_name
                                          .toLowerCase()
                                          .includes(name.toLowerCase()),
                                  )
                                : true)
                        );
                    }),
                );
                if (sourceSubtitlesId === Infinity) {
                    sourceSubtitlesId = undefined;
                }

                targetAudioId = Math.min(
                    ...listIds(targetMkvInfo.tracks, (item) => {
                        return (
                            item.type === 'audio' &&
                            audioLanguages.some((lang) =>
                                item.properties.language
                                    .toLowerCase()
                                    .includes(lang.toLowerCase()),
                            ) &&
                            (audioNames.length > 0 && item.properties.track_name
                                ? audioNames.some((name) =>
                                      item.properties.track_name
                                          .toLowerCase()
                                          .includes(name.toLowerCase()),
                                  )
                                : true)
                        );
                    }),
                );
                if (targetAudioId === Infinity) {
                    targetAudioId = undefined;
                }
            }

            if (settings.mux) {
                // TODO: Copy and rename subtitles from source directories
                //if (
                //    'subDirCopy' in settings &&
                //    fs.lstatSync(this.source).isDirectory()
                //) {
                //    let subs = await fs.promises.readdir(this.source);
                //    subs = subs.filter(
                //        (file) =>
                //            path.extname(file) === '.ass' ||
                //            path.extname(file) === '.srt',
                //    );
                //    subs = subs.map((file) => path.join(attachmentsPath, file));
                //
                //    for (let i = 0; i < subs.length; i++) {
                //        let dest = path.join(
                //            workDirectory,
                //            path
                //                .basename(subs[i])
                //                .substr(
                //                    0,
                //                    path.basename(subs[i]).lastIndexOf('.') + 1,
                //                ) +
                //                i +
                //                '.ass',
                //        );
                //        fs.copyFile(subs[i], dest);
                //    }
                //}

                // Copy fonts from subtitle source mkv or folder
                let fontArguments = [];
                if (settings.copyFonts) {
                    if (fs.lstatSync(this.source).isFile()) {
                        let sourceFontAttachmentIds = listIds(
                            sourceMkvInfo.attachments,
                            (item) => {
                                return fontMIMETypes.find(
                                    (font) => item.content_type === font,
                                );
                            },
                        );

                        if (sourceFontAttachmentIds.length > 0) {
                            fontArguments.push('--attachments');
                            fontArguments.push(
                                sourceFontAttachmentIds.join(','),
                            );

                            fontArguments.push('--no-audio');
                            fontArguments.push('--no-video');
                            fontArguments.push('--no-subtitles');
                            fontArguments.push('--no-buttons');
                            fontArguments.push('--no-track-tags');
                            fontArguments.push('--no-chapters');
                            fontArguments.push('--no-global-tags');

                            fontArguments.push(this.source);
                        }
                    } else {
                        let attachmentsPath = path.join(
                            this.source,
                            'attachments',
                        );
                        let fonts = await fs.promises.readdir(attachmentsPath);
                        fonts = fonts.filter(
                            (file) =>
                                path.extname(file) === '.ttf' ||
                                path.extname(file) === '.otf' ||
                                path.extname(file) === '.TTF' ||
                                path.extname(file) === '.OTF',
                        );
                        fonts = fonts.map((file) =>
                            path.join(attachmentsPath, file),
                        );

                        for (let font of fonts) {
                            fontArguments.push('--attachment-mime-type');
                            fontArguments.push('application/x-truetype-font');
                            fontArguments.push('--attach-file');
                            fontArguments.push(font);
                        }
                    }
                }

                // Don't copy excluded audio languages from the input
                let audioTrackArguments = [];
                if (targetMkvInfo && settings.audioLanguages) {
                    const excludeLanguages = settings.audioLanguages
                        .split(',')
                        .map((item) => item.trim());
                    let audioTrackIds = listIds(
                        targetMkvInfo.tracks,
                        (item) => {
                            return (
                                item.type === 'audio' &&
                                excludeLanguages.includes(
                                    item.properties.language,
                                )
                            );
                        },
                    );
                    if (audioTrackIds.length > 0) {
                        audioTrackArguments.push('--audio-tracks');
                        audioTrackArguments.push('!' + audioTrackIds.join(','));
                    }
                }

                if (
                    fontArguments.length > 0 ||
                    audioTrackArguments.length > 0
                ) {
                    argumentList = argumentList.concat(fontArguments);
                    argumentList = argumentList.concat(audioTrackArguments);

                    if (!settings.targetSubs) {
                        // Don't copy existing subtitles from the input
                        argumentList.push('--no-subtitles');

                        // Don't copy existing fonts from the input
                        let inputFontAttachmentIds = listIds(
                            targetMkvInfo.attachments,
                            (item) => {
                                return fontMIMETypes.find(
                                    (font) => item.content_type === font,
                                );
                            },
                        );
                        if (inputFontAttachmentIds.length > 0) {
                            argumentList.push('--attachments');
                            argumentList.push(
                                '!' + inputFontAttachmentIds.join(','),
                            );
                        }
                    }

                    // File specific arguments have to be specified before the file itself
                    argumentList.push(this.target);
                }
            }
        } catch (error) {
            console.error(error);
        }

        console.log('argument list', argumentList);

        console.log('Sushi audio track', sourceAudioId);
        console.log('Sushi subtitle track', sourceSubtitlesId);
        console.log('Sushi destination audio track', targetAudioId);

        let sushiArgs = [];
        if (sourceAudioId) {
            sushiArgs.push('--src-audio');
            sushiArgs.push(sourceAudioId.toString());
        }
        if (sourceSubtitlesId) {
            sushiArgs.push('--src-script');
            sushiArgs.push(sourceSubtitlesId.toString());
        }
        if (targetAudioId) {
            sushiArgs.push('--dst-audio');
            sushiArgs.push(targetAudioId);
        }
        if (settings.sushiArgs) {
            sushiArgs = sushiArgs.concat(settings.sushiArgs.split(' '));
        }
        const sushiOutPath = path.join(
            path.dirname(this.target),
            'output',
            path.basename(this.target) + '.sushi.ass',
        );
        // TODO create only directory
        fs.closeSync(fs.openSync(sushiOutPath, 'w'));
        sushiArgs.push(
            `-o ${path.join(
                path.dirname(this.target),
                'output',
                path.basename(this.target) + '.sushi.ass',
            )}`,
        );

        if (
            fs.lstatSync(this.source).isFile() &&
            settings.sushi &&
            !this.abort
        ) {
            this.sushiShift(
                sushiArgs,
                dataCallback,
                (sushiCode) => {
                    if (sushiCode) {
                        dataCallback({
                            type: 'error',
                            value: `Sushi errored with source "${this.source}" and target "${this.target}"`,
                        });
                    }
                    if (!sushiCode && argumentList.length > 0 && !this.abort) {
                        this.execMkvMerge(
                            outputName,
                            argumentList,
                            dataCallback,
                            (mergeCode) => {
                                if (mergeCode) {
                                    dataCallback({
                                        type: 'error',
                                        value: `MKV Merge errored with source "${this.source}" and target "${this.target}"`,
                                    });
                                }
                                exitCallback(sushiCode, mergeCode);
                            },
                            mkvMergeExecutable,
                        );
                    } else {
                        exitCallback(sushiCode, undefined);
                    }
                },
                sushiExecutable,
            );
        } else if (
            fs.lstatSync(this.source).isFile() &&
            argumentList.length > 0 &&
            !this.abort
        ) {
            this.execMkvMerge(
                outputName,
                argumentList,
                dataCallback,
                (mergeCode) => {
                    if (mergeCode) {
                        dataCallback({
                            type: 'error',
                            value: `MKV Merge errored with source "${this.source}" and target "${this.target}"`,
                        });
                    }
                    exitCallback(undefined, mergeCode);
                },
                mkvMergeExecutable,
            );
        } else {
            exitCallback(undefined, undefined);
        }
    };
}

async function retrieveMkvInfo(
    mkv,
    json = true,
    mkvMergeExecutable = 'mkvmerge',
) {
    let format = 'json';
    if (!json) {
        format = 'text';
    }

    let out;
    try {
        // stderr also available
        const {stdout} = await promisifiedExecFile(
            mkvMergeExecutable,
            ['--identify', mkv, '--identification-format', format],
            {maxBuffer: 5242880},
        ); // 5 MB, process is killed if output exceeds this

        if (json) {
            out = JSON.parse(stdout);
        }
    } catch (error) {
        console.error(error);
    }

    return out;
}

function listIds(list, filter) {
    let filtered = list.filter(filter);

    return filtered.map((item) => {
        return item.id;
    });
}

// async function listFiles(directory, filter = () => true, pathExtension = '') {
//     let files = await fs.promises.readdir(path.normalize(directory));
//     files = files.map((file) => path.join(directory, file, pathExtension));
//     files = files.filter(filter);
//     files.sort(naturalSort);
//     return files;
// }

function stringToList(list, separator = ',') {
    return list.split(separator).map((item) => item.trim());
}

module.exports = {
    MkvProcess,
};
