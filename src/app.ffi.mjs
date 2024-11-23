// app.ffi.ms
export const after = (ms, callback) => void window.setTimeout(callback, ms)

export const scrollToBottom = (divId) => {
    const div = document.getElementById(divId);
    div.scrollTo({
        top: div.scrollHeight,
        behavior: 'smooth'
    });
    // if (div) {
    //     div.style.transition = 'scroll-behavior 0.5s ease';
    //     div.scrollTop = div.scrollHeight;
    // }
};

export function observeContainer(container) {
    const observer = new MutationObserver(() => scrollToBottom(container));
    observer.observe(container, { childList: true, subtree: true });
    // Initial scroll to bottom
    scrollToBottom(container);
}

// PDF Download
export function downloadPDF() {
    const link = document.createElement('a');
    link.href = "/static/cv/CV%20Final.pdf"; // Ensure the correct path and encode spaces with %20
    link.download = "CV_Final.pdf"; // Set a filename for the download with safe characters

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// PDF In a new tab
export function openPDFInNewTab(link) {
    window.open("https://drive.google.com/file/d/1HJDEvwinORrVlJk80oL7NdPjmKcAhzO9/view", "_blank");
}
