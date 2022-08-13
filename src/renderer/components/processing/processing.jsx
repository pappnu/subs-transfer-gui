import React, {useEffect, useRef} from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';

import {EditableList} from '../general/editableList';
import {SettingCheckbox} from '../general/settingCheckbox';
import {SettingTextArea} from '../general/settingTextArea';
import {Virtuoso} from 'react-virtuoso';

const booleanSettings = [
    {id: 'sushi', text: 'Run Sushi:'},
    {id: 'autoSushiArgs', text: 'Auto track selection:'},
    {id: 'mux', text: 'Mux targets:'},
    {id: 'copyFonts', text: 'Copy Fonts:'},
    {id: 'targetSubs', text: 'Include target subs:'},
];

export function Processing({
    sourcePaths,
    targetPaths,
    style,
    settings,
    changeBooleanSetting,
    changeStringSetting,
    addSources,
    removeAllSources,
    handleSourceDrop,
    removeSource,
    addTargets,
    removeAllTargets,
    handleTargetDrop,
    removeTarget,
    move,
    moveOver,
    log,
}) {
    const {setNodeRef: sourceNodeRef} = useDroppable({id: 'sourceDroppable'});
    const {setNodeRef: targetNodeRef} = useDroppable({id: 'targetDroppable'});
    const mouseSensor = useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    });
    const sensors = useSensors(mouseSensor);
    const logRef = useRef(null);
    const scrollerRef = useRef(null);

    const booleanSettingComponents = booleanSettings.map((item) => (
        <SettingCheckbox
            key={item.id}
            style={{
                container: style.layout.checkboxSettingContainer,
                text: style.settings.text,
            }}
            text={item.text}
            checked={settings[item.id]}
            onChange={() => {
                changeBooleanSetting(item.id);
            }}
        />
    ));

    const textAreaSettings = [
        {
            id: 'autoSushiAudioLanguages',
            text: 'Audio languages to seek for sushi:',
        },
        {
            id: 'autoSushiAudioNames',
            text: 'Audio names to seek for sushi:',
        },
        {
            id: 'autoSushiSubtitlesLanguages',
            text: 'Subtitle languages to seek for sushi:',
        },
        {
            id: 'autoSushiSubtitlesNames',
            text: 'Subtitle names to seek for sushi:',
        },
        {id: 'sushiArgs', text: 'Sushi extra arguments:'},
        {id: 'audioLanguages', text: 'Target audio languages to not mux:'},
    ];

    const textAreaSettingComponents = textAreaSettings.map((item) => (
        <SettingTextArea
            key={item.id}
            style={{
                container: style.layout.textSettingContainer,
                text: style.settings.text,
                textarea: style.settings.textarea,
            }}
            text={item.text}
            value={settings[item.id]}
            onChange={(event) => {
                changeStringSetting(event.target.value, item.id);
            }}
        />
    ));

    useEffect(() => {
        if (
            logRef &&
            scrollerRef &&
            document.activeElement !== scrollerRef.current
        ) {
            logRef.current.scrollToIndex({
                index: log.length - 1,
                align: 'start',
                behavior: 'auto',
            });
        }
    }, [log, logRef, scrollerRef]);

    return (
        <div style={style.layout.processingContainer}>
            <div style={style.layout.fileInputsContainer}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={move}
                    onDragOver={moveOver}>
                    <SortableContext
                        items={sourcePaths}
                        strategy={verticalListSortingStrategy}>
                        <div
                            style={style.layout.editableListContainer}
                            ref={sourceNodeRef}>
                            <EditableList
                                style={{
                                    headerContainer:
                                        style.layout.headerContainer,
                                    editableListContainer:
                                        style.layout.editableListContainer,
                                    fileButtonsContainer:
                                        style.layout.fileButtonsContainer,
                                    fileListContainer:
                                        style.layout.fileListContainer,
                                    fileListContainerDragOver:
                                        style.layout.fileListContainerDragOver,
                                    fileList: style.fileList,
                                    instructionsContainer:
                                        style.layout.instructionsContainer,
                                }}
                                header="Sources"
                                addFiles={addSources}
                                removeAll={removeAllSources}
                                handleOnDrop={handleSourceDrop}
                                files={sourcePaths}
                                remove={removeSource}
                                instructions="Drop files here"
                            />
                        </div>
                    </SortableContext>
                    <SortableContext
                        items={targetPaths}
                        strategy={verticalListSortingStrategy}>
                        <div
                            style={style.layout.editableListContainer}
                            ref={targetNodeRef}>
                            <EditableList
                                style={{
                                    headerContainer:
                                        style.layout.headerContainer,
                                    editableListContainer:
                                        style.layout.editableListContainer,
                                    fileButtonsContainer:
                                        style.layout.fileButtonsContainer,
                                    fileListContainer:
                                        style.layout.fileListContainer,
                                    fileListContainerDragOver:
                                        style.layout.fileListContainerDragOver,
                                    fileList: style.fileList,
                                    instructionsContainer:
                                        style.layout.instructionsContainer,
                                }}
                                header="Targets"
                                addFiles={addTargets}
                                removeAll={removeAllTargets}
                                handleOnDrop={handleTargetDrop}
                                files={targetPaths}
                                remove={removeTarget}
                                instructions="Drop files here"
                            />
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
            <div style={style.layout.booleanSettingsContainer}>
                {booleanSettingComponents}
            </div>
            <div style={style.layout.textSettingsContainer}>
                {textAreaSettingComponents}
            </div>
            <div style={style.layout.logContainer}>
                <Virtuoso
                    ref={logRef}
                    scrollerRef={(ref) => {
                        scrollerRef.current = ref;
                    }}
                    style={style.settings.log}
                    totalCount={log.length}
                    itemContent={(index) => (
                        <div
                            style={{
                                ...style.settings.logText,
                                ...(log[index].type === 'error'
                                    ? {color: 'rgba(190,0,0,1)'}
                                    : {}),
                            }}>
                            {log[index].value}
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
