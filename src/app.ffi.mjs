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
    link.href = "../../priv/static/cv/CV Final.pdf";
    link.download = "CV Final.pdf"; // Set a filename for the download

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
