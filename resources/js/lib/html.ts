export function decodeHtmlEntities(text: string): string {
    if (typeof window === 'undefined') {
        return text;
    }

    const parsedDoc = new DOMParser().parseFromString(text, 'text/html');

    return parsedDoc.documentElement.textContent ?? text;
}
