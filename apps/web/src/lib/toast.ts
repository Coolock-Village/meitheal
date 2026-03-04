/**
 * Toast notification system — shared across all pages.
 * Domain: UI Infrastructure
 */

/** Show a toast notification */
export function showToast(
    message: string,
    type: "success" | "error" = "success",
): void {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    
    let displayMessage = message;
    // Attempt local i18n resolution mapped via Layout.astro <script is:inline>
    if (typeof window !== "undefined" && window.mI18n) {
        const translated = window.mI18n.get(message);
        if (translated && translated !== message) {
            displayMessage = translated;
        }
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = displayMessage;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "polite");
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
