/**
 * Debounce utility — delays function execution until after wait period.
 * Domain: UI Infrastructure
 */

export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}
