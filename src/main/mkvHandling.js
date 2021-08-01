const {spawn, execFile} = require('child_process');
const fs = require('fs');
const path = require('path');

const util = require('util');
const promisifiedExecFile = util.promisify(execFile);

module.exports = {
    sushiShift,
    execMkvMerge,
    processMkvs,
};

async function sushiShift(
    source,
    target,
    extra_args = [],
    onData = (data) => {},
    onClose = (code) => {},
    sushiExecutable = 'sushi',
) {
    let argumentList = [];
    argumentList.push('--src');
    argumentList.push(source);
    argumentList.push('--dst');
    argumentList.push(target);
    argumentList = argumentList.concat(extra_args);

    const childProcess = spawn(sushiExecutable, argumentList);
    childProcess.stdout.on('data', onData);
    childProcess.stderr.on('data', onData);
    childProcess.on('close', onClose);
}

async function execMkvMerge(
    outputName,
    argumentList,
    onData = (data) => {},
    onClose = (code) => {},
    mkvMergeExecutable = 'mkvmerge',
) {
    let args = [];
    args.push('-o');
    args.push(outputName);
    args = args.concat(argumentList);

    const childProcess = spawn(mkvMergeExecutable, args);
    childProcess.stdout.on('data', onData);
    childProcess.stderr.on('data', onData);
    childProcess.on('close', onClose);
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
        const {stdout, stderr} = await promisifiedExecFile(mkvMergeExecutable, [
            '--identify',
            mkv,
            '--identification-format',
            format,
        ], {maxBuffer: 5242880}); // 5 MB, process is killed if output exceeds this

        if (json) {
            out = JSON.parse(stdout);
        }
    } catch (error) {
        console.log(error);
    }

    return out;
}

function listIds(list, filter) {
    let filtered = list.filter(filter);

    return filtered.map((item) => {
        return item.id;
    });
}

async function listFiles(directory, filter = () => true, pathExtension = '') {
    let files = await fs.promises.readdir(path.normalize(directory));
    files = files.map((file) => path.join(directory, file, pathExtension));
    files = files.filter(filter);
    files.sort(naturalSort);
    return files;
}

