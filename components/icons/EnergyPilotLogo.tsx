/**
 * EnergyPilot lightning bolt SVG logo — extracted from the Figma design.
 */
export function EnergyPilotLogo({
    size = 20,
    className,
}: {
    size?: number;
    className?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M4 17.5C3.614 17.5 3.261 17.28 3.095 16.932C2.928 16.583 2.977 16.17 3.22 15.87L13.12 5.67C13.273 5.494 13.528 5.446 13.734 5.557C13.94 5.667 14.042 5.905 13.98 6.13L12.06 12.15C11.945 12.458 11.988 12.802 12.176 13.071C12.364 13.341 12.672 13.501 13 13.5H20C20.386 13.499 20.739 13.72 20.905 14.068C21.072 14.417 21.023 14.83 20.78 15.13L10.88 25.33C10.727 25.507 10.472 25.554 10.266 25.444C10.06 25.333 9.958 25.095 10.02 24.87L11.94 18.85C12.055 18.542 12.012 18.198 11.824 17.929C11.636 17.659 11.328 17.499 11 17.5H4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
