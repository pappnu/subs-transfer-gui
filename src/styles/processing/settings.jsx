const buttonShared = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    color: 'rgba(255,255,255,0.87)',
    fontSize: '14px',
    border: 'none',
    width: '90px',
    paddingLeft: '12px',
    gap: '10px',
};

export default {
    text: {
        borderColor: 'rgba(255,255,255,0.87)',
        fontSize: '15px',
    },
    textarea: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.87)',
        borderColor: 'rgba(255,255,255,0.2)',
        resize: 'vertical',
        minHeight: '30px',
    },
    log: {
        flexGrow: 1,
        overflow: 'auto',
        resize: 'vertical',
        marginTop: '4px',
        minHeight: '200px',
    },
    logText: {
        color: 'rgba(255,255,255,0.87)',
        fontFamily: 'monospace',
        fontSize: '13px',
    },
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '10px',
    },
    icon: {
        fill: 'rgba(255,255,255,0.87)',
    },
    buttonTextContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    startButton: {
        default: {
            backgroundColor: 'rgba(59, 76, 138,1)',
            ...buttonShared,
        },
        hover: {
            backgroundColor: 'rgba(64, 81, 143,1)',
            ...buttonShared,
        },
        press: {
            backgroundColor: 'rgba(67, 86, 156,1)',
            ...buttonShared,
        },
    },
    stopButton: {
        default: {
            backgroundColor: 'rgba(166,127,43,1)',
            ...buttonShared,
        },
        hover: {
            backgroundColor: 'rgba(161,127,53,1)',
            ...buttonShared,
        },
        press: {
            backgroundColor: 'rgba(158,129,65,1)',
            ...buttonShared,
        },
    },
};
