const buttonShared = {
    color: 'rgba(255,255,255,0.87)',
    fontSize: '14px',
    border: 'none',
    marginLeft: '8px',
    paddingLeft: '10px',
    paddingRight: '10px',
    whiteSpace: 'pre'
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
    startButton: {
        default: {
            backgroundColor: 'rgba(59, 76, 138,1)',
            ...buttonShared
        },
        hover: {
            backgroundColor: 'rgba(64, 81, 143,1)',
            ...buttonShared
        },
        press: {
            backgroundColor: 'rgba(67, 86, 156,1)',
            ...buttonShared
        },
    },
    stopButton: {
        default: {
            backgroundColor: 'rgba(166,127,43,1)',
            ...buttonShared
        },
        hover: {
            backgroundColor: 'rgba(161,127,53,1)',
            ...buttonShared
        },
        press: {
            backgroundColor: 'rgba(158,129,65,1)',
            ...buttonShared
        },
    },
};
