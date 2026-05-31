export function resolvePickerDate(label: string): string {
    if (label === "Today") {
        return new Date().toISOString();
    }
    if (label === "Tomorrow") {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString();
    }
    // "Wed, 4 Jun" — parse day + month, use current year
    const [, dayStr, monthStr] = label.split(/,\s*|\s+/);
    const year = new Date().getFullYear();
    const parsed = new Date(`${dayStr} ${monthStr} ${year}`);
    return parsed.toISOString();
}