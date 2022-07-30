const fileListContainer = {
    display: 'flex',
    flexGrow: 1,
    marginRight: '4px',
    marginLeft: '4px',
    marginBottom: '4px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: 'solid',
    minHeight: '100px',
};

export default {
    processingContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#1c1c1c',
        overflow: 'auto',
        overflowX: 'auto',
    },
    fileInputsContainer: {
        display: 'flex',
        flexDirection: 'row',
    },
    fileButtonsContainer: {
        display: 'flex',
        flexDirection: 'row',
    },
    fileListContainer: {
        ...fileListContainer,
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: '1px',
    },
    fileListContainerDragOver: {
        ...fileListContainer,
        borderColor: 'rgba(64, 162, 247, 1)',
        borderWidth: '1px',
    },
    editableListContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    headerContainer: {
        display: 'flex',
        flexDirection: 'row',
        padding: '4px',
    },
    settingsContainer: {
        display: 'flex',
        flexDirection: 'column',
        margin: '4px',
    },
    booleanSettingsContainer: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: '4px',
    },
    textSettingsContainer: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: '4px',
    },
    logContainer: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        margin: '4px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.3)',
        borderWidth: '1px',
        borderStyle: 'solid',
    },
    textSettingContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minWidth: '300px',
        paddingLeft: '4px',
        paddingRight: '4px',
        paddingTop: '4px',
        paddingBottom: '4px',
    },
    checkboxSettingContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '180px',
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '4px',
        paddingBottom: '4px',
        margin: '2px',
        border: 'solid',
        borderWidth: '1px',
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    instructionsContainer: {
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
};
