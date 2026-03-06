/**
 * Toast notification system — shared across all pages.
 * Domain: UI Infrastructure
 *
 * Accessibility:
 *   - role="alert" for all toasts
 *   - aria-live="assertive" for errors, "polite" for success
 *   - Dismiss button with aria-label for keyboard/screen reader users
 *   - Max 5 visible toasts — oldest removed to prevent stack overflow
 */

const MAX_VISIBLE_TOASTS = 5;

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

    // Enforce max visible toasts — remove oldest first
    while (container.children.length >= MAX_VISIBLE_TOASTS) {
        container.firstElementChild?.remove();
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

    const text = document.createElement("span");
    text.textContent = displayMessage;
    toast.appendChild(text);

    // Dismiss button for keyboard/assistive tech users
    const dismiss = document.createElement("button");
    dismiss.className = "toast-dismiss";
    dismiss.setAttribute("aria-label", "Dismiss notification");
    dismiss.textContent = "×";
    dismiss.addEventListener("click", () => removeToast(toast));
    toast.appendChild(dismiss);

    container.appendChild(toast);

    // Auto-dismiss after 3s (5s for errors — more time to read)
    const duration = type === "error" ? 5000 : 3000;
    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast: HTMLElement): void {
    if (!toast.parentElement) return; // already removed
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
}