async function processMkvs(
    source,
    target,
    settings,
    dataCallback,
    exitCallback,
    sushiExecutable = 'sushi',
    mkvMergeExecutable = 'mkvmerge',
) {
    let argumentList = [];
    let outputName = path.join(
        path.dirname(target),
        'output',
        path.basename(target, path.extname(target)) + path.extname(target),
    );

    let sourceAudioId;
    let sourceSubtitlesId;
    let targetAudioId;

    try {
        const sourceMkvInfo = await retrieveMkvInfo(
            source,
            true,
            mkvMergeExecutable,
        );
        const targetMkvInfo = await retrieveMkvInfo(
            target,
            true,
            mkvMergeExecutable,
        );

        console.log(JSON.stringify(sourceMkvInfo, null, 2));

        if (settings.sushi && settings.autoSushiArgs) {
            const audioParams = JSON.parse(settings.autoSushiAudio);
            const subtitlesParams = JSON.parse(settings.autoSushiSubtitles);

            sourceAudioId = Math.min(
                ...listIds(sourceMkvInfo.tracks, (item) => {
                    return item.type === 'audio' &&
                        audioParams.languages.some((lang) =>
                            item.properties.language.toLowerCase().includes(lang.toLowerCase()),
                        ) &&
                        (audioParams.names.length > 0
                            ? audioParams.names.some((name) =>
                                  item.properties.track_name.toLowerCase().includes(name.toLowerCase()),
                              )
                            : true);
                }),
            );
            if (sourceAudioId === Infinity) {
                sourceAudioId = undefined;
            }
            sourceSubtitlesId = Math.min(
                ...listIds(sourceMkvInfo.tracks, (item) => {
                    return item.type === 'subtitles' &&
                        subtitlesParams.languages.some((lang) =>
                            item.properties.language.toLowerCase().includes(lang.toLowerCase()),
                        ) &&
                        (subtitlesParams.names.length > 0
                            ? subtitlesParams.names.some((name) =>
                                  item.properties.track_name.toLowerCase().includes(name.toLowerCase()),
                              )
                            : true);
                }),
            );
            if (sourceSubtitlesId === Infinity) {
                sourceSubtitlesId = undefined;
            }

            targetAudioId = Math.min(
                ...listIds(targetMkvInfo.tracks, (item) => {
                    return item.type === 'audio' &&
                        audioParams.languages.some((lang) =>
                            item.properties.language.toLowerCase().includes(lang.toLowerCase()),
                        ) &&
                        (audioParams.names.length > 0
                            ? audioParams.names.some((name) =>
                                  item.properties.track_name.toLowerCase().includes(name.toLowerCase()),
                              )
                            : true);
                }),
            );
            if (targetAudioId === Infinity) {
                targetAudioId = undefined;
            }
        }

        if (settings.mux) {
            // TODO: Copy and rename subtitles from source directories
            if (
                'subDirCopy' in settings &&
                fs.lstatSync(source).isDirectory()
            ) {
                let subs = await fs.promises.readdir(source);
                subs = subs.filter(
                    (file) =>
                        path.extname(file) === '.ass' ||
                        path.extname(file) === '.srt',
                );
                subs = subs.map((file) => path.join(attachmentsPath, file));

                for (let i = 0; i < subs.length; i++) {
                    let dest = path.join(
                        workDirectory,
                        path
                            .basename(subs[i])
                            .substr(
                                0,
                                path.basename(subs[i]).lastIndexOf('.') + 1,
                            ) +
                            i +
                            '.ass',
                    );
                    fs.copyFile(subs[i], dest);
                }
            }

            // Copy fonts from subtitle source mkv or folder
            let fontArguments = [];
            if (settings.copyFonts) {
                if (fs.lstatSync(source).isFile()) {
                    let sourceFontAttachmentIds = listIds(
                        sourceMkvInfo.attachments,
                        (item) => {
                            return [
                                'application/x-truetype-font',
                                'application/vnd.ms-opentype',
                                'application/x-font-ttf',
                                'application/x-font-opentype',
                            ].find((font) => item.content_type === font);
                        },
                    );

                    if (sourceFontAttachmentIds.length > 0) {
                        fontArguments.push('--attachments');
                        fontArguments.push(sourceFontAttachmentIds.join(','));

                        fontArguments.push('--no-audio');
                        fontArguments.push('--no-video');
                        fontArguments.push('--no-subtitles');
                        fontArguments.push('--no-buttons');
                        fontArguments.push('--no-track-tags');
                        fontArguments.push('--no-chapters');
                        fontArguments.push('--no-global-tags');

                        fontArguments.push(source);
                    }
                } else {
                    let attachmentsPath = path.join(source, 'attachments');
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
                let audioTrackIds = listIds(targetMkvInfo.tracks, (item) => {
                    return (
                        item.type === 'audio' &&
                        excludeLanguages.includes(item.properties.language)
                    );
                });
                if (audioTrackIds.length > 0) {
                    audioTrackArguments.push('--audio-tracks');
                    audioTrackArguments.push('!' + audioTrackIds.join(','));
                }
            }

            if (fontArguments.length > 0 || audioTrackArguments.length > 0) {
                argumentList = argumentList.concat(fontArguments);
                argumentList = argumentList.concat(audioTrackArguments);

                if (!settings.targetSubs) {
                    // Don't copy existing subtitles from the input
                    argumentList.push('--no-subtitles');

                    // Don't copy existing fonts from the input
                    let inputFontAttachmentIds = listIds(
                        targetMkvInfo.attachments,
                        (item) => {
                            return (
                                item.content_type ===
                                'application/x-truetype-font'
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
                argumentList.push(target);
            }
        }
    } catch (error) {
        console.log(error);
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
        sushiArgs = settings.sushiArgs.split(' ');
    }

    if (fs.lstatSync(source).isFile() && settings.sushi) {
        sushiShift(
            source,
            target,
            sushiArgs,
            dataCallback,
            (sushiCode) => {
                console.log('sushi exit code: ', sushiCode);
                if (!sushiCode && argumentList.length > 0) {
                    execMkvMerge(
                        outputName,
                        argumentList,
                        dataCallback,
                        (mergeCode) => {
                            console.log('MKVMerge exit code: ', mergeCode);
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
    } else if (fs.lstatSync(source).isFile() && argumentList.length > 0) {
        execMkvMerge(
            outputName,
            argumentList,
            dataCallback,
            (mergeCode) => {
                console.log('MKVMerge exit code: ', mergeCode);
                exitCallback(undefined, mergeCode);
            },
            mkvMergeExecutable,
        );
    } else {
        exitCallback(undefined, undefined);
    }
}
